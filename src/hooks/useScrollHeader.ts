import { useState, useEffect } from 'react';

export function useScrollHeader(threshold = 40) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    let timer: NodeJS.Timeout;
    
    // A debounced fallback is included to catch edge cases where rapid scrolling might skip a frame update
    const updateScroll = () => {
      setIsScrolled((prev) => {
        // Hysteresis logic to prevent bouncing/shaking
        if (!prev && window.scrollY > threshold + 30) return true;
        if (prev && window.scrollY <= threshold) return false;
        return prev;
      });
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
      
      // Debounced check to ensure final state
      clearTimeout(timer);
      timer = setTimeout(updateScroll, 50);
    };

    // Set initial state
    updateScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [threshold]);

  return isScrolled;
}
