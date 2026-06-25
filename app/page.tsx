"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, Image, Download, RefreshCw, Wand2, Zap } from "lucide-react";

type Step = "upload" | "analyzing" | "prompt" | "generating" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const analyzeImage = async () => {
    if (!uploadedImage) return;
    setStep("analyzing");

    setTimeout(() => {
      const prompts = [
        "Professional product photography, clean white background, soft studio lighting, high-end commercial style, 8k resolution, sharp focus, product centered, minimalist composition",
        "Lifestyle product shot, vibrant tropical background, Southeast Asian aesthetic, warm golden hour lighting, natural shadows, eye-level angle, Instagram-ready composition",
        "TikTok viral product style, dynamic angle, bold colorful background, neon accents, high energy, trending aesthetic, 9:16 vertical format, eye-catching composition"
      ];
      setGeneratedPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
      setStep("prompt");
    }, 2000);
  };

  const generateImage = async () => {
    setStep("generating");
    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, "#25F4EE");
        gradient.addColorStop(0.5, "#FFFFFF");
        gradient.addColorStop(1, "#FE2C55");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        ctx.fillStyle = "#161823";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("AI Generated", 256, 240);
        ctx.font = "20px Arial";
        ctx.fillText("Product Image Demo", 256, 280);
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, 412, 412);
      }
      setGeneratedImage(canvas.toDataURL());
      setStep("result");
    }, 3000);
  };

  const regenerate = () => {
    setStep("generating");
    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const colors = [
          ["#FF6B6B", "#FFE66D", "#4ECDC4"],
          ["#A855F7", "#EC4899", "#F59E0B"],
          ["#3B82F6", "#10B981", "#FBBF24"],
          ["#EF4444", "#F97316", "#EAB308"]
        ];
        const set = colors[Math.floor(Math.random() * colors.length)];
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, set[0]);
        gradient.addColorStop(0.5, set[1]);
        gradient.addColorStop(1, set[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.fillText("New Version", 256, 250);
        ctx.font = "18px Arial";
        ctx.fillText(`Generated at ${new Date().toLocaleTimeString()}`, 256, 290);
      }
      setGeneratedImage(canvas.toDataURL());
      setStep("result");
    }, 2000);
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.download = "ai-generated-product.png";
      link.href = generatedImage;
      link.click();
    }
  };

  const reset = () => {
    setStep("upload");
    setUploadedImage(null);
    setGeneratedPrompt("");
    setGeneratedImage(null);
  };

  return (
    <div className="min-h-screen bg-tiktok-dark text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="size-8 text-tiktok-cyan" />
            <h1 className="text-4xl font-bold">
              <span className="text-tiktok-gradient">TK AI Image</span>
            </h1>
            <Sparkles className="size-8 text-tiktok-red" />
          </div>
          <p className="text-tiktok-gray text-lg">
            Upload your product photo → AI generates prompt → Create viral TikTok images
          </p>
        </header>

        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              {["Upload", "Analyze", "Generate"].map((label, i) => {
                const stepIndex = ["upload", "analyzing", "prompt", "generating", "result"].indexOf(step);
                const isActive = i <= (stepIndex >= 2 ? 2 : stepIndex);
                const isCurrent = i === (stepIndex >= 2 ? 2 : stepIndex);
                return (
                  <div key={label} className="flex items-center">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      isActive ? "bg-tiktok-gradient text-white" : "bg-gray-800 text-tiktok-gray"
                    } ${isCurrent ? "ring-2 ring-white ring-opacity-50" : ""}`}>
                      <span className="font-bold">{i + 1}</span>
                      <span>{label}</span>
                    </div>
                    {i < 2 && (
                      <div className={`w-12 h-1 mx-2 rounded ${
                        i < (stepIndex >= 2 ? 2 : stepIndex) ? "bg-tiktok-gradient" : "bg-gray-700"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {step === "upload" && (
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                isDragging 
                  ? "border-tiktok-cyan bg-tiktok-cyan/10" 
                  : "border-gray-600 hover:border-tiktok-red hover:bg-tiktok-red/5"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              {uploadedImage ? (
                <div className="space-y-4">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-h-64 mx-auto rounded-lg shadow-xl"
                  />
                  <p className="text-tiktok-gray">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                    <Upload className="size-10 text-tiktok-cyan" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold mb-2">Drop your product image here</p>
                    <p className="text-tiktok-gray">or click to browse files</p>
                  </div>
                  <p className="text-sm text-tiktok-gray/70">
                    Supports JPG, PNG, WebP • Max 10MB
                  </p>
                </div>
              )}
            </div>
          )}

          {(step === "analyzing" || step === "prompt" || step === "generating" || step === "result") && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Image className="size-5 text-tiktok-cyan" />
                  Original Product
                </h3>
                {uploadedImage && (
                  <img 
                    src={uploadedImage} 
                    alt="Original" 
                    className="w-full rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-4">
                {step === "analyzing" && (
                  <div className="bg-gray-800/50 rounded-xl p-6 text-center">
                    <div className="mb-4">
                      <Wand2 className="size-12 mx-auto text-tiktok-red animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">AI is analyzing...</h3>
                    <p className="text-tiktok-gray">Identifying product features and style</p>
                    <div className="mt-4 flex justify-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i}
                          className="w-3 h-3 rounded-full bg-tiktok-red animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {step === "prompt" && (
                  <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="size-5 text-tiktok-red" />
                      AI Generated Prompt
                    </h3>
                    <textarea
                      value={generatedPrompt}
                      onChange={(e) => setGeneratedPrompt(e.target.value)}
                      className="w-full h-32 bg-gray-900 rounded-lg p-3 text-sm text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-tiktok-cyan"
                    />
                    <button
                      onClick={generateImage}
                      className="w-full py-3 rounded-lg bg-tiktok-gradient text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Zap className="size-5" />
                      Generate Image
                    </button>
                  </div>
                )}

                {step === "generating" && (
                  <div className="bg-gray-800/50 rounded-xl p-6 text-center">
                    <div className="mb-4">
                      <RefreshCw className="size-12 mx-auto text-tiktok-cyan animate-spin" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Creating your image...</h3>
                    <p className="text-tiktok-gray">AI is working on the perfect product shot</p>
                    <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-tiktok-gradient h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  </div>
                )}

                {step === "result" && generatedImage && (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="size-5 text-tiktok-cyan" />
                        Generated Image
                      </h3>
                      <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="w-full rounded-lg"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={regenerate}
                        className="flex-1 py-3 rounded-lg border border-tiktok-cyan text-tiktok-cyan font-semibold hover:bg-tiktok-cyan/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="size-5" />
                        Regenerate
                      </button>
                      <button
                        onClick={downloadImage}
                        className="flex-1 py-3 rounded-lg bg-tiktok-gradient text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <Download className="size-5" />
                        Download
                      </button>
                    </div>
                    <button
                      onClick={reset}
                      className="w-full py-3 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "upload" && uploadedImage && (
            <div className="text-center">
              <button
                onClick={analyzeImage}
                className="px-12 py-4 rounded-xl bg-tiktok-gradient text-white text-xl font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-3"
              >
                <Wand2 className="size-6" />
                Analyze & Generate Prompt
              </button>
            </div>
          )}
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: "⚡", title: "Lightning Fast", desc: "Generate product images in seconds with AI" },
            { icon: "🎯", title: "TikTok Optimized", desc: "Perfect size and style for TikTok Shop" },
            { icon: "🌏", title: "SEA Focused", desc: "Tailored for Southeast Asian markets" }
          ].map((feature, i) => (
            <div key={i} className="bg-gray-800/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-tiktok-gray text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        <footer className="mt-16 text-center text-tiktok-gray text-sm pb-8">
          <p>Made with ❤️ for TikTok Sellers in Southeast Asia</p>
        </footer>
      </div>
    </div>
  );
}
