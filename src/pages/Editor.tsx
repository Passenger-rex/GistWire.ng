import React, { useState, useEffect } from "react";
import { Article } from "../types";
import { saveArticles, getArticles, deleteArticle } from "../lib/db";
import { 
  Editor as WysiwygEditor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnStrikeThrough,
  BtnNumberedList,
  BtnBulletList,
  BtnLink,
  BtnClearFormatting,
  BtnStyles,
  HtmlButton,
  Separator
} from "react-simple-wysiwyg";
import { auth, provider } from "../lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { Sparkles } from "lucide-react";
import SocialGraphicGenerator from "../components/SocialGraphicGenerator";
import SocialCopyGenerator from "../components/SocialCopyGenerator";

export default function Editor() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userEditedSlug, setUserEditedSlug] = useState(false);
  const [isGraphicGeneratorOpen, setIsGraphicGeneratorOpen] = useState(false);
  const [selectedArticleForGraphic, setSelectedArticleForGraphic] = useState<Partial<Article> | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "News",
    excerpt: "",
    author: "Staff Reporter",
    coverImage: "",
    imageSource: "",
    contentHtml: "<p>Begin writing the news report here...</p>"
  });
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [linkPrompt, setLinkPrompt] = useState<{
    url: string;
    displayText: string;
    tempId: string;
  } | null>(null);
  
  const [previewLink, setPreviewLink] = useState<{
    url: string;
    title: string;
    description: string;
    image: string;
    top: number;
    left: number;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adText, setAdText] = useState("");
  const [adUrl, setAdUrl] = useState("");
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      getArticles().then(setArticles);
      if (user.displayName && formData.author === "Staff Reporter" && !formData.title) {
        setFormData(prev => ({ ...prev, author: user.displayName || "Staff Reporter" }));
      }
    } else {
      setArticles([]);
    }
  }, [user]);

  useEffect(() => {
    if (!userEditedSlug && !editingId && formData.title) {
       setFormData(prev => ({...prev, slug: prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}));
    }
  }, [formData.title, userEditedSlug, editingId]);

  useEffect(() => {
    if (formData.coverImage && !formData.imageSource) {
      try {
        const url = new URL(formData.coverImage);
        let domain = url.hostname.replace('www.', '');
        if (domain === 'images.unsplash.com') domain = 'Unsplash';
        else if (domain.includes('gettyimages')) domain = 'Getty Images';
        else if (domain.includes('pexels')) domain = 'Pexels';
        else if (domain.includes('pixabay')) domain = 'Pixabay';
        setFormData(prev => ({...prev, imageSource: domain}));
      } catch (e) {
        // invalid URL
      }
    }
  }, [formData.coverImage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Sign-In Error: ", err);
      setLoginError(err.message || "Failed to sign in with Google. Check Firebase Setup.");
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-Out Error:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.contentHtml) return;

    const existingArticle = articles.find(a => a.id === editingId);

    const newArticle: Article = {
      id: editingId || Date.now().toString(),
      slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: formData.title,
      category: formData.category,
      excerpt: formData.excerpt,
      author: formData.author,
      contentHtml: formData.contentHtml,
      coverImage: formData.coverImage,
      imageSource: formData.imageSource,
      publishDate: existingArticle?.publishDate || new Date().toISOString(),
      views: existingArticle?.views || 0
    };

    await saveArticles([newArticle]);
    setArticles(await getArticles());
    alert(editingId ? "Article Updated Successfully!" : "Article Published Successfully!");
    setEditingId(null);
    setUserEditedSlug(false);
    setFormData({ title: "", slug: "", category: "News", excerpt: "", author: user?.displayName || "Staff Reporter", coverImage: "", imageSource: "", contentHtml: "<p>Start writing the next report...</p>" });
  };

  const handleEdit = (a: Article) => {
    setUserEditedSlug(true);
    setFormData({
      title: a.title,
      slug: a.slug,
      category: a.category,
      excerpt: a.excerpt || "",
      author: a.author || "Staff Reporter",
      coverImage: a.coverImage || "",
      imageSource: a.imageSource || "",
      contentHtml: a.contentHtml
    });
    setEditingId(a.id);
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
         <div className="text-sm font-black uppercase tracking-widest text-[#111111] animate-pulse">Loading Admin Panel...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center h-[70vh] flex flex-col justify-center">
        <div className="bg-[#111111] p-10 shadow-2xl rounded-sm border-t-[6px] border-[#00a85a]">
          <div className="flex justify-center mb-6">
             <div className="bg-[#00a85a] text-white px-4 py-1 leading-none rounded-2xl shadow-sm -rotate-2 font-black text-3xl">Gist</div>
             <span className="italic font-black text-3xl text-white">Wire</span>
          </div>
          <h2 className="font-sans font-black text-xl uppercase tracking-tighter text-white mb-8">Admin Control Panel</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <button 
              type="submit" 
              className="bg-[#00a85a] text-white py-4 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-[#111111] transition w-full shadow-lg flex items-center justify-center gap-2 cursor-pointer rounded-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign In with Google
            </button>
            {loginError && (
              <p className="text-red-500 font-sans text-xs mt-2 text-center font-semibold leading-relaxed">{loginError}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  const handleEditorClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (anchor && anchor.href) {
      e.preventDefault();
      const rect = anchor.getBoundingClientRect();
      
      setIsLoadingPreview(true);
      setPreviewLink({
        url: anchor.href,
        title: "Loading...",
        description: "",
        image: "",
        top: rect.bottom + window.scrollY + 10,
        left: Math.max(10, rect.left + window.scrollX - 100),
      });
      
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(anchor.href)}`);
        if (res.ok) {
          const data = await res.json();
          setPreviewLink(prev => prev ? { 
            ...prev, 
            title: data.title || "No Title", 
            description: data.description, 
            image: data.image 
          } : null);
        } else {
          setPreviewLink(prev => prev ? { ...prev, title: "Failed to load preview" } : null);
        }
      } catch (err) {
        console.error("Failed to fetch link preview:", err);
        setPreviewLink(prev => prev ? { ...prev, title: "Failed to load preview" } : null);
      } finally {
        setIsLoadingPreview(false);
      }
    } else {
      if (!target.closest('.link-preview-card')) {
        setPreviewLink(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {linkPrompt && (
        <div className="fixed inset-0 bg-[#111111]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm border-t-[4px] border-[#00a85a]">
            <h3 className="font-sans font-black text-lg uppercase tracking-tighter text-[#111111] mb-6">Confirm Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">URL</label>
                <input 
                  type="text" 
                  value={linkPrompt.url} 
                  onChange={(e) => setLinkPrompt({...linkPrompt, url: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded p-3 text-gray-800 focus:ring-2 focus:ring-[#00a85a] focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Display Text</label>
                <input 
                  type="text" 
                  value={linkPrompt.displayText}
                  onChange={(e) => setLinkPrompt({...linkPrompt, displayText: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded p-3 text-gray-800 focus:ring-2 focus:ring-[#00a85a] focus:border-transparent outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    const tempElement = document.getElementById(linkPrompt.tempId);
                    if (tempElement) {
                      tempElement.outerHTML = linkPrompt.displayText || linkPrompt.url;
                    }
                    setLinkPrompt(null);
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[#111111] transition"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const tempElement = document.getElementById(linkPrompt.tempId);
                    if (tempElement) {
                      const linkHtml = `<a href="${linkPrompt.url}" target="_blank" rel="noopener noreferrer" class="text-[#00a85a] underline hover:text-[#00c86b]">${linkPrompt.displayText || linkPrompt.url}</a>`;
                      tempElement.outerHTML = linkHtml;
                      
                      const editorCe = document.querySelector('.rsw-ce');
                      if (editorCe) {
                        setFormData(prev => ({ ...prev, contentHtml: editorCe.innerHTML }));
                      }
                    }
                    setLinkPrompt(null);
                  }}
                  className="px-6 py-2 bg-[#00a85a] text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#111111] transition"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-12">
        
        {/* Left Column - Main Editor */}
        <div className="flex-1 max-w-4xl">
          <div className="mb-10 flex items-center justify-between border-b pb-4">
             <div className="flex flex-col">
               <h1 className="text-xl font-sans font-black uppercase tracking-widest text-[#111111]">
                 {editingId ? "Editing Article" : "Write a New Article"}
               </h1>
               <p className="text-gray-400 font-sans text-xs uppercase tracking-widest mt-1">Admin Portal / {user?.email} <button onClick={handleLogout} className="underline text-blue-500 ml-2 cursor-pointer">Logout</button></p>
             </div>
             {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setUserEditedSlug(false); setFormData({ title: "", slug: "", category: "News", excerpt: "", author: "Staff Reporter", coverImage: "", imageSource: "", contentHtml: "<p>Start writing the next report...</p>" }); }} className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-[#111111] transition bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full">
                  Cancel Edit
                </button>
             )}
          </div>

          <form id="editor-form" onSubmit={handleSave} className="space-y-6">
            {/* Title / Headline */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Article Title / Headline</label>
              <input 
                className="w-full text-lg border border-gray-300 rounded-lg p-4 text-[#111111] focus:ring-2 focus:ring-[#00a85a] focus:border-transparent outline-none transition shadow-sm" 
                placeholder="Enter a compelling headline..." 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            
            {/* Slug */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">URL Slug</label>
              <input 
                className="w-full text-sm font-mono border border-gray-300 rounded-lg p-3 text-gray-600 focus:ring-2 focus:ring-[#00a85a] focus:border-transparent outline-none transition shadow-sm" 
                placeholder="auto-generated-slug" 
                value={formData.slug} 
                onChange={e => {
                  setUserEditedSlug(true);
                  setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, '-')});
                }} 
                required 
              />
            </div>
            
            {/* Excerpt */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Excerpt / Subheadline</label>
              <textarea 
                className="w-full text-base border border-gray-300 rounded-lg p-4 text-gray-600 focus:ring-2 focus:ring-[#00a85a] focus:border-transparent outline-none transition shadow-sm resize-y" 
                placeholder="Write a brief excerpt or subheadline..." 
                value={formData.excerpt} 
                onChange={e => setFormData({...formData, excerpt: e.target.value})} 
                required 
                rows={3}
              />
            </div>

            {/* WYSIWYG Editor */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Article Body</label>
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#00a85a] transition text-gray-800">
                <EditorProvider>
                  <WysiwygEditor 
                    value={formData.contentHtml} 
                    onChange={(e) => setFormData({...formData, contentHtml: e.target.value})}
                    onPaste={(e) => {
                      const clipboardData = e.clipboardData;
                      if (!clipboardData) return;
                      
                      const htmlData = clipboardData.getData('text/html');
                      const textData = clipboardData.getData('text/plain');
                      
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const isSingleUrl = /^(https?:\/\/[^\s]+)$/.test(textData.trim());
                      
                      const selection = window.getSelection();
                      const hasSelection = selection && selection.toString().trim().length > 0;

                      if (isSingleUrl) {
                        e.preventDefault();
                        const tempId = `temp-link-${Date.now()}`;
                        const selectedText = hasSelection ? selection.toString() : textData.trim();
                        
                        // Insert a temporary highlighted span
                        const htmlToInsert = `<span id="${tempId}" style="background-color: #e6f7ef; border-bottom: 2px dashed #00a85a;">${selectedText}</span>`;
                        document.execCommand('insertHTML', false, htmlToInsert);
                        
                        setLinkPrompt({
                          url: textData.trim(),
                          displayText: selectedText,
                          tempId
                        });
                      } else if (!htmlData && urlRegex.test(textData)) {
                        e.preventDefault();
                        const htmlToInsert = textData
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#00a85a] underline hover:text-[#00c86b]">$1</a>')
                          .replace(/\n/g, '<br>');
                        document.execCommand('insertHTML', false, htmlToInsert);
                      }
                    }}
                    containerProps={{ 
                      onClick: handleEditorClick,
                      className: "prose max-w-none prose-a:text-[#00a85a] prose-a:underline hover:prose-a:text-[#00c86b] focus-within:outline-none p-4", 
                      style: { minHeight: '400px', resize: 'vertical' } 
                    }}
                  >
                    <Toolbar>
                      <BtnBold />
                      <BtnItalic />
                      <BtnUnderline />
                      <BtnStrikeThrough />
                      <Separator />
                      <BtnNumberedList />
                      <BtnBulletList />
                      <Separator />
                      <BtnLink />
                      <BtnClearFormatting />
                      <HtmlButton />
                      <Separator />
                      <BtnStyles />
                      <Separator />
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const selection = window.getSelection();
                          if (selection && selection.rangeCount > 0) {
                            setSavedSelection(selection.getRangeAt(0).cloneRange());
                          } else {
                            setSavedSelection(null);
                          }
                          setShowAdModal(true);
                        }}
                        className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition flex items-center gap-1"
                        title="Insert Ad Block"
                      >
                        + Insert Ad
                      </button>
                    </Toolbar>
                  </WysiwygEditor>
                </EditorProvider>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column - Publish Settings & Content Manager */}
        <aside className="w-full lg:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-10 lg:pt-0 lg:pl-10">
          <div className="sticky top-8 space-y-10">
            
            {/* Publish Action Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-widest text-[#111111] mb-6 flex items-center">
                <span className="w-2 h-2 bg-[#00a85a] rounded-full mr-3"></span> Publish Settings
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Category</label>
                  <select className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-bold text-[#111111] outline-none focus:border-[#00a85a] focus:ring-1 focus:ring-[#00a85a] transition" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="News">News</option>
                    <option value="Celebrity News">Celebrity News</option>
                    <option value="Music">Music</option>
                    <option value="Education">Education</option>
                    <option value="Technology">Technology</option>
                    <option value="Economy">Economy</option>
                    <option value="Business">Business</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Sport">Sport</option>
                    <option value="Finance">Finance</option>
                    <option value="War">War</option>
                    <option value="Travel">Travel</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Movies">Movies</option>
                    <option value="Trending">Trending</option>
                    <option value="AI">AI</option>
                    <option value="Software">Software</option>
                    <option value="Digital">Digital</option>
                    <option value="Make Money">Make Money</option>
                    <option value="Scholarships">Scholarships</option>
                    <option value="Spiritual">Spiritual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Reporter / Author</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-bold text-[#111111] outline-none focus:border-[#00a85a] focus:ring-1 focus:ring-[#00a85a] transition" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required form="editor-form" />
                </div>

                <div>
                  <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Cover Image URL</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-mono text-[#111111] outline-none focus:border-[#00a85a] focus:ring-1 focus:ring-[#00a85a] transition" placeholder="https://..." value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} form="editor-form" />
                  {formData.coverImage && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 bg-white">
                      <img src={formData.coverImage} alt="Cover Preview" className="w-full h-32 object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Image Source (Optional)</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-bold text-[#111111] outline-none focus:border-[#00a85a] focus:ring-1 focus:ring-[#00a85a] transition" placeholder="e.g. Getty Images, Reuters" value={formData.imageSource} onChange={e => setFormData({...formData, imageSource: e.target.value})} form="editor-form" />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button type="submit" form="editor-form" className="w-full bg-[#00a85a] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#111111] hover:-translate-y-1 hover:shadow-xl transition-all transform duration-200 cursor-pointer">
                  {editingId ? "Update Published Article" : "Publish to World"}
                </button>
              </div>
            </div>

            {/* Social Media News Graphic Generator Card */}
            <div className="bg-gradient-to-br from-[#00a85a]/5 to-[#00a85a]/10 border border-[#00a85a]/20 rounded-2xl p-6 shadow-sm">
              <h3 className="font-sans font-black text-sm uppercase tracking-widest text-[#111111] mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00a85a]" /> Interactive Graphic Studio
              </h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                Instantly convert the current workspace entry or any published report into a high-impact, downloadable social news card overlay.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedArticleForGraphic(null); // Force using active workspace fields
                  setIsGraphicGeneratorOpen(true);
                }}
                className="w-full bg-[#111111] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#00a85a] transition duration-200 cursor-pointer text-center block"
              >
                Launch Graphic Studio
              </button>
            </div>

            <SocialCopyGenerator formData={formData} />

            {/* Published Articles List */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-white px-6 py-4 border-b border-gray-200">
                 <h3 className="font-black text-sm uppercase tracking-widest text-[#111111]">Manage Content</h3>
                 <p className="text-xs text-gray-500 mt-1 font-medium">{articles.length} Published Articles</p>
               </div>
               <div className="bg-gray-50 max-h-80 overflow-y-auto w-full divide-y divide-gray-200">
                {articles.map(a => (
                  <div key={a.id} className="group p-4 hover:bg-white transition relative">
                     <div className="pr-16">
                       <span className="inline-block px-2 text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 rounded-full mb-2">{a.category}</span>
                       <h4 className="font-bold text-sm text-[#111111] leading-snug line-clamp-2" title={a.title}>{a.title}</h4>
                     </div>
                     <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         type="button"
                         title="Generate Graphic"
                         className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition shadow-sm cursor-pointer border border-emerald-100"
                         onClick={() => {
                           setSelectedArticleForGraphic(a);
                           setIsGraphicGeneratorOpen(true);
                         }}
                       >
                         <Sparkles className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm" title="Edit" onClick={() => handleEdit(a)}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                       </button>
                       <button className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm" title="Delete" onClick={async () => { if(window.confirm('Delete article?')) { await deleteArticle(a.id); setArticles(await getArticles()); } }}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                       </button>
                     </div>
                  </div>
                ))}
                {articles.length === 0 && <div className="p-8 text-sm text-gray-500 font-sans font-medium text-center bg-white">No content yet.</div>}
              </div>
            </div>

          </div>
        </aside>
      </div>

      {/* Social Media Graphic Studio Modal Overlay */}
      <SocialGraphicGenerator
        isOpen={isGraphicGeneratorOpen}
        onClose={() => {
          setIsGraphicGeneratorOpen(false);
          setSelectedArticleForGraphic(null);
        }}
        activeArticle={selectedArticleForGraphic || {
          title: formData.title,
          excerpt: formData.excerpt,
          contentHtml: formData.contentHtml,
          coverImage: formData.coverImage,
          imageSource: formData.imageSource,
          category: formData.category
        }}
        publishedArticles={articles}
      />

      {/* Link Preview Tooltip */}
      {previewLink && (
        <div 
          className="link-preview-card absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-4 w-72 flex flex-col gap-3 transition-opacity animate-in fade-in"
          style={{ top: previewLink.top, left: previewLink.left }}
        >
          {isLoadingPreview ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-[#00a85a] rounded-full animate-pulse"></span> Loading preview...
            </div>
          ) : (
            <>
              {previewLink.image && (
                <div className="w-full h-32 bg-gray-100 rounded overflow-hidden">
                  <img src={previewLink.image} alt={previewLink.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col">
                <h4 className="text-sm font-black text-[#111111] line-clamp-2 leading-tight">{previewLink.title}</h4>
                {previewLink.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{previewLink.description}</p>
                )}
                <a href={previewLink.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-[#00a85a] hover:text-[#00c86b] mt-3 truncate block">
                  {previewLink.url}
                </a>
              </div>
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setPreviewLink(null)} 
                  className="flex-1 text-[10px] py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold uppercase tracking-widest rounded transition"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-black text-lg uppercase tracking-tight text-[#111111] mb-4">
              Insert Advertisement
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Ad Content
                </label>
                <textarea
                  value={adText}
                  onChange={(e) => setAdText(e.target.value)}
                  className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#00a85a] focus:ring-1 focus:ring-[#00a85a]"
                  placeholder="Enter the ad copy..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Link URL (Optional)
                </label>
                <input
                  type="url"
                  value={adUrl}
                  onChange={(e) => setAdUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#00a85a] focus:ring-1 focus:ring-[#00a85a]"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const preset1 = "Are you in agribusiness in Nigeria? Whether you are a farmer, agripreneur, or researcher, Afrimash is Nigeria's leading online marketplace for agricultural inputs, seeds, equipment, feeds, and more delivered to your farm. Apply for this scholarship and build something bigger when you return.";
                    setAdText(preset1);
                    setAdUrl("https://afrimash.com");
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 py-1 px-2 rounded"
                >
                  Preset: Afrimash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset2 = "Planning to build your brand online while you study abroad? Register your Nigerian domain name and get your website live before you travel. DomainKing.ng is Nigeria's most affordable and reliable domain registrar. .com.ng domains start from under N5,000. Set it up now so your online presence is ready when you land.";
                    setAdText(preset2);
                    setAdUrl("https://domainking.ng");
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 hover:bg-purple-100 py-1 px-2 rounded"
                >
                  Preset: DomainKing
                </button>
              </div>
              
              {adText && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Live Ad Preview
                  </label>
                  {adUrl ? (
                    <a href={adUrl} target="_blank" rel="noopener noreferrer" className="block p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-center transition-colors">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Advertisement</div>
                      <div className="text-xs text-gray-700 leading-relaxed font-medium">
                        {adText.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>
                      <div className="mt-3">
                        <span className="inline-block bg-[#00a85a] text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                          Learn More
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Advertisement</div>
                      <div className="text-xs text-gray-700 leading-relaxed font-medium">
                        {adText.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdModal(false);
                    setAdText("");
                    setAdUrl("");
                  }}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (adText) {
                      let contentHtml = adText.replace(/\n/g, "<br>");
                      let adHtml = "";
                      
                      if (adUrl) {
                        contentHtml += `<div class="mt-4"><span class="inline-block bg-[#00a85a] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">Learn More</span></div>`;
                        const innerHtml = `<div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Advertisement</div><div class="text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto font-medium">${contentHtml}</div>`;
                        adHtml = `<a href="${adUrl}" target="_blank" rel="noopener noreferrer" class="block my-8 p-6 bg-gray-50 hover:bg-gray-100 border-y-2 border-gray-200 rounded text-center clear-both transition-colors cursor-pointer text-inherit no-underline" contenteditable="false">${innerHtml}</a><p><br></p>`;
                      } else {
                        const innerHtml = `<div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Advertisement</div><div class="text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto font-medium">${contentHtml}</div>`;
                        adHtml = `<div class="my-8 p-6 bg-gray-50 border-y-2 border-gray-200 rounded text-center clear-both" contenteditable="false">${innerHtml}</div><p><br></p>`;
                      }
                      
                      // Focus contentEditable before inserting
                      const editorBody = document.querySelector('.rsw-ce') as HTMLElement;
                      if (editorBody) {
                        editorBody.focus();
                        if (savedSelection) {
                          const selection = window.getSelection();
                          if (selection) {
                            selection.removeAllRanges();
                            selection.addRange(savedSelection);
                          }
                        }
                        document.execCommand('insertHTML', false, adHtml);
                      }
                    }
                    setShowAdModal(false);
                    setAdText("");
                    setAdUrl("");
                  }}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-widest bg-[#00a85a] hover:bg-[#00c86b] text-white rounded-lg transition"
                >
                  Insert Ad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
