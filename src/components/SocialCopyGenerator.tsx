import React, { useState } from "react";
import { Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import { Article } from "../types";

export default function SocialCopyGenerator({ formData }: { formData: Partial<Article> }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [socialCopy, setSocialCopy] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [copied, setCopied] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!formData.title) {
      alert("Please ensure the article has a title first.");
      return;
    }

    setIsGenerating(true);
    setAiWarning(null);

    try {
      const response = await fetch("/api/gemini/generate-social-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt || "",
          content: formData.contentHtml || "",
          platform: platform
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `HTTP Error ${response.status}`);
      }

      if (data.copy) {
        setSocialCopy(data.copy);
      }
      if (data.warning) {
        setAiWarning(data.warning);
      }
      
      setCopied(false);
    } catch (error: any) {
      console.error("Failed to generate AI social copy:", error);
      alert("Error generating social copy. Please check the console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(socialCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm mt-6">
      <h3 className="font-sans font-black text-sm uppercase tracking-widest text-[#111111] mb-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" /> Social Copy Copilot
      </h3>
      <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
        Generate platform-optimized social media captions based on your current draft.
      </p>

      <div className="space-y-3">
        <select 
          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-[#111111] focus:ring-1 focus:ring-indigo-500 outline-none"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="Facebook">Facebook</option>
          <option value="Twitter">Twitter / X</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Instagram">Instagram</option>
        </select>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !formData.title}
          className="w-full bg-[#111111] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition duration-200 cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Caption
            </>
          )}
        </button>

        {aiWarning && (
          <p className="text-[10px] font-bold text-amber-600 mt-1 leading-tight">{aiWarning}</p>
        )}

        {socialCopy && (
          <div className="mt-4 animate-fade-in relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">Generated Text</label>
            <div className="relative">
              <textarea 
                className="w-full h-32 bg-white border border-indigo-100 rounded-lg p-3 text-xs text-gray-700 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                value={socialCopy}
                onChange={(e) => setSocialCopy(e.target.value)}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 rounded-md transition"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
