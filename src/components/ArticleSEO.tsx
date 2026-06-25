import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = "Gist Wire";
const SITE_URL = "https://gistwireng.vercel.app";
const TWITTER_HANDLE = "@gistwire"; // Placeholder

const createSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface ArticleSEOProps {
  title: string;
  description: string;
  slug: string;
  coverImage: string; // Absolute URL (1200x630 recommended)
  category?: string;
  publishedAt?: string; // ISO 8601
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
  const url = slug.includes('/') ? `${SITE_URL}/${slug}` : `${SITE_URL}/${category ? createSlug(category) : 'news'}/${slug}`;
  const pageTitle = `${title} | ${SITE_NAME}`;

  // Truncate description to ~160 chars for safety
  const metaDesc =
    description?.length > 160 ? description.slice(0, 157) + "…" : description;

  return (
    <Helmet>
      {/* ── Basic / Standard Meta Tags ────────────────────────────────────── */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={url} />

      {/* ── Open Graph (Facebook, LinkedIn, Discord, Telegram, Slack, etc) ─ */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:locale" content="en_US" />

      {coverImage && (
        <>
          <meta property="og:image" content={coverImage} />
          {/* Include secure_url for some strict platforms */}
          <meta property="og:image:secure_url" content={coverImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:alt" content={title} />
        </>
      )}

      {/* ── Article-specific OG (Facebook, LinkedIn, Pinterest) ──────────── */}
      {publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {authorName && <meta property="article:author" content={authorName} />}
      {category && <meta property="article:section" content={category} />}

      {/* ── Twitter / X Card ─────────────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      {coverImage && (
        <>
          <meta name="twitter:image" content={coverImage} />
          <meta name="twitter:image:alt" content={title} />
        </>
      )}

      {/* ── Additional Tags for WhatsApp & iMessage ──────────────────────── */}
      {/* WhatsApp specifically likes having these in place, though OG usually handles it */}
      <meta itemProp="name" content={pageTitle} />
      <meta itemProp="description" content={metaDesc} />
      {coverImage && <meta itemProp="image" content={coverImage} />}

      {/* JSON-LD for rich snippets on Google Search */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: title,
          image: coverImage ? [coverImage] : [],
          datePublished: publishedAt,
          author: authorName ? [{ "@type": "Person", "name": authorName }] : [],
          url: url,
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: {
              "@type": "ImageObject",
              url: `${SITE_URL}/favicon-32x32.png`,
            },
          },
        })}
      </script>
    </Helmet>
  );
}
