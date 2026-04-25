"use client";

import { useState } from "react";

interface Props { pseudo: string }

export default function ShareWishlistButton({ pseudo }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/wishlist/${encodeURIComponent(pseudo)}`;
    if (navigator.share) {
      await navigator.share({ title: `Wishlist de ${pseudo}`, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={share}
      className="text-sm border border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold px-4 py-2 rounded-xl transition-colors"
    >
      {copied ? "✅ Lien copié !" : "🔗 Partager ma wishlist"}
    </button>
  );
}
