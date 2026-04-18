"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis ton assistant pour trouver le jeu de société parfait. 🎲\n\nDis-moi : combien de joueurs êtes-vous et quel type de jeu vous attire ? (stratégie, coopératif, familial, party...)",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function envoyer() {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie !" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-amber-900 mb-6">💬 Recommandation par IA</h1>

      <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[60vh]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-amber-700 text-white rounded-br-sm"
                    : "bg-amber-50 text-gray-800 rounded-bl-sm border border-amber-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-amber-50 border border-amber-100 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-500 animate-pulse">
                En train de réfléchir...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-amber-100 p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyer()}
            placeholder="Écris ta réponse..."
            className="flex-1 border border-amber-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={envoyer}
            disabled={loading || !input.trim()}
            className="bg-amber-700 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
