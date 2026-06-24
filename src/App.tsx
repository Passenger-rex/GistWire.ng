import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import ArticleView from "./pages/ArticleView";
import Editor from "./pages/Editor";
import Contact from "./pages/Contact";
import About from "./pages/About";
import DownloadLogo from "./pages/DownloadLogo";
import Logo from "./components/Logo";
import { Facebook, Linkedin, Instagram, Twitter, Search, Menu, X, ArrowUp } from 'lucide-react';
import { useScrollHeader } from './hooks/useScrollHeader';
import { useSEO } from './hooks/useSEO';

export default function App() {
  const [route, setRoute] = useState(window.location.pathname || "/");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  const isScrolled = useScrollHeader(40);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  const showBackToTop = useScrollHeader(400);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);

    // Global click interceptor for SPA navigation
    const onNavigate = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest('a');
      if (a && a.href && a.href.startsWith(window.location.origin) && !a.getAttribute('target') && !a.getAttribute('download')) {
        const url = new URL(a.href);
        if (url.pathname === window.location.pathname && url.hash) {
          // Let default browser behavior handle page-internal hash links
          return;
        }
        e.preventDefault();
        window.history.pushState({}, '', url.pathname + url.search);
        setRoute(url.pathname + url.search);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('click', onNavigate);
    
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("click", onNavigate);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const targetPath = `/search/${encodeURIComponent(searchQuery.trim())}`;
      window.history.pushState({}, '', targetPath);
      setRoute(targetPath);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  let content;
  let pageTitle = "GistWire - Always First with the News";
  
  const createSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const parts = route.split('/').filter(Boolean);
  
  if (route.startsWith("/search/")) {
    const query = decodeURIComponent(route.replace("/search/", ""));
    pageTitle = `Search Results for "${query}" - GistWire`;
    content = <Home searchQuery={query} />;
  } else if (route === "/write") {
    pageTitle = "Admin Control Panel - GistWire";
    content = <Editor />;
  } else if (route === "/contact") {
    pageTitle = "Contact Us - GistWire";
    content = <Contact />;
  } else if (route === "/about") {
    pageTitle = "About Us - GistWire";
    content = <About />;
  } else if (route === "/download-logo") {
    pageTitle = "Download Logo - GistWire";
    content = <DownloadLogo />;
  } else if (parts.length === 2 && parts[0] !== 'search') {
    // Article URL: /category-slug/article-slug
    const slug = parts[1];
    content = <ArticleView slug={slug} />;
    // Note: SEO is managed by ArticleView for articles
  } else if (parts.length === 1 && parts[0] !== 'search') {
    // Category URL: /category-slug
    const catSlug = parts[0];
    pageTitle = `${catSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} News - GistWire`; // Dynamic fallback title
    content = <Home categoryQuery={catSlug} isSlug={true} />;
  } else {
    // Home router (parts.length === 0)
    content = <Home />;
  }

  useSEO({
    title: pageTitle,
    description: `${pageTitle} - Your premium source for up-to-the-minute updates, celebrity gists, and unfiltered news from across the nation to the global stage.`,
    url: typeof window !== 'undefined' ? window.location.href : '',
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Celebrity News", href: "/celebrity-news" },
    { name: "Music", href: "/music" },
    { name: "Education", href: "/education" },
    { name: "Technology", href: "/technology" },
    { name: "Business", href: "/business" },
    { name: "Entertainment", href: "/entertainment" },
    { name: "Sport", href: "/sport" }
  ];

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Mock Top Header bar */}
        <div className="overflow-hidden bg-[#0a0a0a]">
          <div className="text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-center md:text-left flex justify-between items-center max-w-7xl mx-auto w-full">
            <div className="h-3 w-32 bg-gray-800 rounded animate-pulse"></div>
            <div className="hidden md:flex gap-4 items-center">
              <div className="h-3 w-4 bg-gray-800 rounded animate-pulse"></div>
              <div className="h-3 w-4 bg-gray-800 rounded animate-pulse"></div>
              <div className="h-3 w-4 bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Mock Main Header with Logo area */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 flex items-center justify-between">
            <div className="h-10 w-44 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-72 bg-gray-100 rounded-full animate-pulse hidden lg:block"></div>
          </div>
        </div>

        {/* Mock Category Bar */}
        <div className="bg-white border-b border-gray-200 py-3 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 flex gap-6">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Area Grid Skeleton */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column (Feature content) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="w-full h-[400px] bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>

            {/* Right Side Column (Recommended / Latest sidebar) */}
            <div className="space-y-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="space-y-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Under grid row of sub cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[100]">
        {/* Top Header auto-collapses on scroll */}
        <div className={`transition-all duration-0 ease-in-out overflow-hidden transform-gpu [backface-visibility:hidden] ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
          <div className="bg-[#0a0a0a]">
            <div className="text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-center md:text-left flex justify-between items-center max-w-7xl mx-auto w-full">
              <span>{today}</span>
              <div className="hidden md:flex gap-4 items-center">
                 <a href="https://facebook.com/gistwiree" target="_blank" rel="noopener noreferrer" className="hover:text-[#00a85a] transition" aria-label="Facebook"><Facebook size={12} /></a>
                 <a href="https://x.com/gist_wire" target="_blank" rel="noopener noreferrer" className="hover:text-[#00a85a] transition" aria-label="Twitter"><Twitter size={12} /></a>
                 <a href="https://instagram.com/gistwireng" target="_blank" rel="noopener noreferrer" className="hover:text-[#00a85a] transition" aria-label="Instagram"><Instagram size={12} /></a>
                 <a href="https://linkedin.com/company/gistwire" target="_blank" rel="noopener noreferrer" className="hover:text-[#00a85a] transition" aria-label="LinkedIn"><Linkedin size={12} /></a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-20 bg-white">
          <div className={`flex items-center justify-between transition-all duration-0 ease-in-out [backface-visibility:hidden] ${isScrolled ? 'py-2' : 'py-4 md:py-5'}`}>
            
            {/* Mobile Menu Toggle (Left on Mobile) */}
            <div className="lg:hidden flex items-center">
              <button className="text-[#111111] p-1 -ml-1 hover:text-[#00a85a] transition-colors duration-200" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={30} />
              </button>
            </div>

            {/* Logo in header stays a constant size and does not shrink on scroll */}
            <a href="/" className="inline-block transform-gpu [backface-visibility:hidden]">
              <Logo />
            </a>

            {/* Desktop Search & Mobile Right Icon */}
            <div className="flex items-center">
              {/* Desktop Search */}
              <div className={`hidden lg:flex items-center gap-8 transition-opacity duration-300 ${isScrolled ? 'opacity-80' : 'opacity-100'}`}>
                <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full overflow-hidden border border-transparent focus-within:border-[#00a85a] transition w-72">
                  <input 
                    type="text" 
                    placeholder="Search news..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent px-5 py-2.5 font-sans text-sm focus:outline-none w-full text-[#111111]"
                  />
                  <button type="submit" className="text-gray-500 hover:text-[#00a85a] transition pr-4">
                    <Search size={18} />
                  </button>
                </form>
              </div>

              {/* Mobile Right Icon */}
              <div className="lg:hidden flex items-center">
                 <button className="text-[#111111] p-1 -mr-1 hover:text-[#00a85a] transition-colors duration-200" onClick={() => setIsMobileMenuOpen(true)}>
                  <Search size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Detailed Navigation */}
        <nav className={`hidden lg:block border-y border-gray-200 bg-white shadow-sm relative w-full overflow-x-auto transition-all duration-300 ${isScrolled ? 'py-0' : 'py-0'}`}>
          <div className="max-w-7xl mx-auto px-4 flex items-center">
            <div className="flex justify-between space-x-6 w-full whitespace-nowrap min-w-max md:min-w-0">
              {navLinks.map(link => {
                const isActive = route === link.href || (link.href !== '/' && route.startsWith(link.href));
                return (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className={`py-3 md:py-4 text-[13px] font-display font-black uppercase tracking-widest transition-all duration-200 linear border-b-[3px] 
                      ${isActive ? 'text-[#00a85a] border-[#00a85a]' : 'text-gray-800 border-transparent hover:text-[#00a85a] hover:border-b-gray-300'}`}
                  >
                    {link.name}
                  </a>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Fade Overlay for Mobile Slide-in Menu */}
        <div 
          className={`lg:hidden fixed inset-0 bg-black/70 z-[110] transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Slide-in Sidebar Navigation */}
        <div className={`lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white z-[120] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white shrink-0">
            <a href="/" className="transform scale-90 origin-left inline-block" onClick={() => setIsMobileMenuOpen(false)}>
              <Logo />
            </a>
            <button className="text-gray-500 hover:text-[#111111] p-2 transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSearch} className="p-5 border-b border-gray-50 shrink-0">
            <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-transparent focus-within:border-[#00a85a] transition-colors duration-200">
              <input 
                type="text" 
                placeholder="Search news..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent px-4 py-3 font-sans text-sm focus:outline-none w-full"
              />
              <button type="submit" className="text-gray-500 hover:text-[#00a85a] transition pr-4">
                <Search size={18} />
              </button>
            </div>
          </form>

          <div className="flex flex-col overflow-y-auto flex-grow py-2">
            {navLinks.map(link => {
              const isActive = route === link.href || (link.href !== '/' && route.startsWith(link.href));
              return (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-6 py-4 text-[13px] font-bold uppercase tracking-widest relative group transition-colors duration-200 ease-linear border-b border-gray-50 ${isActive ? 'text-[#00a85a] bg-gray-50' : 'text-gray-700 hover:text-[#00a85a] hover:bg-gray-50'}`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00a85a]"></span>
                  )}
                </a>
              );
            })}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-start gap-6 text-gray-600 mt-auto shrink-0">
             <a href="https://facebook.com/gistwiree" target="_blank" rel="noopener noreferrer" className="hover:text-[#111111] transition" aria-label="Facebook"><Facebook size={20} /></a>
             <a href="https://x.com/gist_wire" target="_blank" rel="noopener noreferrer" className="hover:text-[#111111] transition" aria-label="Twitter"><Twitter size={20} /></a>
             <a href="https://instagram.com/gistwireng" target="_blank" rel="noopener noreferrer" className="hover:text-[#111111] transition" aria-label="Instagram"><Instagram size={20} /></a>
             <a href="https://linkedin.com/company/gistwire" target="_blank" rel="noopener noreferrer" className="hover:text-[#111111] transition" aria-label="LinkedIn"><Linkedin size={20} /></a>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {content}
      </main>

      <footer className="bg-[#0a0a0a] text-gray-300 py-16 border-t-[8px] border-[#00a85a] mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
          <div className="md:col-span-1">
            <a href="/" className="inline-block mb-4 -ml-4">
              <Logo lightText={true} />
            </a>
            <p className="text-gray-400 mb-6 leading-relaxed font-sans font-medium text-xs">
              Your premium source for up-to-the-minute updates, celebrity gists, and unfiltered news from across the nation to the global stage. Stay plugged in.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold uppercase tracking-widest text-[#00a85a] mb-4 text-xs shrink-0 inline-block border-b-2 border-[#00a85a] pb-1">Quick Links</h4>
            <div className="flex flex-col gap-3 font-medium text-xs">
              <a href="/category/celebrity-news" className="text-gray-300 hover:text-white transition uppercase tracking-wider">Celebrity News</a>
              <a href="/category/music" className="text-gray-300 hover:text-white transition uppercase tracking-wider">Music Updates</a>
              <a href="/category/entertainment" className="text-gray-300 hover:text-white transition uppercase tracking-wider">Entertainment</a>
              <a href="/category/technology" className="text-gray-300 hover:text-white transition uppercase tracking-wider">Tech & AI</a>
            </div>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-widest text-[#00a85a] mb-4 text-xs shrink-0 inline-block border-b-2 border-[#00a85a] pb-1">Company</h4>
            <div className="flex flex-col gap-3 font-medium text-xs">
              <a href="/about" className="text-gray-300 hover:text-white transition uppercase tracking-wider">About Us</a>
              <a href="/contact" className="text-gray-300 hover:text-white transition uppercase tracking-wider">Contact Us</a>
            </div>
          </div>

          <div>
             <h4 className="font-bold uppercase tracking-widest text-[#00a85a] mb-4 text-xs shrink-0 inline-block border-b-2 border-[#00a85a] pb-1">Connect</h4>
             <p className="text-xs text-gray-500 mb-4 font-medium">Follow us on social media for live updates as they break.</p>
             <div className="flex flex-wrap gap-2">
              <a href="https://facebook.com/gistwiree" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center hover:bg-[#00a85a] transition text-white" aria-label="Facebook"><Facebook size={14} /></a>
              <a href="https://x.com/gist_wire" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center hover:bg-[#00a85a] transition text-white" aria-label="Twitter"><Twitter size={14} /></a>
              <a href="https://instagram.com/gistwireng" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center hover:bg-[#00a85a] transition text-white" aria-label="Instagram"><Instagram size={14} /></a>
              <a href="https://linkedin.com/company/gistwire" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center hover:bg-[#00a85a] transition text-white" aria-label="LinkedIn"><Linkedin size={14} /></a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-[#222222] text-center text-gray-500 text-[10px] font-bold uppercase tracking-wider">
          <p>
            © {new Date().getFullYear()} <a href="/write" className="text-current cursor-text" aria-label="Admin Control Panel" onClick={(e) => { e.stopPropagation(); }}>GistWire</a> Media. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 w-12 h-12 bg-[#00a85a] hover:bg-[#008f4c] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-50 focus:outline-none ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
        aria-label="Back to Top"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
}
