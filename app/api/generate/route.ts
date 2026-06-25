import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, style } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const colors: Record<string, string[]> = {
      Professional: ["#FFFFFF", "#F5F5F5", "#333333"],
      "Lifestyle SEA": ["#06D6A0", "#FFD166", "#EF476F"],
      "TikTok Viral": ["#25F4EE", "#FE2C55", "#FF0050"],
      "Minimalist Clean": ["#FAF9F6", "#E8E4E1", "#8B8680"]
    };

    const colorSet = colors[style as keyof typeof colors] || colors["TikTok Viral"];

    return NextResponse.json({
      success: true,
      imageUrl: null,
      style: style || "TikTok Viral",
      promptUsed: prompt,
      colors: colorSet,
      dimensions: {
        width: 1024,
        height: 1024
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
