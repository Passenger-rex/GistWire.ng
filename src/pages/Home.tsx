import { useEffect, useState } from "react";
import { Article } from "../types";
import { getArticles } from "../lib/db";

const createSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Home({ searchQuery, categoryQuery, isSlug }: { searchQuery?: string, categoryQuery?: string, isSlug?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChip, setActiveChip] = useState('All News');

  const chips = ['All News', 'Trending', 'Breaking', "Editor's Pick", 'Politics', 'Business', 'Sports', 'World', 'Local'];

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      let allArticles = await getArticles();
      if (!isMounted) return;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        allArticles = allArticles.filter(a => 
          a.title.toLowerCase().includes(q) || 
          a.category.toLowerCase().includes(q) ||
          a.contentHtml.toLowerCase().includes(q)
        );
      }
      if (categoryQuery) {
        const q = categoryQuery.toLowerCase();
        allArticles = allArticles.filter(a => {
          if (isSlug) {
             return createSlug(a.category) === q;
          }
          return a.category.toLowerCase().trim() === q.trim() || a.category.toLowerCase().includes(q);
        });
      }
      setArticles(allArticles);
      setIsLoading(false);
    })();
    return () => { isMounted = false; };
  }, [searchQuery, categoryQuery, isSlug]);

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Scrollable Chip Filter Skeleton */}
      {!searchQuery && !categoryQuery && (
        <div className="flex overflow-x-auto gap-3 pb-2 mb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {chips.map((chip, index) => (
            <div 
              key={index}
              className="bg-gray-100 border border-gray-100 text-transparent select-none px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest animate-pulse"
            >
              {chip}
            </div>
          ))}
        </div>
      )}

      {searchQuery && (
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8"></div>
      )}
      {categoryQuery && (
        <div className="h-10 w-80 bg-gray-200 rounded animate-pulse mb-8"></div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t-[4px] border-gray-100 pt-8 mt-2">
        {/* Main Feed Skeleton */}
        <div className="lg:col-span-9 space-y-12">
          {[1, 2].map((sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <div className="h-6 w-38 bg-gray-200 rounded mb-8 animate-pulse"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((cardIndex) => (
                  <div key={cardIndex} className="flex flex-col h-full space-y-3">
                    <div className="aspect-[16/9] w-full bg-gray-200 border-b-[4px] border-gray-100 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/5 animate-pulse mt-auto pt-2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trending Sidebar Skeleton */}
        <aside className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-gray-200 pt-10 lg:pt-0 pl-0 lg:pl-10">
          <div className="sticky top-10">
            <div className="h-6 w-40 bg-gray-200 rounded mb-8 animate-pulse"></div>
            <div className="flex flex-col space-y-8">
              {[1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="flex gap-4">
                  <span className="text-4xl font-display font-black text-gray-100 leading-none select-none">
                    {index}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  if (articles.length === 0) return (
    <div className="p-20 text-center">
      <p className="text-gray-500 font-sans font-bold text-lg">
        {searchQuery ? `No results found for "${searchQuery}".` : categoryQuery ? `No articles found in category "${categoryQuery}".` : "No news currently available. Check back later."}
      </p>
    </div>
  );

  let displayedArticles = articles;
  if (activeChip !== 'All News') {
    if (activeChip === 'Trending') {
      displayedArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (activeChip === 'Breaking') {
       displayedArticles = [...articles].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).slice(0, 8);
    } else if (activeChip === "Editor's Pick") {
       displayedArticles = [...articles].sort((a, b) => a.title.length - b.title.length).slice(0, 6); // Mock filter
    } else {
       displayedArticles = articles.filter(a => a.category.toLowerCase() === activeChip.toLowerCase());
    }
  }

  // Group articles by category
  const categorizedArticles: Record<string, Article[]> = {};
  displayedArticles.forEach(article => {
    if (!categorizedArticles[article.category]) {
      categorizedArticles[article.category] = [];
    }
    categorizedArticles[article.category].push(article);
  });

  const trendingArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Scrollable Chip Filter */}
      {!searchQuery && !categoryQuery && (
        <div className="flex overflow-x-auto gap-3 pb-2 mb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {chips.map(chip => (
            <button 
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors border ${
                activeChip === chip 
                  ? 'bg-[#111111] text-white border-[#111111]' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#00a85a] hover:text-[#00a85a]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {searchQuery && (
        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#111111] mb-8 border-l-[6px] border-[#00a85a] pl-4">
          Search Results: <span className="text-[#00a85a]">"{searchQuery}"</span>
        </h2>
      )}
      {categoryQuery && (
        <h2 className="text-3xl font-black uppercase tracking-tighter text-[#111111] mb-8 border-l-[6px] border-[#00a85a] pl-4">
          Latest in <span className="text-[#00a85a]">{categoryQuery}</span>
        </h2>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t-[4px] border-gray-100 pt-8 mt-2">
        <div className="lg:col-span-9">
          {Object.entries(categorizedArticles).map(([category, categoryArticles]) => (
            <div key={category} className="mb-12">
               {(!categoryQuery && !searchQuery) && (
                 <a href={`/${createSlug(category)}`} className="flex items-center text-xs font-black uppercase tracking-widest border-b-[4px] border-[#111111] pb-2 mb-8 text-[#111111] hover:text-[#00a85a] transition group">
                   <span className="w-2 h-2 bg-[#00a85a] mr-2 group-hover:bg-[#111111] transition"></span> {category}
                 </a>
               )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryArticles.map(article => (
                  <div key={article.id} className="group flex flex-col h-full">
                    <a href={`/${createSlug(article.category)}/${article.slug}`} className="block flex-grow">
                      <div className="aspect-[16/9] overflow-hidden bg-gray-100 mb-3 border-b-[4px] border-[#00a85a] relative">
                        {article.coverImage && (
                          <img src={article.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={article.title} loading="lazy" />
                        )}
                      </div>
                      <h4 className="font-black text-lg leading-snug mb-2 group-hover:text-[#00a85a] transition text-gray-900 tracking-tight">
                        {article.title}
                      </h4>
                      <p className="text-gray-600 text-sm font-sans font-medium line-clamp-2 mb-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </a>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-auto pt-2 border-t border-gray-100">
                      {article.author} <span className="mx-1">•</span> {new Date(article.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trending Sidebar */}
        <aside className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-gray-200 pt-10 lg:pt-0 pl-0 lg:pl-10">
          <div className="sticky top-10">
            <h3 className="flex items-center text-xs font-black uppercase tracking-widest border-b-[4px] border-[#111111] pb-2 mb-8 text-[#111111]">
              <span className="w-2 h-2 bg-[#00a85a] mr-2 animate-pulse"></span> Trending Now
            </h3>
            <div className="flex flex-col space-y-8">
              {trendingArticles.map((article, index) => (
                <div key={article.id} className="flex gap-4 group">
                  <span className="text-4xl font-display font-black text-gray-200 leading-none">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#00a85a] mb-1 tracking-widest">{article.category}</p>
                    <a href={`/${createSlug(article.category)}/${article.slug}`}>
                      <h4 className="text-sm font-bold text-[#111111] group-hover:text-[#00a85a] transition leading-snug">
                        {article.title}
                      </h4>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
