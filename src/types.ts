export interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  publishDate: string;
  excerpt: string;
  contentHtml: string;
  coverImage?: string;
  imageSource?: string;
  category: string;
  views?: number;
  likes?: number;
}
