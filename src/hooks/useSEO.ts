import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: {
    url: string;
    width?: string | number;
    height?: string | number;
  };
  url?: string;
  type?: string;
  skip?: boolean;
  publishedTime?: string;
  author?: string;
}

export function useSEO({
  title,
  description,
  image,
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  skip = false,
  publishedTime,
  author
}: SEOProps) {
  useEffect(() => {
    if (skip) return;

    // Helper to set meta tags and remove duplicates
    const setMetaTag = (attr: string, attrValue: string, content: string) => {
      if (!content) return;
      const elements = document.querySelectorAll(`meta[${attr}="${attrValue}"]`);
      
      // Remove all existing matching tags to prevent duplicates
      elements.forEach(el => el.remove());

      const element = document.createElement('meta');
      element.setAttribute(attr, attrValue);
      element.setAttribute('content', content);
      document.head.appendChild(element);
    };

    // Update Title
    if (title) {
      document.title = title;
      setMetaTag('property', 'og:title', title);
      setMetaTag('name', 'twitter:title', title);
    }

    // Update Description
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
      setMetaTag('name', 'twitter:description', description);
    }

    // Update Image
    if (image?.url) {
      setMetaTag('property', 'og:image', image.url);
      setMetaTag('name', 'twitter:image', image.url);
      if (image.width) setMetaTag('property', 'og:image:width', image.width.toString());
      if (image.height) setMetaTag('property', 'og:image:height', image.height.toString());
    }

    // Canonical URL
    if (url) {
      const links = document.querySelectorAll(`link[rel="canonical"]`);
      links.forEach(el => el.remove());
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }

    // Update URL & Type
    if (url) setMetaTag('property', 'og:url', url);
    if (type) setMetaTag('property', 'og:type', type);
    
    setMetaTag('property', 'og:site_name', 'GistWire');
    setMetaTag('name', 'twitter:card', 'summary_large_image');

    // JSON-LD Structured Data
    if (type === 'article' && title) {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) existingScript.remove();

      const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "image": image?.url ? [image.url] : [],
        "datePublished": publishedTime || new Date().toISOString(),
        "author": author ? [{ "@type": "Person", "name": author }] : [],
        "url": url,
        "publisher": {
          "@type": "Organization",
          "name": "GistWire",
          "logo": {
            "@type": "ImageObject",
            "url": "https://gistwire.com/favicon-32x32.png"
          }
        }
      };

      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [title, description, image, url, type, skip, publishedTime, author]);
}
