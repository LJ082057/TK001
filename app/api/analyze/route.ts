import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    const prompts = [
      {
        style: "Professional",
        prompt: "Professional product photography, clean white background, soft studio lighting from top-left, high-end commercial style, 8k resolution, ultra sharp focus, product perfectly centered, minimalist composition, depth of field, professional retouching",
        useCase: "Product catalog / Main image"
      },
      {
        style: "Lifestyle SEA",
        prompt: "Lifestyle product shot, vibrant tropical background, Southeast Asian aesthetic, warm golden hour lighting, natural soft shadows, eye-level angle, bamboo and plants decoration, bright and airy mood, Instagram-ready composition",
        useCase: "Social media / Lifestyle posts"
      },
      {
        style: "TikTok Viral",
        prompt: "TikTok viral product style, dynamic 45 degree angle, bold colorful gradient background, neon cyan and magenta accents, high energy, trending aesthetic, 9:16 vertical format, eye-catching composition, dramatic lighting, sparkles and glow effects",
        useCase: "TikTok videos / Ads"
      },
      {
        style: "Minimalist Clean",
        prompt: "Minimalist product photography, soft pastel background, clean composition, natural window lighting, muted colors, Scandinavian style, elegant and simple, negative space, high key lighting",
        useCase: "Brand website / Premium look"
      }
    ];

    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    return NextResponse.json({
      success: true,
      prompts: prompts,
      selected: selectedPrompt,
      analysis: {
        productType: "detected product",
        mainColors: ["primary", "secondary", "accent"],
        suggestedStyles: ["Professional", "Lifestyle", "TikTok Viral"]
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
