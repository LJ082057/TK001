"""GPT-4o Vision识图分析模块 — 支持自定义base_url（第三方API代理）"""

import json
import base64
from pathlib import Path
from typing import Optional

from openai import AsyncOpenAI


# 识图分析的System Prompt
VISION_SYSTEM_PROMPT = """你是一个专业的电商产品图片分析师，专门为TikTok跨境电商（东南亚市场）服务。

你的任务是分析产品图片，提取关键信息用于生成电商Listing图片。

请严格按照以下JSON格式返回分析结果，不要添加任何额外文字：

{
  "product_name_zh": "中文产品名称（简洁，2-4字）",
  "product_name_en": "英文产品名称",
  "product_type": "产品大类（如：项链、戒指、手链、耳环等）",
  "material": "材质描述（如：925银、合金镀金、不锈钢等）",
  "color": "主要颜色",
  "color_secondary": "次要颜色或点缀色",
  "style": "风格描述（如：简约、复古、波西米亚、优雅等）",
  "key_features": ["特征1", "特征2", "特征3"],
  "detail_features": "细节特征描述（工艺、纹理、扣头类型等）",
  "target_audience": "目标人群描述",
  "price_positioning": "价格定位（budget/mid-range/premium）",
  "size_info": "尺寸信息（如能判断）",
  "weight_info": "重量信息（如能判断）",
  "cultural_notes_sea": "东南亚市场特别注意事项",
  "scene_suggestions": ["场景1", "场景2", "场景3"],
  "model_ethnicity": "适合的模特种族（如：Thai、Vietnamese、Filipino）",
  "bg_color_suggestion": "建议背景色（暖色调）"
}

注意：
1. 所有判断基于图片可见信息，无法确定的标注为"未知"
2. 东南亚市场偏好暖色调、生活化场景
3. product_name_zh 要简洁适合做文件夹名
4. key_features 至少提供3个"""


class VisionAnalyzer:
    """GPT-4o Vision产品图片分析器 — 支持自定义API代理"""

    def __init__(self, api_key: str, model: str = "gpt-4o", base_url: Optional[str] = None):
        """
        Args:
            api_key: OpenAI API Key（或第三方代理Key）
            model: 识图模型名称（如 gpt-4o, gpt-5.5 等）
            base_url: API代理地址（如 https://xiaoxinai.xyz/v1），为None则用官方地址
        """
        client_kwargs = {"api_key": api_key}
        if base_url:
            # 确保base_url格式正确（需要带/v1后缀）
            base_url = base_url.rstrip("/")
            if not base_url.endswith("/v1"):
                base_url = base_url + "/v1"
            client_kwargs["base_url"] = base_url

        self.client = AsyncOpenAI(**client_kwargs)
        self.model = model
        self.base_url = base_url or "https://api.openai.com/v1"

    async def analyze_image(self, image_path: str) -> dict:
        """
        分析产品图片，返回结构化信息

        Args:
            image_path: 产品图片的本地路径

        Returns:
            结构化分析结果字典
        """
        # 读取图片并编码为base64
        image_data = self._encode_image(image_path)

        # 获取图片的MIME类型
        mime_type = self._get_mime_type(image_path)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": VISION_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "请分析这张电商产品图片，提取所有关键信息用于TikTok东南亚市场Listing图片生成。",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}",
                            },
                        },
                    ],
                },
            ],
            max_tokens=1000,
            temperature=0.3,  # 低温度确保稳定分析
        )

        # 解析返回的JSON
        result_text = response.choices[0].message.content

        # 清理可能的markdown包裹
        result_text = result_text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()

        try:
            analysis = json.loads(result_text)
        except json.JSONDecodeError:
            # JSON解析失败，返回原始文本
            analysis = {
                "raw_text": result_text,
                "product_name_zh": "产品",
                "product_name_en": "product",
                "product_type": "未知",
                "material": "未知",
                "color": "未知",
                "style": "未知",
                "key_features": [],
                "detail_features": "未知",
                "target_audience": "未知",
                "price_positioning": "mid-range",
                "size_info": "未知",
                "weight_info": "未知",
                "cultural_notes_sea": "",
                "scene_suggestions": [],
                "model_ethnicity": "Thai",
                "bg_color_suggestion": "#F5E6D3",
            }

        return analysis

    def _encode_image(self, image_path: str) -> str:
        """将图片编码为base64字符串"""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _get_mime_type(self, image_path: str) -> str:
        """根据文件扩展名返回MIME类型"""
        ext = Path(image_path).suffix.lower()
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        return mime_map.get(ext, "image/jpeg")
