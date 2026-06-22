import React from 'react';

export default function Logo({ className = "", lightText = false }: { className?: string, lightText?: boolean }) {
  // If light text on dark background is requested, we apply a brightness filter
  return (
    <img 
      src="/gistwire-logo-removebg-preview.png" 
      alt="GistWire Logo" 
      className={`h-14 md:h-16 w-auto object-contain ${lightText ? 'brightness-0 invert' : ''} ${className}`} 
    />
  );
}
