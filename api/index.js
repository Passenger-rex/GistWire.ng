import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const url = req.url;
  const fullBaseUrl = `https://gistwireng.vercel.app`;
  const metaTagRegex = /<!-- META_TAGS_START -->[\s\S]*<!-- META_TAGS_END -->/;

  // Load index.html from the build output (dist/index.html) or fallback to root index.html
  let html = '';
  try {
    const distPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(distPath)) {
      html = fs.readFileSync(distPath, 'utf8');
    } else {
      html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    }
  } catch (err) {
    return res.status(500).send('Error reading index.html');
  }

  const cleanUrl = url.split('?')[0];
  const parts = cleanUrl.split('/').filter(Boolean);
  
  if (parts.length !== 2 || parts[0] === 'search' || parts[0] === 'api') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }
  
  const category = parts[0];
  const slug = parts[1];

  try {
    // Attempt to read config
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
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
        const title = rawTitle.length > 60 ? rawTitle.substring(0, 57) + "..." : rawTitle;
        const rawExcerpt = docFields.excerpt?.stringValue || docFields.title?.stringValue || "";
        const excerpt = rawExcerpt.length > 120 ? rawExcerpt.substring(0, 117) + "..." : rawExcerpt;
        const imageUrl = docFields.coverImage?.stringValue || docFields.imageUrl?.stringValue || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop&q=80";
        const datePublished = docFields.date?.stringValue || docFields.publishDate?.stringValue || new Date().toISOString();
        const author = docFields.author?.stringValue || "GistWire";
        const currentUrl = `${fullBaseUrl}${url}`;
        
        const metaTags = `
    <!-- META_TAGS_START -->
    <title>${title.replace(/"/g, '&quot;')} | Gist Wire</title>
    <meta name="title" content="${title.replace(/"/g, '&quot;')} | Gist Wire" />
    <meta name="description" content="${excerpt.replace(/"/g, '&quot;')}" />
    
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Gist Wire" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')} | Gist Wire" />
    <meta property="og:description" content="${excerpt.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />
    
    <meta property="article:published_time" content="${datePublished}" />
    <meta property="article:author" content="${author}" />
    <meta property="article:section" content="${docFields.category?.stringValue || category}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@gistwire" />
    <meta name="twitter:creator" content="@gistwire" />
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')} | Gist Wire" />
    <meta name="twitter:description" content="${excerpt.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <!-- META_TAGS_END -->
        `;
        
        html = html.replace(metaTagRegex, metaTags);
      }
    }
  } catch (e) {
    console.error("Failed to fetch meta tags for article", e);
  }
  
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}
