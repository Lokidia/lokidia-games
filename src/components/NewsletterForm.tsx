"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [statut, setStatut] = useState<"idle" | "success" | "error">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatut("error");
      return;
    }
    // TODO: brancher à une vraie API (Mailchimp, Brevo...)
    setStatut("success");
    setEmail("");
  }

  if (statut === "success") {
    return (
      <div className="flex items-center justify-center gap-3 bg-white/10 rounded-2xl px-6 py-4 border border-white/20">
        <span className="text-2xl">🎉</span>
        <p className="text-white font-semibold">Inscription confirmée ! À très bientôt.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto">
      <div className="relative flex-1">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatut("idle"); }}
          placeholder="votre@email.fr"
          className={`w-full px-4 py-3.5 rounded-xl bg-white/10 backdrop-blur border text-white placeholder-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${
            statut === "error" ? "border-red-400" : "border-white/20"
          }`}
        />
        {statut === "error" && (
          <p className="absolute -bottom-5 left-0 text-xs text-red-300">Email invalide</p>
        )}
      </div>
      <button
        type="submit"
        className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3.5 rounded-xl transition-colors whitespace-nowrap"
      >
        Je m&apos;inscris
      </button>
    </form>
  );
}
