import { NextResponse } from "next/server";

const promptOptions = [
  {
    id: "professional",
    name: "专业产品图",
    desc: "纯白背景，专业摄影风格",
    prompt: "Professional product photography, clean white background, soft studio lighting from top-left, high-end commercial style, 8k resolution, ultra sharp focus, product perfectly centered, minimalist composition, depth of field, professional retouching",
    icon: "📸"
  },
  {
    id: "lifestyle",
    name: "东南亚生活风",
    desc: "热带风情，生活化场景",
    prompt: "Lifestyle product shot, vibrant tropical background, Southeast Asian aesthetic, warm golden hour lighting, natural soft shadows, eye-level angle, bamboo and plants decoration, bright and airy mood, Instagram-ready composition",
    icon: "🌴"
  },
  {
    id: "tiktok",
    name: "TikTok爆款风",
    desc: "动感潮流，吸睛配色",
    prompt: "TikTok viral product style, dynamic 45 degree angle, bold colorful gradient background, neon cyan and magenta accents, high energy, trending aesthetic, 9:16 vertical format, eye-catching composition, dramatic lighting, sparkles and glow effects",
    icon: "🔥"
  },
  {
    id: "minimalist",
    name: "极简清新",
    desc: "柔和配色，简约优雅",
    prompt: "Minimalist product photography, soft pastel background, clean composition, natural window lighting, muted colors, Scandinavian style, elegant and simple, negative space, high key lighting",
    icon: "✨"
  }
];

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "请上传图片" },
        { status: 400 }
      );
    }

    const selectedPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];

    return NextResponse.json({
      success: true,
      prompts: promptOptions,
      selected: selectedPrompt,
      analysis: {
        productType: "检测到产品图片",
        mainColors: ["主要颜色", "次要颜色", "点缀色"],
        suggestedStyles: ["专业产品图", "东南亚生活风", "TikTok爆款风"]
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "图片分析失败" },
      { status: 500 }
    );
  }
}
