"""TK电商生图工作流 - FastAPI主服务 v1.3

支持自定义API代理（base_url），识图和生图共用同一个Key和代理。
设置通过Web界面配置，持久化到项目目录settings.json。
"""

import os
import sys
import json
import uuid
import shutil
import zipfile
import logging
import asyncio
from pathlib import Path
from typing import Optional
from datetime import datetime

# 确保项目目录在Python路径中
BASE_DIR_STR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR_STR not in sys.path:
    sys.path.insert(0, BASE_DIR_STR)

import yaml
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from analyzers.vision_analyzer import VisionAnalyzer
from prompts.templates import generate_all_prompts
from providers.base import get_provider

# 日志配置
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tk-image-gen")

# ============================================================
# 配置 & 目录
# ============================================================

BASE_DIR = Path(BASE_DIR_STR)
CONFIG_PATH = BASE_DIR / "config.yaml"
SETTINGS_PATH = BASE_DIR / "settings.json"  # 直接放项目目录
OUTPUTS_DIR = BASE_DIR / "outputs"
UPLOADS_DIR = BASE_DIR / "uploads"

# 占位符Key
PLACEHOLDER_KEYS = {"sk-你的OpenAI-API-Key", "sk-placeholder"}


def load_default_config() -> dict:
    """加载config.yaml作为默认配置"""
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


DEFAULT_CONFIG = load_default_config()


# ============================================================
# 设置管理 — 支持自定义base_url
# ============================================================

_in_memory_settings: dict = {}


def load_settings() -> dict:
    """加载用户设置：优先内存缓存 → 文件 → 空"""
    if _in_memory_settings:
        return _in_memory_settings.copy()
    try:
        if SETTINGS_PATH.exists():
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                _in_memory_settings.update(loaded)
                logger.info(f"✅ 从文件加载设置: {SETTINGS_PATH}")
                return loaded
    except Exception as e:
        logger.warning(f"⚠️ 读取设置文件失败: {e}")
    return {}


def save_settings(settings: dict) -> bool:
    """保存用户设置：更新内存 + 写入文件，返回是否文件写入成功"""
    _in_memory_settings.update(settings)
    file_ok = False
    try:
        with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(_in_memory_settings, f, ensure_ascii=False, indent=2)
        file_ok = True
        logger.info(f"✅ 设置已持久化到: {SETTINGS_PATH}")
    except Exception as e:
        logger.warning(f"⚠️ 设置文件写入失败（仅存内存）: {e}")
    return file_ok


def is_valid_api_key(key: str) -> bool:
    """检查API Key是否有效"""
    if not key:
        return False
    if key in PLACEHOLDER_KEYS:
        return False
    if key.startswith("sk-你的"):
        return False
    return True


def get_current_api_key() -> str:
    """获取当前API Key"""
    settings = load_settings()
    key = settings.get("api_key", "")
    if is_valid_api_key(key):
        return key
    return DEFAULT_CONFIG["openai"]["api_key"]


def get_current_base_url() -> str:
    """获取当前API代理地址（用户设置 > config.yaml > 默认官方）"""
    settings = load_settings()
    base_url = settings.get("base_url", "")
    if base_url:
        return base_url
    # config.yaml里如果有就用它
    cfg_base = DEFAULT_CONFIG.get("openai", {}).get("base_url", "")
    if cfg_base:
        return cfg_base
    return ""  # 空字符串表示用官方地址


def get_current_vision_model() -> str:
    """获取识图模型（用户设置 > config.yaml）"""
    settings = load_settings()
    return settings.get("vision_model", DEFAULT_CONFIG["openai"]["vision_model"])


def get_current_image_model() -> str:
    """获取生图模型"""
    settings = load_settings()
    return settings.get("image_model", DEFAULT_CONFIG["openai"]["image_model"])


def get_current_image_size() -> str:
    """获取图片尺寸"""
    settings = load_settings()
    return settings.get("image_size", "1024x1024")


def get_current_target_market() -> str:
    """获取目标市场"""
    settings = load_settings()
    return settings.get("target_market", "southeast_asia")


def format_base_url(base_url: str) -> str:
    """格式化base_url：确保带/v1后缀"""
    if not base_url:
        return ""
    base_url = base_url.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = base_url + "/v1"
    return base_url


# 确保目录存在
OUTPUTS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)


# ============================================================
# 动态创建API客户端 — 识图和生图共用Key + base_url
# ============================================================

def create_vision_analyzer() -> VisionAnalyzer:
    """创建VisionAnalyzer，用用户设置的Key + base_url + model"""
    api_key = get_current_api_key()
    model = get_current_vision_model()
    base_url = get_current_base_url()
    formatted_url = format_base_url(base_url) if base_url else None
    logger.info(f"🔍 VisionAnalyzer: model={model}, base_url={formatted_url or '官方'}, key={api_key[:8]}...")
    return VisionAnalyzer(api_key=api_key, model=model, base_url=formatted_url)


def create_image_provider():
    """创建ImageProvider，用用户设置的Key + base_url + model"""
    api_key = get_current_api_key()
    image_model = get_current_image_model()
    base_url = get_current_base_url()
    provider_config = DEFAULT_CONFIG.get("openai", {}).copy()
    provider_config["api_key"] = api_key
    provider_config["image_model"] = image_model
    provider_config["image_size"] = get_current_image_size()
    if base_url:
        provider_config["base_url"] = base_url
    logger.info(f"🎨 ImageProvider: model={image_model}, base_url={base_url or '官方'}, key={api_key[:8]}...")
    return get_provider("openai", provider_config)


# ============================================================
# 会话管理
# ============================================================

sessions: dict = {}
generate_progress: dict[str, asyncio.Queue] = {}


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(title="TK电商生图工作台", version="1.3.0")


@app.on_event("startup")
async def startup_event():
    """启动时：加载设置文件 + 验证写入能力"""
    global _in_memory_settings
    if SETTINGS_PATH.exists():
        try:
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                _in_memory_settings = json.load(f)
            key = _in_memory_settings.get("api_key", "N/A")
            burl = _in_memory_settings.get("base_url", "官方")
            logger.info(f"✅ 启动加载设置: key={key[:8]}..., base_url={burl}")
        except Exception as e:
            logger.warning(f"⚠️ 启动加载设置失败: {e}")
    else:
        logger.info("ℹ️ 无设置文件，将在首次保存时创建")
    # 验证写入
    try:
        test_path = BASE_DIR / "_write_test.tmp"
        with open(test_path, "w") as f:
            f.write("ok")
        test_path.unlink()
        logger.info(f"✅ 项目目录可写: {BASE_DIR}")
    except Exception as e:
        logger.warning(f"⚠️ 项目目录不可写: {e}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")


# ============================================================
# 设置接口
# ============================================================

@app.get("/api/settings")
async def get_settings_api():
    """获取当前设置"""
    api_key = get_current_api_key()
    masked_key = ""
    if api_key and len(api_key) > 10:
        masked_key = api_key[:6] + "..." + api_key[-4:]
    elif api_key:
        masked_key = api_key[:6] + "..."

    base_url = get_current_base_url()

    return JSONResponse({
        "api_key_set": is_valid_api_key(api_key),
        "api_key_masked": masked_key,
        "base_url": base_url,
        "vision_model": get_current_vision_model(),
        "image_model": get_current_image_model(),
        "image_size": get_current_image_size(),
        "target_market": get_current_target_market(),
        "settings_file": str(SETTINGS_PATH),
        "settings_file_exists": SETTINGS_PATH.exists(),
    })


@app.put("/api/settings")
async def update_settings_api(settings_data: dict):
    """更新设置"""
    # API Key验证
    if "api_key" in settings_data:
        new_key = settings_data["api_key"].strip()
        try:
            new_key.encode("ascii")
        except UnicodeEncodeError:
            raise HTTPException(status_code=400, detail="API Key只能包含英文字符")
        settings_data["api_key"] = new_key

    # base_url格式化
    if "base_url" in settings_data:
        burl = settings_data["base_url"].strip()
        # 去掉末尾斜杠和/v1，保存时只存根路径
        burl = burl.rstrip("/")
        if burl.endswith("/v1"):
            burl = burl[:-3]
        settings_data["base_url"] = burl

    current = load_settings()
    current.update(settings_data)
    file_ok = save_settings(current)

    api_key = get_current_api_key()
    masked_key = ""
    if api_key and len(api_key) > 10:
        masked_key = api_key[:6] + "..." + api_key[-4:]

    return JSONResponse({
        "api_key_set": is_valid_api_key(api_key),
        "api_key_masked": masked_key,
        "base_url": get_current_base_url(),
        "vision_model": get_current_vision_model(),
        "image_model": get_current_image_model(),
        "image_size": get_current_image_size(),
        "target_market": get_current_target_market(),
        "file_saved": file_ok,
        "message": "设置已保存并持久化" if file_ok else "设置已保存（仅内存，重启后需重新设置）",
    })


@app.post("/api/test-connection")
async def test_connection():
    """测试API连接（支持自定义base_url）"""
    api_key = get_current_api_key()
    if not is_valid_api_key(api_key):
        return JSONResponse({"status": "error", "message": "请先在设置中配置有效的API Key"})

    base_url = get_current_base_url()
    # 确定测试URL
    if base_url:
        formatted = format_base_url(base_url)
        test_url = f"{formatted}/models"
    else:
        test_url = "https://api.openai.com/v1/models"

    try:
        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                test_url,
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if resp.status_code == 200:
                models = resp.json().get("data", [])
                model_ids = [m["id"] for m in models]
                has_vision = any("gpt-4o" in m or "gpt-5" in m or "claude" in m for m in model_ids)
                has_image = any("gpt-image" in m or "dall-e" in m for m in model_ids)

                details = []
                details.append(f"📡 API代理: {base_url or 'OpenAI官方'}")
                details.append(f"📋 可用模型({len(model_ids)}): {', '.join(model_ids[:10])}")
                if has_vision:
                    details.append("✅ 识图模型可用")
                else:
                    details.append("⚠️ 识图模型未找到（可能需要开通或使用其他模型名）")
                if has_image:
                    details.append("✅ 生图模型可用")
                else:
                    details.append("⚠️ 生图模型未找到")

                # 尝试实际调用识图模型（简单的文本测试）
                vision_model = get_current_vision_model()
                chat_url = f"{formatted if base_url else 'https://api.openai.com/v1'}/chat/completions"
                try:
                    chat_resp = await client.post(
                        chat_url,
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": vision_model,
                            "messages": [{"role": "user", "content": "Hi"}],
                            "max_tokens": 10,
                        },
                        timeout=20,
                    )
                    if chat_resp.status_code == 200:
                        details.append(f"✅ 识图模型({vision_model})实际调用成功")
                    else:
                        err_data = chat_resp.json() if chat_resp.headers.get("content-type", "").startswith("application/json") else {}
                        err_msg = err_data.get("error", {}).get("message", f"HTTP {chat_resp.status_code}")
                        details.append(f"⚠️ 识图模型({vision_model})调用失败: {err_msg}")
                except Exception as e:
                    details.append(f"⚠️ 识图模型测试超时或出错: {str(e)[:50]}")

                return JSONResponse({
                    "status": "success",
                    "message": "API Key有效，连接正常",
                    "details": details,
                })
            elif resp.status_code == 401:
                return JSONResponse({"status": "error", "message": f"API Key无效（401认证失败）。代理: {base_url or '官方'}"})
            else:
                err_body = resp.text[:200]
                return JSONResponse({"status": "error", "message": f"连接异常：HTTP {resp.status_code}。{err_body}"})
    except httpx.ConnectError:
        return JSONResponse({"status": "error", "message": f"网络连接失败，无法访问{test_url}（可能需要代理）"})
    except Exception as e:
        return JSONResponse({"status": "error", "message": f"测试失败：{str(e)}"})


# ============================================================
# 核心业务路由
# ============================================================

@app.get("/")
async def index():
    return FileResponse(str(BASE_DIR / "static" / "index.html"))


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """通用图片上传接口 — 保存产品图并返回路径供后续使用"""
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    upload_id = str(uuid.uuid4())[:8]
    image_filename = f"{upload_id}{file_ext}"
    image_path = UPLOADS_DIR / image_filename

    content = await file.read()
    with open(image_path, "wb") as f:
        f.write(content)

    logger.info(f"📷 图片已上传: {image_path} ({len(content)} bytes)")
    return JSONResponse({
        "filename": image_filename,
        "image_path": str(image_path),
        "url": f"/uploads/{image_filename}",
    })


@app.post("/api/manual-analyze")
async def manual_analyze(request: Request):
    """手动填写产品信息 → 生成6类提示词（不需要AI识图）"""
    product_info = await request.json()
    api_key = get_current_api_key()
    if not is_valid_api_key(api_key):
        raise HTTPException(status_code=400, detail="请先在设置中配置有效的API Key")

    # 构造结构化产品信息（兼容缺失字段）
    analysis = {
        "product_name_zh": product_info.get("product_name_zh", "产品"),
        "product_name_en": product_info.get("product_name_en", "product"),
        "product_type": product_info.get("product_type", "饰品"),
        "material": product_info.get("material", "未知"),
        "color": product_info.get("color", "未知"),
        "color_secondary": product_info.get("color_secondary", ""),
        "style": product_info.get("style", "简约"),
        "key_features": product_info.get("key_features", ["精美设计", "高品质", "百搭"]),
        "detail_features": product_info.get("detail_features", "未知"),
        "target_audience": product_info.get("target_audience", "年轻女性"),
        "price_positioning": product_info.get("price_positioning", "mid-range"),
        "size_info": product_info.get("size_info", "未知"),
        "weight_info": product_info.get("weight_info", "未知"),
        "cultural_notes_sea": product_info.get("cultural_notes_sea", "东南亚年轻女性喜爱纤细款式"),
        "scene_suggestions": product_info.get("scene_suggestions", ["泰式咖啡馆", "热带花园", "海滩日落"]),
        "model_ethnicity": product_info.get("model_ethnicity", "Thai"),
        "bg_color_suggestion": product_info.get("bg_color_suggestion", "#F5E6D3 warm peach"),
    }

    # 如果key_features是字符串，转成列表
    if isinstance(analysis["key_features"], str):
        analysis["key_features"] = [f.strip() for f in analysis["key_features"].split(",") if f.strip()]

    # 生成6类提示词
    prompts = generate_all_prompts(analysis)

    # 创建会话
    session_id = str(uuid.uuid4())[:8]
    final_product_name = product_info.get("product_name", analysis["product_name_zh"])

    # 如果有上传图片路径，使用它
    manual_image_path = product_info.get("image_path", "")

    sessions[session_id] = {
        "id": session_id,
        "product_name": final_product_name,
        "image_path": manual_image_path,
        "analysis": analysis,
        "prompts": prompts,
        "generated_images": {},
        "status": "analyzed",
        "mode": "manual",
    }

    # 创建产品输出文件夹
    product_dir = OUTPUTS_DIR / final_product_name
    product_dir.mkdir(exist_ok=True)

    return JSONResponse({
        "session_id": session_id,
        "product_name": final_product_name,
        "analysis": analysis,
        "prompts": prompts,
        "status": "analyzed",
        "mode": "manual",
    })


@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    product_name: Optional[str] = None,
):
    """上传产品图 → 识图分析 → 生成6类提示词"""
    api_key = get_current_api_key()
    if not is_valid_api_key(api_key):
        raise HTTPException(status_code=400, detail="请先在设置中配置有效的API Key（点击右上角⚙设置）")

    # 保存上传图片
    session_id = str(uuid.uuid4())[:8]
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    image_filename = f"{session_id}{file_ext}"
    image_path = UPLOADS_DIR / image_filename

    content = await file.read()
    with open(image_path, "wb") as f:
        f.write(content)

    logger.info(f"📷 图片已保存: {image_path} ({len(content)} bytes)")

    # 动态创建VisionAnalyzer
    analyzer = create_vision_analyzer()

    try:
        analysis = await analyzer.analyze_image(str(image_path))
        logger.info(f"✅ 识图成功: {analysis.get('product_name_zh', '未知')} / {analysis.get('product_type', '未知')}")
    except UnicodeEncodeError:
        raise HTTPException(status_code=500, detail="编码错误：请求中包含非ASCII字符。请检查API Key是否为纯英文。")
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ 识图失败: {error_msg}")
        if "401" in error_msg or "Incorrect API key" in error_msg:
            raise HTTPException(status_code=401, detail=f"API Key无效。代理: {get_current_base_url() or '官方'}")
        if "Connection" in error_msg or "timeout" in error_msg.lower():
            raise HTTPException(status_code=503, detail=f"无法连接API（代理: {get_current_base_url() or '官方'}，可能需要网络检查）")
        if "unavailable" in error_msg.lower():
            raise HTTPException(status_code=503, detail=f"API服务暂时不可用（代理: {get_current_base_url() or '官方'}，可能是模型未开通或服务维护）")
        raise HTTPException(status_code=500, detail=f"识图失败：{error_msg}")

    # 生成6类提示词
    prompts = generate_all_prompts(analysis)

    final_product_name = product_name or analysis.get("product_name_zh", "产品")

    # 创建会话
    sessions[session_id] = {
        "id": session_id,
        "product_name": final_product_name,
        "image_path": str(image_path),
        "analysis": analysis,
        "prompts": prompts,
        "generated_images": {},
        "status": "analyzed",
    }

    # 创建产品输出文件夹
    product_dir = OUTPUTS_DIR / final_product_name
    product_dir.mkdir(exist_ok=True)

    return JSONResponse({
        "session_id": session_id,
        "product_name": final_product_name,
        "analysis": analysis,
        "prompts": prompts,
        "status": "analyzed",
    })


@app.put("/api/prompts/{session_id}")
async def update_prompts(session_id: str, prompts_data: dict):
    """更新提示词"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="会话不存在")

    session = sessions[session_id]
    for category, data in prompts_data.items():
        if category in session["prompts"]:
            session["prompts"][category]["prompt"] = data.get("prompt", session["prompts"][category]["prompt"])

    return JSONResponse({
        "session_id": session_id,
        "prompts": session["prompts"],
        "status": session["status"],
    })


# ============================================================
# 并发生图 + SSE 进度推送
# ============================================================

async def _generate_one_image(
    session_id: str,
    category: str,
    prompt: str,
    product_dir: Path,
    product_name: str,
    provider,
    image_size: str,
    reference_image_path: str = "",
) -> dict:
    """生成单张图片的协程任务"""
    logger.info(f"🎨 [{session_id}] 开始生成 {category}")
    try:
        # 如果有参考图且provider支持，使用参考图生成以保持产品一致性
        if reference_image_path and os.path.exists(reference_image_path):
            try:
                image_urls = await provider.generate_with_reference(
                    prompt=prompt,
                    reference_image_path=reference_image_path,
                    size=image_size,
                    quality="high",
                    n=1,
                )
            except Exception as ref_err:
                logger.warning(f"⚠️ 参考图生成失败，fallback到普通生成: {ref_err}")
                image_urls = await provider.generate_image(
                    prompt=prompt,
                    size=image_size,
                    quality="high",
                    n=1,
                )
        else:
            image_urls = await provider.generate_image(
                prompt=prompt,
                size=image_size,
                quality="high",
                n=1,
            )

        if image_urls:
            save_path = product_dir / f"{category}.png"
            local_path = await provider.download_image(image_urls[0], str(save_path))
            logger.info(f"✅ [{session_id}] {category} 生成成功")
            return {
                "category": category,
                "success": True,
                "data": {
                    "file_path": local_path,
                    "file_name": f"{category}.png",
                    "url": f"/outputs/{product_name}/{category}.png",
                    "prompt": prompt,
                },
            }
        else:
            return {"category": category, "success": False, "error": "API返回空结果"}
    except Exception as e:
        logger.error(f"❌ [{session_id}] {category} 生成失败: {e}")
        return {"category": category, "success": False, "error": str(e)}
    finally:
        # 通知进度
        if session_id in generate_progress:
            try:
                generate_progress[session_id].put_nowait({"category": category})
            except Exception:
                pass


@app.post("/api/generate/{session_id}")
async def generate_images(session_id: str):
    """批量生成6类图片 — 6张并发同时跑"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="会话不存在")

    api_key = get_current_api_key()
    if not is_valid_api_key(api_key):
        raise HTTPException(status_code=400, detail="请先配置有效的API Key")

    session = sessions[session_id]
    product_name = session["product_name"]
    product_dir = OUTPUTS_DIR / product_name

    session["status"] = "generating"

    # 初始化进度队列
    generate_progress[session_id] = asyncio.Queue()

    provider = create_image_provider()
    image_size = get_current_image_size()
    reference_image_path = session.get("image_path", "")

    # 创建6个并发任务
    tasks = []
    for category, prompt_info in session["prompts"].items():
        tasks.append(
            _generate_one_image(
                session_id=session_id,
                category=category,
                prompt=prompt_info["prompt"],
                product_dir=product_dir,
                product_name=product_name,
                provider=provider,
                image_size=image_size,
                reference_image_path=reference_image_path,
            )
        )

    # 并发执行所有任务
    task_results = await asyncio.gather(*tasks, return_exceptions=True)

    results = {}
    errors = []
    for r in task_results:
        if isinstance(r, Exception):
            errors.append(str(r))
            continue
        if r["success"]:
            results[r["category"]] = r["data"]
        else:
            errors.append(f"{r['category']}: {r['error']}")

    # 保存提示词文件
    prompts_text = ""
    for category, prompt_info in session["prompts"].items():
        prompts_text += f"【{category}】({prompt_info['description_zh']})\n"
        prompts_text += f"{prompt_info['prompt']}\n\n"
    prompts_file = product_dir / "提示词.txt"
    with open(prompts_file, "w", encoding="utf-8") as f:
        f.write(prompts_text)

    session["generated_images"] = results
    session["status"] = "completed"

    # 标记进度完成
    if session_id in generate_progress:
        try:
            generate_progress[session_id].put_nowait({"done": True})
        except Exception:
            pass

    return JSONResponse({
        "session_id": session_id,
        "product_name": product_name,
        "results": results,
        "errors": errors,
        "status": "completed",
    })


@app.get("/api/generate-progress/{session_id}")
async def generate_progress_sse(session_id: str):
    """SSE 实时推送生图进度"""
    async def event_generator():
        completed = 0
        if session_id not in generate_progress:
            yield f"data: {json.dumps({'completed': 0, 'total': 6})}\n\n"
            return

        queue = generate_progress[session_id]
        while True:
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=120)
                if msg.get("done"):
                    yield f"data: {json.dumps({'completed': 6, 'total': 6, 'done': True})}\n\n"
                    break
                else:
                    completed += 1
                    yield f"data: {json.dumps({'completed': completed, 'total': 6})}\n\n"
            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'completed': completed, 'total': 6, 'timeout': True})}\n\n"
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.post("/api/generate-single/{session_id}/{category}")
async def generate_single_image(session_id: str, category: str):
    """单张生成"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="会话不存在")

    api_key = get_current_api_key()
    if not is_valid_api_key(api_key):
        raise HTTPException(status_code=400, detail="请先配置有效的API Key")

    session = sessions[session_id]
    if category not in session["prompts"]:
        raise HTTPException(status_code=404, detail=f"类别不存在: {category}")

    provider = create_image_provider()
    product_name = session["product_name"]
    product_dir = OUTPUTS_DIR / product_name
    prompt = session["prompts"][category]["prompt"]

    try:
        image_urls = await provider.generate_image(prompt=prompt, size=get_current_image_size(), quality="high", n=1)
        if image_urls:
            save_path = product_dir / f"{category}.png"
            local_path = await provider.download_image(image_urls[0], str(save_path))
            session["generated_images"][category] = {
                "file_path": local_path,
                "file_name": f"{category}.png",
                "url": f"/outputs/{product_name}/{category}.png",
                "prompt": prompt,
            }
            return JSONResponse({
                "category": category,
                "url": f"/outputs/{product_name}/{category}.png",
                "prompt": prompt,
                "status": "success",
            })
        else:
            return JSONResponse({"category": category, "status": "failed", "error": "API返回空结果"})
    except Exception as e:
        return JSONResponse({"category": category, "status": "failed", "error": str(e)})


@app.get("/api/results/{session_id}")
async def get_results(session_id: str):
    """获取生成结果"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="会话不存在")
    session = sessions[session_id]
    return JSONResponse({
        "session_id": session_id,
        "product_name": session["product_name"],
        "analysis": session["analysis"],
        "prompts": session["prompts"],
        "generated_images": session["generated_images"],
        "status": session["status"],
    })


@app.get("/api/download/{product_name}")
async def download_all(product_name: str):
    """下载产品文件夹所有图片为ZIP"""
    product_dir = OUTPUTS_DIR / product_name
    if not product_dir.exists():
        raise HTTPException(status_code=404, detail="产品文件夹不存在")

    zip_path = OUTPUTS_DIR / f"{product_name}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in product_dir.iterdir():
            if file.is_file():
                zf.write(file, file.name)

    return FileResponse(
        str(zip_path),
        media_type="application/zip",
        filename=f"{product_name}.zip",
    )


@app.get("/api/sessions")
async def list_sessions():
    """列出所有会话"""
    return JSONResponse({
        "sessions": [
            {"id": s["id"], "product_name": s["product_name"], "status": s["status"]}
            for s in sessions.values()
        ]
    })


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """删除会话"""
    if session_id in sessions:
        del sessions[session_id]
    return JSONResponse({"status": "deleted"})


# ============================================================
# 启动
# ============================================================

if __name__ == "__main__":
    import uvicorn
    print("🚀 TK电商生图工作台 v1.3 启动中...")
    print(f"📍 http://localhost:8088")
    print(f"💡 请在Web界面设置中配置API Key和代理地址")
    uvicorn.run(app, host="127.0.0.1", port=8088)
