import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { generateOgImage } from "./ogHandler.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/og", generateOgImage);

  // Initialize server-side Gemini client
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  } else {
    console.warn("⚠️ warning: GEMINI_API_KEY environment variable is not defined on the server.");
  }

  // API handler for generating a social media cliffhanger headline
  app.post("/api/gemini/generate-cliffhanger", async (req, res) => {
    try {
      const { title, excerpt, content } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Article title is required." });
      }

      if (!ai) {
        // Fallback placeholder/explanation if apiKey is not set up
        const mockedOptions = [
          `${title} — What happens next will shock you!`,
          `This change is coming soon. Here is what you need to know.`,
          `The update everyone has been talking about has finally been released.`
        ];
        return res.json({
          cliffhanger: mockedOptions[Math.floor(Math.random() * mockedOptions.length)],
          warning: "GEMINI_API_KEY is not configured on your server. Simulated a curiosity hook."
        });
      }

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
5. Output ONLY the teaser line in plain text. Do not add quotes round it.

Examples:
Article: "Government announces new fuel price policy starting Monday"
Your Output: New fuel changes are coming and here is what everyone needs to know

Article: "Celebrity musician responds to major cheating scandal on social media"
Your Output: The response everyone was waiting for has finally arrived
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
      
      res.json({ cliffhanger });
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating the cliffhanger." });
    }
  });

  app.post("/api/gemini/generate-social-copy", async (req, res) => {
    try {
      const { title, excerpt, content, platform } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Article title is required." });
      }

      const targetPlatform = platform || "Facebook";

      if (!ai) {
        const fallbackCopy = `Read our latest update: ${title}\n\n${targetPlatform} users, let us know your thoughts! #News`;
        return res.json({
          copy: fallbackCopy,
          warning: "GEMINI_API_KEY is not configured on your server."
        });
      }

      const prompt = `
Generate an engaging social media post caption tailored for ${targetPlatform}. 
The caption should act as a teaser/cliffhanger to encourage users to click.

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
      
      res.json({ copy });
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating copy." });
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).send("Missing URL parameter");
      }

      const response = await fetch(decodeURIComponent(url));
      
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      
      res.setHeader("Cache-Control", "public, max-age=31536000");

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.send(buffer);
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).send("Failed to proxy image");
    }
  });

  // Helper function to inject OG tags
  async function injectMetaTags(req: express.Request, html: string) {
    const url = req.originalUrl;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const fullBaseUrl = `${protocol}://${req.get('host') || 'gistwireng.vercel.app'}`;
    const metaTagRegex = /<!-- META_TAGS_START -->[\s\S]*<!-- META_TAGS_END -->/;

    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/').filter(Boolean);
    
    // Check if route is an article (e.g., /sport/record-breaker...)
    if (parts.length !== 2 || parts[0] === 'search' || parts[0] === 'api') {
      return html;
    }
    
    const category = parts[0];
    const slug = parts[1];

    try {
      const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
      if (!fs.existsSync(configPath)) {
        return html;
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const projectId = config.projectId;
      const databaseId = config.firestoreDatabaseId || "(default)";
      
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery?key=${config.apiKey}`;
      
      const response = await fetch(queryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "articles" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: slug }
              }
            },
            limit: 1
          }
        })
      });
      
      const data = await response.json();
      if (data && data.length > 0 && data[0].document) {
        const docFields = data[0].document.fields;
        const rawTitle = docFields.title?.stringValue || "GistWire News";
        const ogTitle = rawTitle.length > 60 ? rawTitle.substring(0, 57) + "..." : rawTitle;
        const pageTitle = `${rawTitle.length > 45 ? rawTitle.substring(0, 42) + "..." : rawTitle} | Gist Wire`;
        const rawExcerpt = docFields.excerpt?.stringValue || docFields.title?.stringValue || "";
        const excerpt = rawExcerpt.length > 120 ? rawExcerpt.substring(0, 117) + "..." : rawExcerpt;
        const imageUrl = docFields.coverImage?.stringValue || docFields.imageUrl?.stringValue || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop&q=80";
        // Generate dynamic OG image with text overlay
        const optimizedImageUrl = `${fullBaseUrl}/api/og?title=${encodeURIComponent(ogTitle)}&image=${encodeURIComponent(imageUrl)}`;
        const datePublished = docFields.date?.stringValue || docFields.publishDate?.stringValue || new Date().toISOString();
        const author = docFields.author?.stringValue || "GistWire";
        const currentUrl = `${fullBaseUrl}${url}`;
        
        const metaTags = `
    <!-- META_TAGS_START -->
    <title>${pageTitle.replace(/"/g, '&quot;')}</title>
    <meta name="title" content="${pageTitle.replace(/"/g, '&quot;')}" />
    <meta name="description" content="${excerpt.replace(/"/g, '&quot;')}" />
    
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Gist Wire" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${excerpt.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${optimizedImageUrl}" />
    <meta property="og:image:secure_url" content="${optimizedImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />
    
    <meta property="article:published_time" content="${datePublished}" />
    <meta property="article:author" content="${author}" />
    <meta property="article:section" content="${docFields.category?.stringValue || category}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@gistwire" />
    <meta name="twitter:creator" content="@gistwire" />
    <meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${excerpt.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${optimizedImageUrl}" />
    <!-- META_TAGS_END -->
        `;
        
        return html.replace(metaTagRegex, metaTags);
      }
    } catch (e) {
      console.error("Failed to fetch meta tags for article", e);
    }
    
    return html;
  }

  // Serve static assets out of the correct paths depending on environment
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for dev mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        template = await injectMetaTags(req, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

  } else {
    // Production serving of compiled Vite assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
    app.get("*", async (req, res) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.join(distPath, "index.html"), 'utf-8');
        template = await injectMetaTags(req, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        res.status(500).end(e.message);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Full-stack express server listening on port ${PORT}`);
  });
}

startServer();
