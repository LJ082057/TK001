# TK001 - AI Product Image Generator for TikTok SEA

AI-powered product image generation tool tailored for TikTok Shop sellers in Southeast Asia.

## Features

- 📤 Upload product image
- 🤖 AI analyzes and generates optimized prompts
- 🎨 Multiple style options (Professional, Lifestyle SEA, TikTok Viral, Minimalist)
- 🖼️ Generate high-quality product images
- ⚡ Fast generation with real-time preview
- 📱 TikTok-optimized dimensions

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
npm start
```

## How It Works

1. **Upload** your product photo
2. **Analyze** - AI identifies product features and generates optimized prompts
3. **Customize** - Edit the prompt or choose different styles
4. **Generate** - Create beautiful product images with AI
5. **Download** - Save and use for your TikTok Shop

## API Integration

To use real AI services, add your API keys to `.env.local`:

```
OPENAI_API_KEY=your_key_here
STABLE_DIFFUSION_API_KEY=your_key_here
```

## Project Structure

```
app/
├── api/
│   ├── analyze/route.ts    # Image analysis API
│   └── generate/route.ts   # Image generation API
├── page.tsx                # Main page
├── layout.tsx              # Root layout
└── globals.css             # Global styles
```

## License

MIT
