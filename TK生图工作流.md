---
created: 2026-06-24
tags: [项目, TK电商, 跨境电商, 生图, AI, 东南亚]
status: active
---

# TK电商生图工作流

> 上传产品图 → 自动识图 → 生成6类提示词 → AI生图 → 按类命名保存
> 目标市场：TikTok Shop 东南亚

## 🚀 快速启动

```bash
cd "D:/AI/shared/obsidian/100rmb-vault/projects/TK生图工作流"
.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8088
```

浏览器打开：**http://127.0.0.1:8088**

## ⚠️ 第一次使用

点击右上角 **⚙ 设置** 按钮，填入你的 OpenAI API Key，然后点击 **🔌 测试连接** 确认Key有效。

Key保存在本地（settings.json），只存D盘，不上传任何服务器。

## 工作流程

1. **上传产品图** — 拖拽或点击上传清晰的产品照片
2. **识图分析** — GPT-4o Vision 自动识别产品类型、材质、颜色、风格
3. **编辑提示词** — 6类提示词自动生成，可逐条修改
4. **一键生图** — gpt-image-1 生成6张电商图
5. **下载使用** — 图片自动命名保存，直接上传TK Listing

## 6类图片说明

| 类别 | 文件名 | TK上架用途 |
|------|--------|------------|
| 主图 | `主图.png` | Listing首图，白底/暖色渐变 |
| 场景图 | `场景图.png` | 东南亚生活场景佩戴展示 |
| 细节图 | `细节图.png` | 材质工艺特写，建立信任 |
| 参数图 | `参数图.png` | 规格可视化，减少退货 |
| 对比图 | `对比图.png` | 突出差异化卖点 |
| 模特图 | `模特图.png` | 东南亚模特佩戴，转化率最高 |

## 输出目录

生成的图片保存在 `outputs/产品名/` 下，例如：

```
outputs/
  └── 项链/
      ├── 主图.png
      ├── 场景图.png
      ├── 细节图.png
      ├── 参数图.png
      ├── 对比图.png
      ├── 模特图.png
      └── 提示词.txt
```

## 项目结构

```
TK生图工作流/
├── app.py              ← FastAPI主服务
├── config.yaml         ← API配置（Key、Provider）
├── requirements.txt    ← Python依赖
├── .venv/              ← Python虚拟环境（D盘，不在C盘）
├── providers/          ← 生图API接口层
├── analyzers/          ← GPT-4o Vision识图模块
├── prompts/            ← 6类东南亚风格提示词模板
├── static/             ← Web前端（HTML/CSS/JS）
├── outputs/            ← 生图结果保存目录
└── uploads/            ← 上传图片临时目录
```

## 后续扩展方向

- 批量处理（一次多张产品图全自动）
- 混合尺寸（主图方图1024x1024、模特图竖版1024x1792）
- 更多生图Provider（Replicate、Stability AI）
- TK Listing文案自动生成
- 历史记录和版本管理

---

*项目路径：`D:/AI/shared/obsidian/100rmb-vault/projects/TK生图工作流/`*
