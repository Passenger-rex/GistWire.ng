import { useEffect, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import Logo from '../components/Logo';

export default function DownloadLogo() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    document.fonts.ready.then(() => {
      setTimeout(() => {
        if (!isMounted) return;
        if (logoRef.current) {
          toPng(logoRef.current, { backgroundColor: '#ffffff', pixelRatio: 4 })
            .then((url) => {
              if (isMounted) setDataUrl(url);
            })
            .catch((err) => console.error(err));
        }
      }, 500); // Give it a short moment so fonts properly apply globally
    });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center flex flex-col items-center justify-center overflow-x-hidden">
      <h1 className="text-3xl font-sans font-black uppercase text-[#111111] mb-4 tracking-tighter">Download Logo</h1>
      <p className="text-gray-500 mb-8 max-w-md">Get the official high-resolution PNG asset for GistWire.</p>
      
      {/* Off-screen original component to render the exact pixel-perfect image */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div ref={logoRef} className="p-8 bg-white inline-flex items-center justify-center min-w-[300px]">
          <Logo className="scale-150 transform-gpu origin-center" />
        </div>
      </div>

      <div className="mb-12 p-8 bg-gray-50 border border-gray-200 shadow-sm relative group overflow-hidden flex justify-center w-full max-w-[500px]">
        {dataUrl ? (
          <>
            <img src={dataUrl} alt="GistWire Logo" className="w-full h-auto object-contain max-w-[400px]" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
               <p className="text-white font-bold tracking-widest uppercase text-xs">Right-click and select "Save image as..."</p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-16 animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded-md"></div>
          </div>
        )}
      </div>

      {dataUrl ? (
        <a 
          href={dataUrl}
          download="gistwire-logo.png"
          className="px-8 py-4 bg-[#00a85a] text-white font-black uppercase tracking-widest text-xs hover:bg-[#111111] transition shadow-lg shrink-0"
        >
          Download PNG
        </a>
      ) : (
        <button 
          disabled
          className="px-8 py-4 bg-gray-200 text-gray-400 font-black uppercase tracking-widest text-xs transition shadow-sm shrink-0 cursor-not-allowed"
        >
          Generating...
        </button>
      )}
    </div>
  );
}
