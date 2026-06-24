import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { url } = req;
  const fullBaseUrl = `https://gistwireng.vercel.app`;

  // Provide a safe default for non-article pages
  let metaTags = `
    <title data-seo="true">GistWire News - Breaking Stories, Sports & Tech Updates</title>
    <meta name="description" content="Get the latest breaking news, sports updates, tech trends, and exclusive stories on GistWire." data-seo="true" />
    <meta property="og:title" content="GistWire News - Breaking Stories, Sports & Tech Updates" data-seo="true" />
    <meta property="og:description" content="Get the latest breaking news, sports updates, tech trends, and exclusive stories on GistWire." data-seo="true" />
    <meta property="og:site_name" content="GistWire" data-seo="true" />
    <meta property="og:type" content="website" data-seo="true" />
    <meta property="og:image" content="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop&q=80" data-seo="true" />
    <meta property="og:image:width" content="1200" data-seo="true" />
    <meta property="og:image:height" content="630" data-seo="true" />
    <meta name="twitter:card" content="summary_large_image" data-seo="true" />
    <meta name="twitter:title" content="GistWire News - Breaking Stories, Sports & Tech Updates" data-seo="true" />
    <meta name="twitter:description" content="Get the latest breaking news, sports updates, tech trends, and exclusive stories on GistWire." data-seo="true" />
    <meta name="twitter:image" content="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop&q=80" data-seo="true" />
  `;

  try {
    // Determine the article slug if the route is an article
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/').filter(Boolean);

    let isArticleRoute = false;

    if (parts.length >= 2 && parts[0] !== 'assets' && parts[0] !== 'api') {
      isArticleRoute = true;
      const slug = parts[1];

      // Use Firestore REST API to fetch the article dynamically
      const projectId = 'my-blog-499410'; 
      const databaseId = 'ai-studio-05d01ffd-36a6-451b-8025-e95bb12af3d3';
      const apiKey = 'AIzaSyBy_4sBE340ew-ODCoLpqmw459LtaYT7I8';
      
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery?key=${apiKey}`;
      
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: 'articles' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: slug }
            }
          },
          limit: 1
        }
      };

      const response = await fetch(firestoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].document) {
          const docFields = data[0].document.fields;
          const title = docFields.title?.stringValue || '';
          const excerpt = docFields.excerpt?.stringValue || '';
          const imageUrl = docFields.coverImage?.stringValue || '';
          const author = docFields.author?.stringValue || 'GistWire';
          const publishDate = docFields.date?.stringValue || docFields.publishDate?.stringValue || '';
          const currentUrl = `${fullBaseUrl}${url}`;

          metaTags = `
            <meta property="og:site_name" content="GistWire" data-seo="true" />
            <meta property="og:type" content="article" data-seo="true" />
            <meta property="og:url" content="${currentUrl}" data-seo="true" />
            <meta name="twitter:card" content="summary_large_image" data-seo="true" />
          `;

          if (title) {
            metaTags += `
              <title data-seo="true">${title}</title>
              <meta property="og:title" content="${title}" data-seo="true" />
              <meta name="twitter:title" content="${title}" data-seo="true" />
            `;
          }

          if (excerpt) {
            metaTags += `
              <meta property="og:description" content="${excerpt}" data-seo="true" />
              <meta name="description" content="${excerpt}" data-seo="true" />
              <meta name="twitter:description" content="${excerpt}" data-seo="true" />
            `;
          }

          if (imageUrl) {
            metaTags += `
              <meta property="og:image" content="${imageUrl}" data-seo="true" />
              <meta property="og:image:width" content="1200" data-seo="true" />
              <meta property="og:image:height" content="630" data-seo="true" />
              <meta name="twitter:image" content="${imageUrl}" data-seo="true" />
            `;
          }

          metaTags += `
            <script type="application/ld+json" data-seo="true">
            {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": "${title}",
              "image": ["${imageUrl}"],
              "datePublished": "${publishDate}",
              "author": [{"@type":"Person","name":"${author}"}],
              "url": "${currentUrl}",
              "publisher": {
                "@type": "Organization",
                "name": "GistWire",
                "logo": {
                  "@type": "ImageObject",
                  "url": "${fullBaseUrl}/favicon-32x32.png"
                }
              }
            }
            </script>
          `;
        } else {
          // Article not found, do not fallback
          metaTags = '';
        }
      } else {
        // Fetch failed, do not fallback
        metaTags = '';
      }
    }

    // Read the static index.html built by Vite
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // Replace the placeholder with the dynamic tags
    const metaTagRegex = /<!-- META_TAGS_START -->[\\s\\S]*<!-- META_TAGS_END -->/;
    html = html.replace(metaTagRegex, metaTags);

    // Send the response
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error generating OG tags:', error);
    // On error, try to serve the raw html without failing the page load
    try {
      const indexPath = path.join(process.cwd(), 'dist', 'index.html');
      const html = fs.readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (fallbackError) {
      res.status(500).send('Internal Server Error. Make sure you have run "npm run build".');
    }
  }
}
