import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Image as ImageIcon, 
  Sliders, 
  Eye, 
  Layers, 
  Type, 
  Grid,
  CheckCircle2,
  Trash2,
  Plus
} from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import { Article } from "../types";

interface SocialGraphicGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  activeArticle?: Partial<Article>;
  publishedArticles: Article[];
}

const getProxiedUrl = (url: string) => {
  if (!url || url.startsWith("data:") || url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

export default function SocialGraphicGenerator({
  isOpen,
  onClose,
  activeArticle = {},
  publishedArticles = []
}: SocialGraphicGeneratorProps) {
  // Source article state
  const [selectedArticleId, setSelectedArticleId] = useState<string>("active");
  const [articleData, setArticleData] = useState<Partial<Article>>(activeArticle);

  // Headline & AI State
  const [headline, setHeadline] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiProvider, setAiProvider] = useState("groq");
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // Design Settings
  const [ratio, setRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5'>('1:1');
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imageZoom, setImageZoom] = useState(1.0);
  const [imageYPosition, setImageYPosition] = useState(50); // 0% to 100%
  const [imageSource, setImageSource] = useState("");

  // Watermark Settings
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkType, setWatermarkType] = useState<'image' | 'text'>('image');
  const [watermarkBlendMode, setWatermarkBlendMode] = useState<'normal' | 'screen' | 'lighten' | 'multiply' | 'overlay'>('normal');
  const [watermarkText, setWatermarkText] = useState("GISTWIRE.COM");
  const [watermarkSize, setWatermarkSize] = useState(160); // Width in px
  const [watermarkOpacity, setWatermarkOpacity] = useState(85); // 0-100
  const [watermarkPosition, setWatermarkPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');

  // Text Overlay Settings
  const [highlightKeywords, setHighlightKeywords] = useState("");
  const [highlightColor, setHighlightColor] = useState<'green' | 'red' | 'yellow' | 'blue' | 'orange'>('green');
  const [uppercaseHeadline, setUppercaseHeadline] = useState(false);
  
  // Category Badge Settings
  const [showCategoryBadge, setShowCategoryBadge] = useState(true);
  const [categoryText, setCategoryText] = useState("NEWS");
  const [categoryBgColor, setCategoryBgColor] = useState("#00a85a");

  // Breaking News Label
  const [showBreakingLabel, setShowBreakingLabel] = useState(false);
  const [breakingText, setBreakingText] = useState("BREAKING NEWS");
  const [breakingBgColor, setBreakingBgColor] = useState("#ff3b30");

  // Related Image Circles (Up to 2)
  const [showCircle1, setShowCircle1] = useState(false);
  const [circle1Url, setCircle1Url] = useState("");
  const [circle1X, setCircle1X] = useState(25); // Percentage
  const [circle1Y, setCircle1Y] = useState(55); // Percentage
  const [circle1Size, setCircle1Size] = useState(140); // Size in px

  const [showCircle2, setShowCircle2] = useState(false);
  const [circle2Url, setCircle2Url] = useState("");
  const [circle2X, setCircle2X] = useState(75); // Percentage
  const [circle2Y, setCircle2Y] = useState(55); // Percentage
  const [circle2Size, setCircle2Size] = useState(140); // Size in px

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Active section for controls sidebar
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'brand' | 'overlays'>('text');

  // Load Preset
  const handleLoadPreset = () => {
    const saved = localStorage.getItem("gistwire_graphic_preset");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.ratio) setRatio(config.ratio);
        if (config.watermarkType !== undefined) setWatermarkType(config.watermarkType);
        if (config.watermarkText !== undefined) setWatermarkText(config.watermarkText);
        if (config.watermarkSize !== undefined) setWatermarkSize(config.watermarkSize);
        if (config.watermarkOpacity !== undefined) setWatermarkOpacity(config.watermarkOpacity);
        if (config.watermarkBlendMode !== undefined) setWatermarkBlendMode(config.watermarkBlendMode);
        if (config.watermarkPosition !== undefined) setWatermarkPosition(config.watermarkPosition);
        if (config.showWatermark !== undefined) setShowWatermark(config.showWatermark);
        if (config.highlightColor !== undefined) setHighlightColor(config.highlightColor);
        if (config.uppercaseHeadline !== undefined) setUppercaseHeadline(config.uppercaseHeadline);
        if (config.showCategoryBadge !== undefined) setShowCategoryBadge(config.showCategoryBadge);
        if (config.categoryBgColor !== undefined) setCategoryBgColor(config.categoryBgColor);
        if (config.showBreakingLabel !== undefined) setShowBreakingLabel(config.showBreakingLabel);
        if (config.breakingBgColor !== undefined) setBreakingBgColor(config.breakingBgColor);
        alert("Preset loaded successfully!");
      } catch (e) {
        console.error("Failed to load preset", e);
      }
    } else {
      alert("No preset saved yet.");
    }
  };

  const handleSavePreset = () => {
    const config = {
      ratio,
      watermarkType,
      watermarkText,
      watermarkSize,
      watermarkOpacity,
      watermarkBlendMode,
      watermarkPosition,
      showWatermark,
      highlightColor,
      uppercaseHeadline,
      showCategoryBadge,
      categoryBgColor,
      showBreakingLabel,
      breakingBgColor
    };
    localStorage.setItem("gistwire_graphic_preset", JSON.stringify(config));
    alert("Graphic configuration saved as your preset!");
  };

  // Canvas Reference
  const canvasRef = useRef<HTMLDivElement>(null);

  // Automatically update source material when activeArticle changes or selectedArticleId changes
  useEffect(() => {
    if (selectedArticleId === "active") {
      setArticleData(activeArticle);
    } else {
      const found = publishedArticles.find(a => a.id === selectedArticleId);
      if (found) {
        setArticleData(found);
      }
    }
  }, [selectedArticleId, activeArticle, publishedArticles]);

  // Load article metadata into local design controls
  useEffect(() => {
    if (articleData.title) {
      setHeadline(articleData.title);
    }
    if (articleData.coverImage) {
      setCoverImageUrl(articleData.coverImage);
    }
    if (articleData.category) {
      setCategoryText(articleData.category.toUpperCase());
    }
    if (articleData.imageSource) {
      setImageSource(articleData.imageSource);
    }
  }, [articleData]);

  // AI Generator function
  const handleGenerateAI = async () => {
    if (!articleData.title) {
      alert("Please enter or select an article title first before generating an AI headline!");
      return;
    }

    setIsGeneratingAI(true);
    setAiWarning(null);

    try {
      const response = await fetch("/api/gemini/generate-cliffhanger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleData.title,
          excerpt: articleData.excerpt || "",
          content: articleData.contentHtml || "",
          provider: aiProvider
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `HTTP Error ${response.status}`);
      }

      if (data.cliffhanger) {
        setHeadline(data.cliffhanger);
      }
      if (data.warning) {
        setAiWarning(data.warning);
      }
    } catch (error: any) {
      console.error("Failed to generate AI cliffhanger:", error);
      alert("Error generating cliffhanger. Using original title as a fallback.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Split and format keywords inside the headline
  const renderFormattedHeadline = (text: string) => {
    if (!text) return <span className="text-gray-400">Enter a curiosity headline...</span>;
    
    let processedText = uppercaseHeadline ? text.toUpperCase() : text;

    if (!highlightKeywords || highlightKeywords.trim() === "") {
      return <span>{processedText}</span>;
    }

    const keywords = highlightKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywords.length === 0) return <span>{processedText}</span>;

    // Sort keywords descending so larger groups match first
    keywords.sort((a, b) => b.length - a.length);

    // Escape regex characters
    const escapedKeywords = keywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const regex = new RegExp(`(${escapedKeywords.join("|")})`, "gi");

    const parts = processedText.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          const isMatched = keywords.some(k => k.toLowerCase() === part.toLowerCase());
          if (isMatched) {
            let textColor = "text-[#00a85a]";
            if (highlightColor === "red") textColor = "text-[#ff3b30]";
            else if (highlightColor === "yellow") textColor = "text-[#ffcc00]";
            else if (highlightColor === "blue") textColor = "text-[#007aff]";
            else if (highlightColor === "orange") textColor = "text-[#ff9500]";

            return (
              <span key={index} className={`${textColor} font-black`}>
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  // Target Dimensions based on aspect ratios
  const getCanvasDimensions = () => {
    switch (ratio) {
      case "16:9":
        return { width: 1200, height: 675 };
      case "9:16":
        return { width: 1080, height: 1920 };
      case "4:5":
        return { width: 1080, height: 1350 };
      case "1:1":
      default:
        return { width: 1080, height: 1080 };
    }
  };

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();

  // Export File trigger using html-to-image
  const handleExport = async (format: "png" | "jpeg" = "png") => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      // Force perfect sizing and rendering options
      const options = {
        width: canvasWidth,
        height: canvasHeight,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
        },
        pixelRatio: 2, // <----- Ensures very high quality for posting
        quality: 1.0,
        cacheBust: true,
      };

      let url = "";
      if (format === "png") {
        url = await toPng(canvasRef.current, options);
      } else {
        url = await toJpeg(canvasRef.current, options);
      }

      // Download file helper
      const filename = `GistWire-Social-${articleData.slug || "graphic"}-${ratio.replace(":", "x")}.${format}`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Export failure:", err);
      alert("Failed to export high-quality image. Please confirm all image URLs permit CORS accesses.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-[1280px] h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#00a85a]/10 p-2 rounded-lg text-[#00a85a]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-black uppercase text-base text-[#111111] tracking-tight">Social Media News Graphic Generator</h2>
              <p className="text-xs text-gray-500 font-medium">Create and customized high-CTR social media visual cards in seconds</p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT: Live Preview Canvas Area */}
          <div className="flex-1 bg-gray-100 p-6 flex flex-col items-center justify-center overflow-auto relative">
            <div className="mb-4 text-center">
              <span className="text-[11px] font-sans font-black uppercase tracking-widest text-gray-500 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                Live High-RES Graphic Canvas ({ratio} Standard Preset)
              </span>
            </div>

            {/* Scaled Preview Frame Wrapper */}
            <div 
              className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-gray-300 rounded-lg overflow-hidden bg-white shrink-0"
              style={{
                width: "420px",
                height: ratio === "1:1" ? "420px" : ratio === "4:5" ? "525px" : ratio === "16:9" ? "236.25px" : "746.67px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              {/* Inner container applying scale dynamically to fit the visual frame layout */}
              <div 
                ref={canvasRef}
                id="social-media-graphic-canvas"
                className="absolute origin-top-left overflow-hidden bg-slate-900 select-none"
                style={{
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`,
                  transform: `scale(${420 / canvasWidth})`,
                  transformOrigin: "top left"
                }}
              >
                {/* Background Featured Image with zoom and Y crop positioning */}
                {coverImageUrl ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <img 
                      src={getProxiedUrl(coverImageUrl)} 
                      alt="Featured Background" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="absolute w-full h-full object-cover transition-all"
                      style={{
                        transform: `scale(${imageZoom})`,
                        objectPosition: `center ${imageYPosition}%`
                      }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-500 font-sans p-10 text-center">
                    <ImageIcon className="w-16 h-16 mb-4 text-slate-600" />
                    <p className="font-bold text-sm">No cover image specified</p>
                    <p className="text-xs">Provide a live URL to serve as the card's background face</p>
                  </div>
                )}

                {/* Dark Gradient Readable overlay */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 pointer-events-none transition-all ${
                    ratio === "9:16" ? "h-[55%] bg-gradient-to-t from-black via-black/85 via-black/40 to-transparent" :
                    ratio === "16:9" ? "h-[70%] bg-gradient-to-t from-black via-black/95 via-black/50 to-transparent" :
                    "h-[60%] bg-gradient-to-t from-black via-black/85 via-black/40 to-transparent"
                  }`}
                />

                {/* Optional Breaking News Label Overlay */}
                {showBreakingLabel && (
                  <div 
                    className="absolute z-10 px-6 py-2.5 font-sans font-black uppercase text-white shadow-xl flex items-center gap-2 tracking-widest"
                    style={{
                      backgroundColor: breakingBgColor,
                      top: ratio === "9:16" ? "120px" : "60px",
                      left: "50px",
                      fontSize: "15px",
                      borderRadius: "4px"
                    }}
                  >
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                    {breakingText}
                  </div>
                )}

                {/* Optional Logo Watermark Overlay */}
                {showWatermark && (
                  <div 
                    className="absolute z-10 select-none flex items-center transition-all"
                    style={{
                      opacity: watermarkOpacity / 100,
                      mixBlendMode: watermarkBlendMode,
                      top: watermarkPosition.includes("top") ? "55px" : "auto",
                      bottom: watermarkPosition.includes("bottom") ? "55px" : "auto",
                      left: watermarkPosition.includes("left") ? "55px" : "auto",
                      right: watermarkPosition.includes("right") ? "55px" : "auto",
                    }}
                  >
                    {watermarkType === "image" ? (
                      <div className="flex items-center justify-center drop-shadow-xl">
                        <img 
                          src="/gistwire-logo-removebg-preview.png" 
                          alt="GistWire watermark logo" 
                          referrerPolicy="no-referrer"
                          className={`object-contain ${watermarkBlendMode === 'screen' || watermarkBlendMode === 'overlay' ? 'brightness-0 invert' : ''}`} 
                          style={{ width: `${watermarkSize}px`, height: "auto" }}
                        />
                      </div>
                    ) : (
                      <span className="font-sans font-black tracking-widest text-white drop-shadow-lg" style={{ fontSize: `${watermarkSize * 0.16}px` }}>
                        {watermarkText}
                      </span>
                    )}
                  </div>
                )}

                {/* Circle Overlay 1 */}
                {showCircle1 && circle1Url && (
                  <div 
                    className="absolute rounded-full border-4 border-white shadow-2xl overflow-hidden transition-all z-10"
                    style={{
                      width: `${circle1Size}px`,
                      height: `${circle1Size}px`,
                      left: `${circle1X}%`,
                      top: `${circle1Y}%`,
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    <img 
                      src={getProxiedUrl(circle1Url)} 
                      alt="Overlay 1" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}

                {/* Circle Overlay 2 */}
                {showCircle2 && circle2Url && (
                  <div 
                    className="absolute rounded-full border-4 border-white shadow-2xl overflow-hidden transition-all z-10"
                    style={{
                      width: `${circle2Size}px`,
                      height: `${circle2Size}px`,
                      left: `${circle2X}%`,
                      top: `${circle2Y}%`,
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    <img 
                      src={getProxiedUrl(circle2Url)} 
                      alt="Overlay 2" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}

                {/* Bottom Graphic Content Pillar */}
                <div 
                  className="absolute bottom-0 left-0 right-0 p-12 transition-all flex flex-col gap-4"
                  style={{
                    paddingBottom: ratio === "9:16" ? "80px" : "50px"
                  }}
                >
                  
                  {/* Category Pill Badge */}
                  {showCategoryBadge && categoryText && (
                    <div className="flex">
                      <span 
                        className="text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-sm shadow-md"
                        style={{ backgroundColor: categoryBgColor, fontSize: "16px", letterSpacing: "0.15em" }}
                      >
                        {categoryText}
                      </span>
                    </div>
                  )}

                  {/* Cliffhanger Dramatic News Headline */}
                  <h1 
                    className={`font-sans font-black tracking-tight text-white leading-[1.15] drop-shadow-xl ${
                      ratio === "16:9" ? "text-4xl" : "text-[46px]"
                    }`}
                  >
                    {renderFormattedHeadline(headline)}
                  </h1>

                </div>

              </div>
            </div>

            {/* Quick Helper Tips */}
            <p className="text-[11px] mt-4 text-center text-gray-500 font-medium max-w-sm">
              ✨ Best result: Use high-quality JPG URLs for subjects and use relative circular overrides for matching political panel heads.
            </p>
          </div>

          {/* RIGHT: Custom Control Settings Console */}
          <div className="w-full md:w-[480px] border-t md:border-t-0 md:border-l border-gray-200 flex flex-col bg-white">
            
            {/* Control category pills selector */}
            <div className="flex border-b border-gray-100 bg-gray-50 uppercase text-[11px] font-black tracking-wider text-gray-500 overflow-x-auto shrink-0 select-none">
              <button 
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-4 px-3 border-b-2 text-center transition cursor-pointer hover:text-[#111111] hover:bg-white flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'text' ? 'border-[#00a85a] text-[#00a85a] bg-white' : 'border-transparent'
                }`}
              >
                <Type className="w-4 h-4" /> Text
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-4 px-3 border-b-2 text-center transition cursor-pointer hover:text-[#111111] hover:bg-white flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'image' ? 'border-[#00a85a] text-[#00a85a] bg-white' : 'border-transparent'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Imagery
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('brand')}
                className={`flex-1 py-4 px-3 border-b-2 text-center transition cursor-pointer hover:text-[#111111] hover:bg-white flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'brand' ? 'border-[#00a85a] text-[#00a85a] bg-white' : 'border-transparent'
                }`}
              >
                <Layers className="w-4 h-4" /> Branding
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('overlays')}
                className={`flex-1 py-4 px-3 border-b-2 text-center transition cursor-pointer hover:text-[#111111] hover:bg-white flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'overlays' ? 'border-[#00a85a] text-[#00a85a] bg-white' : 'border-transparent'
                }`}
              >
                <Grid className="w-4 h-4" /> Overlays
              </button>
            </div>

            {/* Scrollable control settings pane */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Data Source Panel (Accessible globally at the top of controls) */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-gray-500 tracking-wider">CMS DATA SOURCE</label>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">Article Content</span>
                </div>
                <select 
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-[#111111] focus:ring-1 focus:ring-[#00a85a] focus:border-[#00a85a] outline-none"
                  value={selectedArticleId}
                  onChange={(e) => setSelectedArticleId(e.target.value)}
                >
                  <option value="active">Active Entry (Currently Composing)</option>
                  {publishedArticles.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                  Generates from Title, Excerpt, and Body content. Active drafts can be designed instantly!
                </p>
              </div>

              {/* TAB 1: HEADLINE & TEXT OVERLAYS */}
              {activeTab === 'text' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* AI Assistant Hook generator bar */}
                  <div className="bg-gradient-to-br from-[#00a85a]/5 to-[#00a85a]/10 border border-[#00a85a]/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#00a85a] tracking-wider">
                        <Sparkles className="w-4 h-4" /> AI News Engine
                      </div>
                      <select 
                        value={aiProvider}
                        onChange={(e) => setAiProvider(e.target.value)}
                        className="text-[9px] bg-white border border-[#00a85a]/30 text-[#00a85a] font-bold px-2 py-0.5 rounded-full outline-none cursor-pointer"
                      >
                        <option value="groq">GROQ (Llama 3)</option>
                        <option value="deepseek">DEEPSEEK</option>
                        <option value="github">GITHUB MODELS</option>
                      </select>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      Analyze this article details and suggest the perfect curiosity-driven news card cliffhanger.
                    </p>

                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="w-full bg-[#00a85a] text-white py-2.5 rounded-lg font-black uppercase tracking-wider text-[11px] hover:bg-[#111111] active:translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isGeneratingAI ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analyzing Article...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate AI Cliffhanger
                        </>
                      )}
                    </button>

                    {aiWarning && (
                      <p className="text-[10px] font-bold text-amber-600 mt-1">{aiWarning}</p>
                    )}
                  </div>

                  {/* Cliffhanger headline controller */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-500 tracking-wider">Teaser Cliffhanger / Text</label>
                    <textarea
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Write custom headline..."
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm font-bold text-[#111111] focus:ring-1 focus:ring-[#00a85a] focus:border-[#00a85a] outline-none transition"
                      rows={4}
                    />
                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
                      <span>Length: {headline.length} chars</span>
                      <button 
                        type="button" 
                        onClick={() => setUppercaseHeadline(!uppercaseHeadline)}
                        className={`hover:text-[#111111] font-bold underline ${uppercaseHeadline ? 'text-[#00a85a]' : ''}`}
                      >
                        {uppercaseHeadline ? "Disable All-Caps" : "Force All-Caps"}
                      </button>
                    </div>
                  </div>

                  {/* Highlight Keywords */}
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <h3 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Highlighted brand keywords</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Keywords (Comma Separated)</label>
                        <input
                          type="text"
                          value={highlightKeywords}
                          onChange={(e) => setHighlightKeywords(e.target.value)}
                          placeholder="e.g. live updates, coming soon, Nigerians"
                          className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-[#111111] focus:ring-1 focus:ring-[#00a85a] focus:border-[#00a85a] outline-none transition"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Highlight Brand Color</label>
                        <div className="flex gap-2.5">
                          {(['green', 'red', 'yellow', 'blue', 'orange'] as const).map((color) => {
                            const badgeColor = color === 'green' ? 'bg-[#00a85a]' :
                                              color === 'red' ? 'bg-[#ff3b30]' :
                                              color === 'yellow' ? 'bg-[#ffcc00]' :
                                              color === 'blue' ? 'bg-[#007aff]' : 'bg-[#ff9500]';
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setHighlightColor(color)}
                                className={`w-8 h-8 rounded-full border-2 ${badgeColor} transition cursor-pointer relative ${
                                  highlightColor === color ? 'border-indigo-600 scale-110 shadow-md' : 'border-white'
                                }`}
                                title={color}
                              >
                                {highlightColor === color && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: BACKGROUND IMAGERY */}
              {activeTab === 'image' && (
                <div className="space-y-6 animate-fade-in">
                  
                  <div className="space-y-4">
                    <h3 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Background Source</h3>
                    
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 block">Featured Image URL</label>
                      <input
                        type="url"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full border border-gray-200 rounded-lg p-3 text-xs font-mono text-[#111111] focus:ring-1 focus:ring-[#00a85a] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 block">Image Source Title (Credit line)</label>
                      <input
                        type="text"
                        value={imageSource}
                        onChange={(e) => setImageSource(e.target.value)}
                        placeholder="e.g. Getty Images, Reuters"
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-[#111111] focus:ring-1 focus:ring-[#00a85a]"
                      />
                    </div>
                  </div>

                  {/* Positioning Alignment & Controls */}
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <h3 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Crop alignment & zoom</h3>
                    
                    <div className="space-y-4">
                      {/* Zoom Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold uppercase text-gray-500">
                          <span>Image Zoom</span>
                          <span>{imageZoom.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.05"
                          value={imageZoom}
                          onChange={(e) => setImageZoom(parseFloat(e.target.value))}
                          className="w-full accent-[#00a85a] h-1 bg-gray-200 rounded-lg"
                        />
                      </div>

                      {/* Vertical Shift slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold uppercase text-gray-500">
                          <span>Vertical Shift (Y Offset)</span>
                          <span>{imageYPosition}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={imageYPosition}
                          onChange={(e) => setImageYPosition(parseInt(e.target.value))}
                          className="w-full accent-[#00a85a] h-1 bg-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aspect Ratio Sizing presets */}
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <h3 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Canvas aspect ratios</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {(['1:1', '4:5', '16:9', '9:16'] as const).map((r) => {
                        const description = r === '1:1' ? 'Square (Instagram)' : r === '4:5' ? 'Portrait (FB/IG)' : r === '16:9' ? 'Landscape (X/FB)' : 'Story / Status';
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRatio(r)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition cursor-pointer ${
                              ratio === r ? 'border-[#00a85a] bg-[#00a85a]/5 text-[#00a85a]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-xs font-black">{r}</span>
                            <span className="text-[9px] mt-1 text-center font-semibold text-gray-400">{description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: WATERMARK & BRANDING DECORATORS */}
              {activeTab === 'brand' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Watermark toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Logo Watermark</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showWatermark} 
                          onChange={(e) => setShowWatermark(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00a85a]"></div>
                      </label>
                    </div>

                    {showWatermark && (
                      <div className="space-y-4 pl-3 border-l-2 border-[#00a85a]/30">
                        {/* Selector type */}
                        <div className="flex bg-gray-100 rounded-lg p-1 text-xs select-none">
                          <button
                            type="button"
                            onClick={() => setWatermarkType('image')}
                            className={`flex-1 py-1.5 text-center font-bold rounded-md transition cursor-pointer ${watermarkType === 'image' ? 'bg-white text-[#111111] shadow' : 'text-gray-500'}`}
                          >
                            Logo Image
                          </button>
                          <button
                            type="button"
                            onClick={() => setWatermarkType('text')}
                            className={`flex-1 py-1.5 text-center font-bold rounded-md transition cursor-pointer ${watermarkType === 'text' ? 'bg-white text-[#111111] shadow' : 'text-gray-500'}`}
                          >
                            Custom Text
                          </button>
                        </div>

                        {watermarkType === 'text' ? (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400">Watermark Text</label>
                            <input 
                              type="text" 
                              value={watermarkText} 
                              onChange={(e) => setWatermarkText(e.target.value.toUpperCase())}
                              className="w-full border border-gray-200 rounded-lg p-2 text-xs font-black text-[#111111]"
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between text-xs text-gray-600 font-semibold border">
                            <span>Preset GistWire Logo:</span>
                            <span className="font-bold text-[#00a85a]">gistwire-logo.png</span>
                          </div>
                        )}

                        {/* Size slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-black uppercase text-gray-500">
                            <span>Watermark Size</span>
                            <span>{watermarkSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="40"
                            max="280"
                            value={watermarkSize}
                            onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                            className="w-full accent-[#00a85a] h-1 bg-gray-200 rounded-lg"
                          />
                        </div>

                        {/* Opacity slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-black uppercase text-gray-500">
                            <span>Transparency (Opacity)</span>
                            <span>{watermarkOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                            className="w-full accent-[#00a85a] h-1 bg-gray-200 rounded-lg"
                          />
                        </div>

                        {/* Blend Mode Configuration */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400">Blending Mode</label>
                          <select 
                            value={watermarkBlendMode} 
                            onChange={(e) => setWatermarkBlendMode(e.target.value as any)}
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold text-gray-700 outline-none"
                          >
                            <option value="normal">Normal (Original Color)</option>
                            <option value="overlay">Overlay (White Overlay)</option>
                            <option value="screen">Screen (Inverted Bright)</option>
                            <option value="lighten">Lighten</option>
                            <option value="multiply">Multiply (Darken)</option>
                          </select>
                        </div>

                        {/* Quadrant Position */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400">Position Quadrant</label>
                          <select 
                            value={watermarkPosition} 
                            onChange={(e) => setWatermarkPosition(e.target.value as any)}
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold text-gray-700 outline-none"
                          >
                            <option value="top-right">Top Right Quadrant</option>
                            <option value="top-left">Top Left Quadrant</option>
                            <option value="bottom-right">Bottom Right Quadrant</option>
                            <option value="bottom-left">Bottom Left Quadrant</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category Pill Controls */}
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Category Pill Badge</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showCategoryBadge} 
                          onChange={(e) => setShowCategoryBadge(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00a85a]"></div>
                      </label>
                    </div>

                    {showCategoryBadge && (
                      <div className="space-y-3 pl-3 border-l-2 border-[#00a85a]/30">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Badge Text</label>
                          <input 
                            type="text" 
                            value={categoryText} 
                            onChange={(e) => setCategoryText(e.target.value.toUpperCase())}
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Pill Color Presets</label>
                          <div className="flex gap-2">
                            {['#00a85a', '#ff3b30', '#007aff', '#ff9500', '#111111'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setCategoryBgColor(c)}
                                className={`w-6 h-6 rounded-md hover:scale-110 active:scale-95 transition cursor-pointer relative border ${
                                  categoryBgColor === c ? 'border-indigo-600 scale-105' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                              >
                                {categoryBgColor === c && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                                )}
                              </button>
                            ))}
                            {/* Color Selector Input */}
                            <input 
                              type="color" 
                              value={categoryBgColor} 
                              onChange={(e) => setCategoryBgColor(e.target.value)}
                              className="w-6 h-6 p-0 rounded-md border-0 pointer-events-auto cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Breaking News Sticker overlay */}
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Breaking Sticker Overlay</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showBreakingLabel} 
                          onChange={(e) => setShowBreakingLabel(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00a85a]"></div>
                      </label>
                    </div>

                    {showBreakingLabel && (
                      <div className="space-y-3 pl-3 border-l-2 border-[#00a85a]/30">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Sticker Headline</label>
                          <input 
                            type="text" 
                            value={breakingText} 
                            onChange={(e) => setBreakingText(e.target.value.toUpperCase())}
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Sticker Background Color</label>
                          <div className="flex gap-2.5">
                            {['#ff3b30', '#ff9500', '#007aff', '#24292e'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setBreakingBgColor(c)}
                                className={`w-6 h-6 rounded border cursor-pointer relative ${
                                  breakingBgColor === c ? 'border-indigo-600 scale-105' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                              >
                                {breakingBgColor === c && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: CIRCULAR THUMBNAIL OVERLAYS */}
              {activeTab === 'overlays' && (
                <div className="space-y-6 animate-fade-in">
                  
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold bg-gray-50 p-3 rounded-lg border border-gray-100">
                    Add up to two circular heads exactly like the electoral card in the design. Perfect for showing candidates, political subjects, or celebrity reactions.
                  </p>

                  {/* Circular Overlay 1 */}
                  <div className="space-y-4 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Circular Thumbnail 1</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showCircle1} 
                          onChange={(e) => {
                            setShowCircle1(e.target.checked);
                            // Pre-fill with background if empty
                            if (e.target.checked && !circle1Url) {
                              setCircle1Url("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop");
                            }
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00a85a]"></div>
                      </label>
                    </div>

                    {showCircle1 && (
                      <div className="space-y-4 pt-2">
                        {/* Circle Image url */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400">Headshot Image URL</label>
                          <input 
                            type="url" 
                            value={circle1Url} 
                            onChange={(e) => setCircle1Url(e.target.value)}
                            placeholder="https://..."
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs font-mono"
                          />
                        </div>

                        {/* Coordinate sliders */}
                        <div className="space-y-4">
                          {/* Circle Size */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                              <span>Circle Size</span>
                              <span>{circle1Size}px</span>
                            </div>
                            <input
                              type="range"
                              min="80"
                              max="240"
                              value={circle1Size}
                              onChange={(e) => setCircle1Size(parseInt(e.target.value))}
                              className="w-full accent-[#00a85a] h-1 bg-gray-200 rounded-lg"
                            />
                          </div>

                          {/* Horizontal slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                              <span>Coordinate X Position</span>
                              <span>{circle1X}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              value={circle1X}
                              onChange={(e) => setCircle1X(parseInt(e.target.value))}
                              className="w-full h-1 bg-gray-200 rounded-lg"
                            />
                          </div>

                          {/* Vertical slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                              <span>Coordinate Y Position</span>
                              <span>{circle1Y}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              value={circle1Y}
                              onChange={(e) => setCircle1Y(parseInt(e.target.value))}
                              className="w-full h-1 bg-gray-200 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Circular Overlay 2 */}
                  <div className="space-y-4 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-sans font-black uppercase text-xs text-gray-700 tracking-wider">Circular Thumbnail 2</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showCircle2} 
                          onChange={(e) => {
                            setShowCircle2(e.target.checked);
                            if (e.target.checked && !circle2Url) {
                              setCircle2Url("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop");
                            }
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00a85a]"></div>
                      </label>
                    </div>

                    {showCircle2 && (
                      <div className="space-y-4 pt-2">
                        {/* Circle Image url */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400">Headshot Image URL</label>
                          <input 
                            type="url" 
                            value={circle2Url} 
                            onChange={(e) => setCircle2Url(e.target.value)}
                            placeholder="https://..."
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs font-mono"
                          />
                        </div>

                        {/* Coordinate sliders */}
                        <div className="space-y-4">
                          {/* Circle Size */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                              <span>Circle Size</span>
                              <span>{circle2Size}px</span>
                            </div>
                            <input
                              type="range"
                              min="80"
                              max="240"
                              value={circle2Size}
                              onChange={(e) => setCircle2Size(parseInt(e.target.value))}
                              className="w-full accent-[#00a85a] h-1 bg-gray-200 rounded-lg"
                            />
                          </div>

                          {/* Horizontal slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                              <span>Coordinate X Position</span>
                              <span>{circle2X}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              value={circle2X}
                              onChange={(e) => setCircle2X(parseInt(e.target.value))}
                              className="w-full h-1 bg-gray-200 rounded-lg"
                            />
                          </div>

                          {/* Vertical slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                              <span>Coordinate Y Position</span>
                              <span>{circle2Y}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              value={circle2Y}
                              onChange={(e) => setCircle2Y(parseInt(e.target.value))}
                              className="w-full h-1 bg-gray-200 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Export & Download Footer panel */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">Presets</div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleLoadPreset}
                    type="button" 
                    className="text-[10px] uppercase font-bold text-[#00a85a] hover:text-[#111111] transition underline cursor-pointer"
                  >
                    Load Saved Preset
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={handleSavePreset}
                    type="button" 
                    className="text-[10px] uppercase font-bold text-gray-500 hover:text-[#111111] transition underline cursor-pointer"
                  >
                    Save Current config
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleExport('png')}
                  disabled={isExporting}
                  className="bg-[#111111] text-white py-3.5 rounded-xl font-sans font-black uppercase tracking-wider text-[11px] hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('jpeg')}
                  disabled={isExporting}
                  className="bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-sans font-black uppercase tracking-wider text-[11px] hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export JPG
                </button>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold text-center leading-normal">
                Optimized high-resolution format optimized for Instagram, Facebook, WhatsApp & Twitter.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
