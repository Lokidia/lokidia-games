"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      console.log("[ScrollToTop] scrollY:", y, "visible:", y > 300);
      setVisible(y > 300);
    };
    // Check once on mount in case the page is already scrolled
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  console.log("[ScrollToTop] render, visible:", visible);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut"
      className={`fixed bottom-24 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xl font-bold shadow-xl transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      ↑
    </button>
  );
}
