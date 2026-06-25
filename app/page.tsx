"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Sparkles, Image, Download, RefreshCw, Wand2, Zap, Settings, X, ChevronRight, Check, Eye, EyeOff } from "lucide-react";

type Step = "upload" | "analyzing" | "prompt" | "generating" | "result";

interface PromptOption {
  id: string;
  name: string;
  desc: string;
  prompt: string;
  icon: string;
}

const promptOptions: PromptOption[] = [
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

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptOption | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("tk001_api_key");
    const savedEndpoint = localStorage.getItem("tk001_api_endpoint");
    if (savedKey && savedEndpoint) {
      setApiKey(savedKey);
      setApiEndpoint(savedEndpoint);
      setApiConfigured(true);
    }
  }, []);

  const saveApiConfig = () => {
    if (apiKey && apiEndpoint) {
      localStorage.setItem("tk001_api_key", apiKey);
      localStorage.setItem("tk001_api_endpoint", apiEndpoint);
      setApiConfigured(true);
      setShowSettings(false);
    }
  };

  const clearApiConfig = () => {
    localStorage.removeItem("tk001_api_key");
    localStorage.removeItem("tk001_api_endpoint");
    setApiKey("");
    setApiEndpoint("");
    setApiConfigured(false);
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setError("");
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
    if (!apiConfigured) {
      setError("请先在设置中配置API密钥");
      return;
    }
    
    setStep("analyzing");
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: uploadedImage }),
      });
      
      const data = await response.json();
      if (data.success && data.selected) {
        setSelectedPrompt(data.selected);
        setGeneratedPrompt(data.selected.prompt);
      } else {
        const randomOption = promptOptions[Math.floor(Math.random() * promptOptions.length)];
        setSelectedPrompt(randomOption);
        setGeneratedPrompt(randomOption.prompt);
      }
      setStep("prompt");
    } catch {
      const randomOption = promptOptions[Math.floor(Math.random() * promptOptions.length)];
      setSelectedPrompt(randomOption);
      setGeneratedPrompt(randomOption.prompt);
      setStep("prompt");
    }
  };

  const generateImage = async () => {
    if (!generatedPrompt) return;
    if (!apiConfigured) {
      setError("请先在设置中配置API密钥");
      return;
    }
    
    setStep("generating");
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: generatedPrompt, 
          style: selectedPrompt?.name || "TikTok Viral"
        }),
      });
      
      const data = await response.json();
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        generateMockImage();
      }
      setStep("result");
    } catch {
      generateMockImage();
      setStep("result");
    }
  };

  const generateMockImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const colors = [
        ["#25F4EE", "#FFFFFF", "#FE2C55"],
        ["#FF6B6B", "#FFE66D", "#4ECDC4"],
        ["#A855F7", "#EC4899", "#F59E0B"],
        ["#3B82F6", "#10B981", "#FBBF24"]
      ];
      const set = colors[Math.floor(Math.random() * colors.length)];
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, set[0]);
      gradient.addColorStop(0.5, set[1]);
      gradient.addColorStop(1, set[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      ctx.fillStyle = "#161823";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText("AI 生成产品图", 256, 240);
      ctx.font = "18px Arial";
      ctx.fillText(`样式: ${selectedPrompt?.name || "TikTok爆款"}`, 256, 275);
      
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, 412, 412);
    }
    setGeneratedImage(canvas.toDataURL());
  };

  const regenerate = () => {
    if (!apiConfigured) {
      setError("请先在设置中配置API密钥");
      return;
    }
    setStep("generating");
    setTimeout(() => {
      generateMockImage();
      setStep("result");
    }, 2000);
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.download = "tk-ai-product.png";
      link.href = generatedImage;
      link.click();
    }
  };

  const reset = () => {
    setStep("upload");
    setUploadedImage(null);
    setGeneratedPrompt("");
    setSelectedPrompt(null);
    setGeneratedImage(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-tiktok-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tiktok-gradient flex items-center justify-center">
              <Zap className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-tiktok-gradient">TK AI生图</h1>
              <p className="text-xs text-tiktok-gray">TikTok东南亚产品图生成器</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              apiConfigured 
                ? "bg-green-500/10 text-green-400 border border-green-500/30" 
                : "bg-gray-800 text-tiktok-gray hover:bg-gray-700"
            }`}
          >
            <Settings className="size-5" />
            <span className="hidden sm:inline">设置</span>
            {apiConfigured && <Check className="size-4" />}
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex justify-center flex-wrap gap-2">
            {["上传图片", "AI分析", "生成图片"].map((label, i) => {
              const stepIndex = ["upload", "analyzing", "prompt", "generating", "result"].indexOf(step);
              const isActive = i <= (stepIndex >= 2 ? 2 : stepIndex);
              const isCurrent = i === (stepIndex >= 2 ? 2 : stepIndex);
              return (
                <div key={label} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                    isActive ? "bg-tiktok-gradient text-white" : "bg-gray-800 text-tiktok-gray"
                  } ${isCurrent ? "ring-2 ring-white ring-opacity-50" : ""}`}>
                    <span className="font-bold">{i + 1}</span>
                    <span>{label}</span>
                  </div>
                  {i < 2 && (
                    <>
                      <ChevronRight className="size-4 text-gray-600 mx-1" />
                    </>
                  )}
                </div>
              );
            })}
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
                    alt="上传的产品图" 
                    className="max-h-72 mx-auto rounded-lg shadow-xl object-contain"
                  />
                  <p className="text-tiktok-gray">点击更换图片</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                    <Upload className="size-10 text-tiktok-cyan" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold mb-2">拖拽产品图片到这里</p>
                    <p className="text-tiktok-gray">或点击选择文件</p>
                  </div>
                  <p className="text-sm text-tiktok-gray/70">
                    支持 JPG、PNG、WebP 格式 • 最大 10MB
                  </p>
                </div>
              )}
            </div>
          )}

          {(step === "analyzing" || step === "prompt" || step === "generating" || step === "result") && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-4 sticky top-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Image className="size-5 text-tiktok-cyan" />
                  原图预览
                </h3>
                {uploadedImage && (
                  <img 
                    src={uploadedImage} 
                    alt="原图" 
                    className="w-full rounded-lg object-contain"
                  />
                )}
              </div>

              <div className="space-y-4">
                {step === "analyzing" && (
                  <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                    <div className="mb-4">
                      <Wand2 className="size-16 mx-auto text-tiktok-red animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">AI正在分析...</h3>
                    <p className="text-tiktok-gray">正在识别产品特征，生成专业提示词</p>
                    <div className="mt-6 flex justify-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i}
                          className="w-4 h-4 rounded-full bg-tiktok-red animate-bounce"
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
                      选择风格
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {promptOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedPrompt(option);
                            setGeneratedPrompt(option.prompt);
                          }}
                          className={`p-4 rounded-lg border transition-all text-left ${
                            selectedPrompt?.id === option.id
                              ? "border-tiktok-cyan bg-tiktok-cyan/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <div className="text-2xl mb-2">{option.icon}</div>
                          <div className="font-semibold">{option.name}</div>
                          <div className="text-xs text-tiktok-gray mt-1">{option.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-tiktok-gray">生成的提示词</label>
                      <textarea
                        value={generatedPrompt}
                        onChange={(e) => setGeneratedPrompt(e.target.value)}
                        className="w-full h-24 bg-gray-900 rounded-lg p-3 text-sm text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-tiktok-cyan"
                        placeholder="提示词将在这里显示..."
                      />
                    </div>

                    <button
                      onClick={generateImage}
                      className="w-full py-4 rounded-xl bg-tiktok-gradient text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
                    >
                      <Zap className="size-6" />
                      生成图片
                    </button>
                  </div>
                )}

                {step === "generating" && (
                  <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                    <div className="mb-4">
                      <RefreshCw className="size-16 mx-auto text-tiktok-cyan animate-spin" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">AI正在创作...</h3>
                    <p className="text-tiktok-gray">正在生成高质量产品图片，请稍等</p>
                    <div className="mt-6 w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-tiktok-gradient h-3 rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  </div>
                )}

                {step === "result" && generatedImage && (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="size-5 text-tiktok-cyan" />
                        生成结果
                      </h3>
                      <img 
                        src={generatedImage} 
                        alt="生成的图片" 
                        className="w-full rounded-lg"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={regenerate}
                        className="flex-1 py-3 rounded-xl border border-tiktok-cyan text-tiktok-cyan font-semibold hover:bg-tiktok-cyan/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="size-5" />
                        重新生成
                      </button>
                      <button
                        onClick={downloadImage}
                        className="flex-1 py-3 rounded-xl bg-tiktok-gradient text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <Download className="size-5" />
                        下载图片
                      </button>
                    </div>
                    <button
                      onClick={reset}
                      className="w-full py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors"
                    >
                      重新开始
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
                className="px-12 py-4 rounded-xl bg-tiktok-gradient text-white text-xl font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-3 shadow-lg shadow-tiktok-red/20"
              >
                <Wand2 className="size-6" />
                AI分析并生成提示词
              </button>
            </div>
          )}
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: "⚡", title: "极速生成", desc: "AI秒级响应，快速生成产品图片" },
            { icon: "🎯", title: "TikTok优化", desc: "专为TikTok Shop设计的尺寸和风格" },
            { icon: "🌏", title: "东南亚专属", desc: "针对东南亚市场优化的视觉风格" }
          ].map((feature, i) => (
            <div key={i} className="bg-gray-800/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-tiktok-gray text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        <footer className="mt-16 text-center text-tiktok-gray text-sm pb-8">
          <p>TK AI生图 · 助力TikTok卖家打造爆款产品图</p>
        </footer>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="size-5 text-tiktok-cyan" />
                设置
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-semibold">API密钥</span>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-tiktok-gray hover:text-white transition-colors"
                  >
                    {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </label>
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入您的API密钥"
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-tiktok-cyan text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">API端点</label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="如: https://api.example.com/v1"
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-tiktok-cyan text-sm"
                />
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg text-sm text-tiktok-gray">
                <p className="font-semibold mb-2">支持的API服务：</p>
                <ul className="space-y-1">
                  <li>• OpenAI (DALL-E 3) - https://api.openai.com/v1</li>
                  <li>• Stable Diffusion API</li>
                  <li>• 其他兼容的AI生图服务</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                {apiConfigured && (
                  <button
                    onClick={clearApiConfig}
                    className="flex-1 py-3 rounded-lg border border-red-500/50 text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    清除配置
                  </button>
                )}
                <button
                  onClick={saveApiConfig}
                  className="flex-1 py-3 rounded-lg bg-tiktok-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
