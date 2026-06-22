import React, { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    // If access key is missing, warn but allow local demonstration success simulation
    if (!accessKey) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: formData.name,
          email: formData.email,
          subject: formData.subject || "New GistWire Contact Submission",
          message: formData.message,
          from_name: "GistWire News Contact"
        })
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setErrorMsg(data.message || "Failed to submit form. Please check your Access Key.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-sans font-black uppercase tracking-tighter text-[#111111] mb-4">Contact Us</h1>
        <div className="w-24 h-1 bg-[#00a85a] mx-auto mb-6"></div>
        <p className="text-gray-600 font-medium max-w-2xl mx-auto">
          Have a breaking story, feedback, or want to partner with GistWire? 
          Get in touch with our team using the form below.
        </p>
      </div>

      <div className="w-full">
        {!accessKey && (
          <div className="bg-amber-50 border-l-[4px] border-amber-500 p-5 mb-8 rounded-r-md">
            <h4 className="font-bold text-amber-800 uppercase tracking-widest text-xs mb-1">💡 Web3Forms Integration</h4>
            <p className="text-amber-700 text-xs font-semibold leading-relaxed">
              Your contact form is integrated with <strong className="text-amber-900">Web3Forms</strong>. 
              To receive actual user submissions directly in your mailbox, obtain a free access key from{" "}
              <a href="https://web3forms.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-950 font-bold transition">
                web3forms.com
              </a>, and add it to your environment as <code className="bg-amber-100 font-mono px-1 rounded text-amber-900 font-bold">VITE_WEB3FORMS_ACCESS_KEY</code>.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border-l-[4px] border-red-500 p-5 mb-8 rounded-r-md">
            <h4 className="font-bold text-red-800 uppercase tracking-widest text-xs mb-1">Submission Error</h4>
            <p className="text-red-700 text-xs font-semibold">{errorMsg}</p>
          </div>
        )}

        {submitted ? (
           <div className="bg-[#00a85a]/10 border-l-[4px] border-[#00a85a] p-6 mb-8">
              <h3 className="font-bold text-[#00a85a] uppercase tracking-widest text-sm mb-2">Message Sent Successfully!</h3>
              <p className="text-gray-700 text-sm font-medium">Thank you for reaching out to GistWire. Our team will review your submission and get back to you shortly if necessary.</p>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-xs uppercase tracking-widest text-[#111111] mb-2">Your Name *</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  disabled={isSubmitting}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 outline-none focus:border-[#00a85a] transition bg-gray-50 focus:bg-white text-sm font-medium disabled:opacity-55"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block font-bold text-xs uppercase tracking-widest text-[#111111] mb-2">Email Address *</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  disabled={isSubmitting}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 outline-none focus:border-[#00a85a] transition bg-gray-50 focus:bg-white text-sm font-medium disabled:opacity-55"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block font-bold text-xs uppercase tracking-widest text-[#111111] mb-2">Subject</label>
              <input 
                type="text" 
                name="subject"
                disabled={isSubmitting}
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 outline-none focus:border-[#00a85a] transition bg-gray-50 focus:bg-white text-sm font-medium disabled:opacity-55"
                placeholder="News Tip / Advertising / Feedback"
              />
            </div>

            <div>
              <label className="block font-bold text-xs uppercase tracking-widest text-[#111111] mb-2">Message *</label>
              <textarea 
                name="message"
                required
                disabled={isSubmitting}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full border-2 border-gray-200 p-4 outline-none focus:border-[#00a85a] transition bg-gray-50 focus:bg-white text-sm font-medium h-48 resize-y disabled:opacity-55"
                placeholder="Tell us what's on your mind..."
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#111111] text-white px-10 py-4 text-xs font-black uppercase tracking-widest hover:bg-[#00a85a] transition w-full md:w-auto disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
