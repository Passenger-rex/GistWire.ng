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
    const { title, excerpt, content } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "Article title is required." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      // Return mocked output if API key is not configured yet
      const mockedOptions = [
        `${title} — What happens next will shock you!`,
        `This change is coming soon. Here is what you need to know.`,
        `The update everyone has been talking about has finally been released.`
      ];
      return res.json({
        cliffhanger: mockedOptions[Math.floor(Math.random() * mockedOptions.length)],
        warning: "GEMINI_API_KEY is not configured on Vercel env. Simulated cliffhanger."
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
Generate a short, engaging, curiosity-inducing cliffhanger headline (social media companion subtitle) for our professional news outlet's social media graphic card.

ARTICLE METADATA:
Title: "${title}"
Excerpt/Subheadline: "${excerpt || 'None'}"
Content Excerpt: "${(content || '').substring(0, 1000)}"

REQUIREMENTS:
1. Short and powerful: under 16 words.
2. Create curiosity and encourage users to click/read the full article.
3. Capture the core intrigue of the story without giving away the entire resolution or details.
4. Avoid markdown formatting entirely. No asterisks (**), no double pipes (||), no em dashes (—), no ellipsis (...), no hashtags (#).
5. Output ONLY the teaser line in plain text. Do not add quotes.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert social media editor and journalist. You write high-CTR, highly engaging, clean news-styled curiosity hooks without using any markdown characters, asterisks, hashtags or weird formatting of any kind.",
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
            systemInstruction: "You are an expert social media editor and journalist. You write high-CTR, highly engaging, clean news-styled curiosity hooks without using any markdown characters, asterisks, hashtags or weird formatting of any kind.",
            temperature: 0.85,
          }
        });
      } else {
        throw e;
      }
    }

    const cliffhanger = response.text ? response.text.trim().replace(/^['"\s]+|['"\s]+$/g, "") : "";
    return res.json({ cliffhanger });
  } catch (error: any) {
    console.error("Vercel Serverless Function Error:", error);
    return res.status(500).json({ error: error.message || "An error occurred." });
  }
}
