// src/hooks/useTilt.js
import { useRef, useCallback } from 'react';

export function useTilt(maxDeg = 1.5) {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    if (window.innerWidth < 768) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform    = `perspective(800px) rotateX(${-dy * maxDeg}deg) rotateY(${dx * maxDeg}deg) translateZ(4px)`;
    el.style.willChange   = 'transform';
    el.style.transition   = 'transform 0.1s ease';
  }, [maxDeg]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    el.style.transition = 'transform 0.4s ease';
    el.style.willChange = 'auto';
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
