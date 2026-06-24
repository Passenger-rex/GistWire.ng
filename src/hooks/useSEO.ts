import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  imageWidth?: string | number;
  imageHeight?: string | number;
  url?: string;
  type?: string;
}

export function useSEO({
  title,
  description,
  imageUrl,
  imageWidth,
  imageHeight,
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website'
}: SEOProps) {
  useEffect(() => {
    // Helper to set meta tags
    const setMetaTag = (attr: string, attrValue: string, content: string) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
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
    if (imageUrl) {
      setMetaTag('property', 'og:image', imageUrl);
      setMetaTag('name', 'twitter:image', imageUrl);
      if (imageWidth) setMetaTag('property', 'og:image:width', imageWidth.toString());
      if (imageHeight) setMetaTag('property', 'og:image:height', imageHeight.toString());
    }

    // Update URL & Type
    if (url) setMetaTag('property', 'og:url', url);
    if (type) setMetaTag('property', 'og:type', type);
    
    setMetaTag('property', 'og:site_name', 'GistWire');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
  }, [title, description, imageUrl, imageWidth, imageHeight, url, type]);
}
