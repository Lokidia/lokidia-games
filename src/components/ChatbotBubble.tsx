"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL: Message = {
  role: "assistant",
  content: "Bonjour ! 👋 Dites-moi combien de joueurs vous êtes, l'âge des participants et si vous préférez quelque chose de simple ou stratégique — je vous trouve le jeu idéal !",
};

export default function ChatbotBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json() as { reply?: string };
      setMessages((p) => [...p, { role: "assistant", content: data.reply ?? "Désolé, une erreur est survenue." }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Erreur de connexion. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Panneau latéral */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-amber-100 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-700 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎲</span>
              <div>
                <p className="text-sm font-bold leading-none">Conseiller de jeux</p>
                <p className="text-xs text-amber-200 mt-0.5">Trouvez votre prochain jeu préféré</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-amber-200 hover:text-white text-2xl leading-none transition-colors"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-amber-600 text-white rounded-br-sm"
                      : "bg-amber-50 text-gray-800 border border-amber-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-amber-100 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
              placeholder="Votre question…"
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/50"
              disabled={loading}
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl px-3 py-2 transition-colors"
              aria-label="Envoyer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir le conseiller de jeux"
        className={`fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all ${
          open
            ? "bg-amber-800 hover:bg-amber-700 rotate-0 scale-90"
            : "bg-amber-600 hover:bg-amber-500 hover:scale-110"
        }`}
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
}
