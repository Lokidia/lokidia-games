"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/profil");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-amber-950">Connexion</h1>
          <p className="text-gray-500 text-sm mt-1">Retrouvez votre ludothèque</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors mt-2"
            >
              {loading ? "Connexion…" : "Se connecter →"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-amber-700 font-semibold hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-amber-700/60 hover:text-amber-700 text-sm transition-colors">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
