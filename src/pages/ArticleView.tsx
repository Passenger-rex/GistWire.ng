import React, { useEffect, useState, useRef } from "react";
import { Article } from "../types";
import { getArticleBySlug, getComments, saveComment, likeComment, CommentType, incrementViews, getArticles } from "../lib/db";
import { MessageCircle, ThumbsUp, Facebook, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";

const createSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function RecentArticles({ excludeId, category, limit = 3, inline = false }: { excludeId: string, category?: string, limit?: number, inline?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  useEffect(() => {
    getArticles().then(all => {
      // Sort by publishDate descending
      let sorted = all.sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
      if (category) {
        sorted = sorted.filter(a => a.category === category);
      }
      setArticles(sorted.filter(a => a.id !== excludeId).slice(0, limit));
    });
  }, [excludeId, category, limit]);

  if (articles.length === 0) {
    return <p className="text-gray-500 font-medium text-sm">No other headlines right now.</p>;
  }

  return (
    <>
      {articles.map(article => (
        <a key={article.id} href={`/${createSlug(article.category)}/${article.slug}`} className={`flex flex-col gap-3 group ${inline ? 'h-full' : ''}`}>
          <div className={`w-full bg-gray-200 flex-shrink-0 border-b-[4px] border-[#00a85a] ${inline ? 'h-40' : 'h-32'}`}>
            {article.coverImage ? (
              <img src={article.coverImage} className="w-full h-full object-cover group-hover:opacity-80 transition" alt="thumbnail" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:opacity-80 transition italic text-xs">No Image</div>
            )}
          </div>
          <div className={`${inline ? 'flex flex-col flex-grow' : ''}`}>
            <p className="text-[10px] font-black uppercase text-[#00a85a] mb-1 tracking-widest">{article.category}</p>
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#00a85a] transition leading-snug">{article.title}</h4>
          </div>
        </a>
      ))}
    </>
  );
}

export default function ArticleView({ slug }: { slug: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [headings, setHeadings] = useState<{ id: string, text: string, level: string }[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [hasLikedArticle, setHasLikedArticle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const calculateReadTime = (text: string | undefined | null) => {
    if (!text) return 1;
    const wordsPerMinute = 200;
    const cleanText = text.replace(/<[^>]*>?/gm, ''); // remove html tags
    const noOfWords = cleanText.split(/\s+/).length;
    return Math.max(1, Math.ceil(noOfWords / wordsPerMinute));
  };

  useEffect(() => {
    setLoading(true);
    getArticleBySlug(slug).then(found => {
      setArticle(found || null);
      if (found) {
        getComments(found.id).then(setComments);
        incrementViews(slug);
        
        // SEO Meta updates
        document.title = `${found.title} - GistWire`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', found.excerpt || found.title);

        const setMetaTag = (property: string, content: string) => {
          let meta = document.querySelector(`meta[property="${property}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', content);
        };
        setMetaTag('og:title', found.title);
        setMetaTag('og:description', found.excerpt || '');
        if (found.coverImage) setMetaTag('og:image', found.coverImage);
      }
      setLoading(false);
    });
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const progress = (scrollY / (docHeight - winHeight)) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (article && contentRef.current) {
      const hTags = contentRef.current.querySelectorAll<HTMLElement>("h2, h3");
      const extractedHeadings = Array.from(hTags as NodeListOf<HTMLElement>).map((h, i) => {
        if (!h.id) h.id = `section-heading-${i}`;
        return { id: h.id, text: h.textContent || "", level: h.tagName.toLowerCase() };
      });
      setHeadings(extractedHeadings);

      const imgTags = contentRef.current.querySelectorAll("img");
      imgTags.forEach(img => {
        if (!img.hasAttribute("loading")) {
          img.setAttribute("loading", "lazy");
        }
      });
    }
  }, [article]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !newCommentName.trim() || !newCommentText.trim()) return;
    
    const comment: CommentType = {
      id: Date.now().toString(),
      articleId: article.id,
      name: newCommentName,
      text: newCommentText,
      date: new Date().toISOString(),
      likes: 0
    };
    
    await saveComment(comment);
    setComments(await getComments(article.id));
    setNewCommentText("");
  };

  const handleLikeArticle = async () => {
    if (!article) return;
    const isLiking = !hasLikedArticle;
    setHasLikedArticle(isLiking);
    setArticle({...article, likes: (article.likes || 0) + (isLiking ? 1 : -1)});

    import("../lib/db").then(m => m.likeArticle(article.slug, isLiking));
  };

  const shareUrl = window.location.href;
  const shareTitle = article?.title || "Check out this article!";

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleReply = (name: string) => {
    setNewCommentText(`@${name} `);
    textareaRef.current?.focus();
    // Using standard HTML id hash navigation or JS, remove the smooth behavior explicitly to avoid shaking if css already has smooth scroll
    document.getElementById("comment-form")?.scrollIntoView();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <article className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Social Share Sidebar Placeholder */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center gap-4 pt-4 border-r border-gray-200">
            <div className="h-12 w-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            ))}
          </div>

          {/* Main Content Skeleton Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-4/5 bg-gray-200 rounded animate-pulse"></div>
            
            {/* Metadata lines */}
            <div className="flex items-center gap-4 py-4 border-y border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Large cover image skeleton */}
            <div className="w-full aspect-[21/9] bg-gray-200 animate-pulse border-b-[4px] border-gray-100"></div>

            {/* Content paragraph blocks */}
            <div className="space-y-4 pt-6">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse pt-2"></div>
              <div className="h-4 bg-gray-200 rounded w-11/12 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
            </div>
          </div>

          {/* Sidebar Area Placeholder */}
          <div className="lg:col-span-3">
            <div className="h-6 w-32 bg-gray-200 rounded mb-6 animate-pulse"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-grow space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </article>
    );
  }

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center h-[50vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-sans font-black uppercase text-[#111111] mb-6 tracking-tighter">Article not found</h1>
        <a href="/" className="inline-block px-8 py-4 bg-[#00a85a] text-white font-black uppercase tracking-widest text-xs hover:bg-[#111111] transition">Return to Publication</a>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed top-0 left-0 h-1 bg-[#00a85a] z-[200] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
      <article className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Social Share Sidebar (Desktop) */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center gap-4 pt-4 border-r border-gray-200">
            <span className="text-xs font-black text-[#111111] uppercase tracking-widest mb-2" style={{writingMode: "vertical-rl", transform: "rotate(180deg)"}}>Share</span>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition text-gray-700">
              <Facebook size={16} />
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#111111] hover:text-white hover:border-[#111111] transition text-gray-700">
              <Twitter size={16} />
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] transition text-gray-700">
              <Linkedin size={16} />
            </a>
            <button onClick={handleCopyLink} className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#00a85a] hover:text-white hover:border-[#00a85a] transition text-gray-700">
              <LinkIcon size={16} />
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="mb-8 border-b-4 border-[#111111] pb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 bg-[#00a85a]"></span>
                <a href={`/${createSlug(article.category)}`} className="text-[#00a85a] font-black uppercase tracking-widest text-xs hover:text-[#00c86b] transition text-nowrap whitespace-nowrap">
                  {article.category}
                </a>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-black text-[#111111] leading-[1.1] tracking-tight mb-4">
                {article.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 font-sans font-medium leading-relaxed mb-6">
                {article.excerpt}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-bold text-[#111111] text-sm uppercase tracking-wider mb-1">By {article.author}</div>
                    <div className="text-[11px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                      <span>Published: {new Date(article.publishDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-300">•</span>
                      <span>{calculateReadTime(article.contentHtml)} min read</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
                  <button 
                    onClick={handleLikeArticle}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 transition text-sm font-bold uppercase tracking-widest ${hasLikedArticle ? 'bg-[#00a85a] text-white border-[#00a85a]' : 'border-gray-200 text-gray-600 hover:border-[#00a85a] hover:text-[#00a85a]'}`}
                  >
                    <ThumbsUp size={16} /> 
                    {article.likes || 0}
                  </button>
                  <div className="flex lg:hidden gap-3 border-l-2 border-gray-200 pl-3">
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600 transition"><Facebook size={20} /></a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#111111] transition"><Twitter size={20} /></a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#0077b5] transition"><Linkedin size={20} /></a>
                    <button onClick={handleCopyLink} className="text-gray-500 hover:text-[#00a85a] transition"><LinkIcon size={20} /></button>
                  </div>
                </div>
              </div>
          </div>

          {article.coverImage && (
            <figure className="mb-10">
               <img src={article.coverImage} alt={article.title} className="w-full object-cover bg-gray-100 border-b-[6px] border-[#00a85a]" />
              {article.imageSource && (
                <figcaption className="text-xs text-gray-500 mt-3 font-sans font-medium pb-4 border-b border-gray-200 uppercase tracking-widest">
                  Source: {article.imageSource}
                </figcaption>
              )}
            </figure>
          )}

          {headings.length > 0 && (
             <div className="bg-gray-50 border-l-[4px] border-[#00a85a] p-6 mb-10 lg:hidden">
               <h4 className="font-bold text-xs uppercase tracking-widest text-[#111111] mb-4">Table of Contents</h4>
               <ul className="space-y-3">
                 {headings.map(h => (
                   <li key={h.id} className={`${h.level === 'h3' ? 'ml-4' : ''}`}>
                     <a 
                        href={`#${h.id}`} 
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(h.id)?.scrollIntoView();
                        }}
                        className="text-gray-600 hover:text-[#00a85a] transition font-medium text-sm"
                     >
                       {h.text}
                     </a>
                   </li>
                 ))}
               </ul>
             </div>
          )}

          <div 
             ref={contentRef}
             className="prose prose-lg max-w-none font-sans font-medium text-gray-800 
                          prose-headings:font-black prose-headings:text-[#111111] prose-headings:scroll-mt-20
                          prose-a:text-[#00a85a] prose-a:underline hover:prose-a:text-[#00c86b] 
                          prose-p:leading-relaxed prose-blockquote:border-l-[6px] prose-blockquote:border-[#00a85a] prose-blockquote:bg-gray-50 
                          prose-blockquote:p-6 prose-blockquote:text-lg prose-blockquote:font-black prose-blockquote:text-[#111111]
                          prose-li:marker:text-[#00a85a] prose-img:border-b-[4px] prose-img:border-[#00a85a]" 
               dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

          {/* Related Articles Section */}
          <div className="mt-16 pt-10 border-t-[4px] border-gray-100">
             <h3 className="font-sans font-black text-2xl uppercase tracking-tighter mb-8 text-[#111111]">
               More in {article.category}
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RecentArticles excludeId={article.id} category={article.category} limit={2} inline />
             </div>
          </div>

          {/* Comments Section */}
          <div className="mt-16 pt-10 border-t-[4px] border-gray-200">
            <h3 className="font-sans font-black text-2xl uppercase tracking-tighter mb-8 flex items-center gap-3 text-[#111111]">
              <MessageCircle className="text-[#00a85a]" size={28} />
              Interactions & Comments ({comments.length})
            </h3>

            <div className="bg-gray-50 p-6 border-l-[4px] border-[#00a85a] mb-10">
              <h4 className="font-bold text-sm uppercase tracking-widest text-[#111111] mb-4">Leave a Reply</h4>
              <form id="comment-form" onSubmit={handlePostComment} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={newCommentName}
                  onChange={(e) => setNewCommentName(e.target.value)}
                  className="w-full md:w-1/2 border border-gray-300 p-3 text-sm outline-none focus:border-[#00a85a]"
                  required
                />
                <textarea 
                  ref={textareaRef}
                  placeholder="Share your thoughts..." 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full border border-gray-300 p-3 text-sm outline-none focus:border-[#00a85a] h-24 resize-none"
                  required
                />
                <button type="submit" className="bg-[#111111] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#00a85a] transition self-start">
                  Post Comment
                </button>
              </form>
            </div>

            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-[#111111]">{comment.name}</span>
                      <span className="text-gray-400 text-xs ml-3 font-medium uppercase tracking-wider">
                        {new Date(comment.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 font-sans font-medium text-sm leading-relaxed mb-3">
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                    <button onClick={() => handleReply(comment.name)} className="hover:text-[#111111] transition">Reply</button>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-gray-500 font-sans font-medium text-sm italic">No comments yet. Be the first to share your opinion!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 pl-0 lg:pl-8 border-t lg:border-t-0 lg:border-l border-gray-200 pt-10 lg:pt-0">
           <div className="sticky top-10 space-y-12">
             
             {headings.length > 0 && (
                <div className="hidden lg:block">
                  <h3 className="flex items-center text-xs font-black uppercase tracking-widest border-b-[4px] border-[#111111] pb-2 mb-6 text-[#111111]">
                    <span className="w-2 h-2 bg-[#00a85a] mr-2"></span> Navigation
                  </h3>
                  <ul className="space-y-3">
                    {headings.map(h => (
                      <li key={h.id} className={`${h.level === 'h3' ? 'ml-4' : ''}`}>
                        <a 
                          href={`#${h.id}`} 
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-gray-500 hover:text-[#00a85a] transition font-medium text-sm block border-l-2 border-transparent hover:border-[#00a85a] pl-2"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
             )}

             <div>
               <h3 className="flex items-center text-xs font-black uppercase tracking-widest border-b-[4px] border-[#111111] pb-2 mb-8 text-[#111111]">
                 <span className="w-2 h-2 bg-[#00a85a] mr-2"></span> Top Headlines
               </h3>
               <div className="space-y-8">
                  <RecentArticles excludeId={article.id} />
               </div>
             </div>
           </div>
        </aside>
      </div>
    </article>
    </>
  );
}
