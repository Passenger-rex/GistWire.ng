import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { title, excerpt, content, platform } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "Article title is required." });
    }

    const targetPlatform = platform || "Facebook";

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      const fallbackCopy = `Read our latest update: ${title}\n\n${targetPlatform} users, let us know your thoughts! #News`;
      return res.json({
        copy: fallbackCopy,
        warning: "GEMINI_API_KEY is not configured on Vercel env. Simulated caption."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const prompt = `
Generate an engaging social media post caption tailored for ${targetPlatform}. 
The caption should act as a teaser/cliffhanger to encourage users to click parameters.

ARTICLE METADATA:
Title: "${title}"
Excerpt: "${excerpt || 'None'}"
Content Excerpt: "${(content || '').substring(0, 1000)}"

PLATFORM STYLE:
- Facebook: Conversational, engaging, maybe a question.
- Twitter: Punchy, concise, max 280 characters, use appropriate hashtags.
- LinkedIn: Professional, thought-provoking, industry-focused.
- Instagram: Visually descriptive, highly engaging, includes relevant emojis and hashtags.

REQUIREMENTS:
1. Write ONLY the caption text.
2. Include emojis if appropriate for the platform.
3. If appropriate, add a call-to-action like "Read the full story: [LINK]". Leave [LINK] as a placeholder.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert social media manager and journalist. You write high-CTR, highly engaging, clean news-styled captions.",
          temperature: 0.85,
        }
      });
    } catch (e: any) {
      if (e.status === 503 || e.message?.includes("503") || e.message?.includes("UNAVAILABLE")) {
        console.warn("gemini-3.5-flash is unavailable, falling back to gemini-3.1-pro-preview");
        response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            systemInstruction: "You are an expert social media manager and journalist. You write high-CTR, highly engaging, clean news-styled captions.",
            temperature: 0.85,
          }
        });
      } else {
        throw e;
      }
    }

    const copy = response.text ? response.text.trim() : "";
    return res.json({ copy });
  } catch (error: any) {
    console.error("Vercel Serverless Function Error:", error);
    return res.status(500).json({ error: error.message || "An error occurred." });
  }
}
