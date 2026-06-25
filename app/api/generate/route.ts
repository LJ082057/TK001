import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, style } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "请提供提示词" },
        { status: 400 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    return NextResponse.json({
      success: true,
      imageUrl: null,
      style: style || "TikTok爆款风",
      promptUsed: prompt,
      colors: ["#25F4EE", "#FE2C55", "#FF0050"],
      dimensions: {
        width: 1024,
        height: 1024
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "图片生成失败" },
      { status: 500 }
    );
  }
}
