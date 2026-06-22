import Logo from "../components/Logo";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-sans font-black uppercase tracking-tighter text-[#111111] mb-6">About GistWire</h1>
        <div className="w-24 h-1 bg-[#00a85a] mx-auto mb-8"></div>
        <p className="text-gray-600 font-medium max-w-3xl mx-auto text-lg leading-relaxed">
          At <span className="font-bold text-[#111111]">GistWire</span>, we are driven by a singular mission: to be the most trusted, unapologetically fast, and comprehensive source of news and entertainment. Whether it's a global market shift or the latest celebrity buzz, if it matters, you'll hear it here first.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
        <div className="bg-gray-100 h-80 border-l-[8px] border-[#00a85a] flex flex-col items-center justify-center p-8 text-center object-cover overflow-hidden relative">
           <img src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Newsroom" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply" />
           <div className="relative z-10 text-white drop-shadow-lg">
             <Logo className="invert brightness-0" />
           </div>
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#111111] mb-6">Our Story</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Founded with a passion for unfiltered storytelling, GistWire began as a small digital publication dedicated to cutting through the noise. Today, we stand as a premier digital media house, providing rigorous coverage across politics, business, entertainment, tech, and beyond.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We believe in power of information. Our team of dedicated editors and journalists work around the clock to bring you narratives that shape our world, honoring the truth and prioritizing our readers' need to stay informed.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mt-16 pt-16 border-t border-gray-200">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#111111] mb-8">Connect With Us</h2>
          <div className="flex flex-col gap-4">
             <a href="https://facebook.com/gistwiree" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center text-white group-hover:bg-[#1877F2] transition">
                 <Facebook size={20} />
               </div>
               <span className="font-bold text-gray-700 group-hover:text-[#1877F2] transition uppercase tracking-widest text-sm">GistWire News</span>
             </a>
             <a href="https://x.com/gist_wire" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center text-white group-hover:bg-[#1DA1F2] transition">
                 <Twitter size={20} />
               </div>
               <span className="font-bold text-gray-700 group-hover:text-[#1DA1F2] transition uppercase tracking-widest text-sm">@gist_wire</span>
             </a>
             <a href="https://instagram.com/gistwireng" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center text-white group-hover:bg-[#E1306C] transition">
                 <Instagram size={20} />
               </div>
               <span className="font-bold text-gray-700 group-hover:text-[#E1306C] transition uppercase tracking-widest text-sm">@gistwireng</span>
             </a>
             <a href="https://linkedin.com/company/gistwire" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center text-white group-hover:bg-[#0077b5] transition">
                 <Linkedin size={20} />
               </div>
               <span className="font-bold text-gray-700 group-hover:text-[#0077b5] transition uppercase tracking-widest text-sm">GistWire</span>
             </a>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#111111] mb-8">Quick Contacts</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="text-[#00a85a] mt-1">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-widest text-sm text-[#111111]">Email Address</h3>
                <a href="mailto:gistwire5@gmail.com" className="text-gray-500 font-medium text-sm mt-1 block hover:text-[#00a85a] transition">gistwire5@gmail.com</a>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="text-[#00a85a] mt-1">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-widest text-sm text-[#111111]">Phone Line</h3>
                <a href="tel:+2349046676138" className="text-gray-500 font-medium text-sm mt-1 block hover:text-[#00a85a] transition">+234 (0) 9046676138</a>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
