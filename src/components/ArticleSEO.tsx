import { useSEO } from "../hooks/useSEO";

interface ArticleSEOProps {
  title: string;
  description?: string;
  slug: string;
  coverImage?: string;
  category?: string;
  publishedAt?: string;
  authorName?: string;
}

export default function ArticleSEO({
  title,
  description,
  slug,
  coverImage,
  category,
  publishedAt,
  authorName,
}: ArticleSEOProps) {
  useSEO({
    title: title ? `${title} - GistWire` : undefined,
    description: description,
    image: coverImage ? { url: coverImage } : undefined,
    url: typeof window !== 'undefined' ? window.location.href : '',
    type: 'article',
    publishedTime: publishedAt,
    author: authorName,
  });

  return null;
}
