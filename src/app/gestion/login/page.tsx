import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administration — Connexion" };

type Props = { searchParams: Promise<{ error?: string; from?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error, from } = await searchParams;

  return (
    <div className="min-h-screen bg-amber-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🎲</p>
          <h1 className="text-2xl font-black text-white">Lokidia Games</h1>
          <p className="text-amber-400/70 text-sm mt-1">Espace administration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-bold text-amber-950 mb-6">Connexion</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              Email ou mot de passe incorrect.
            </div>
          )}

          <form action="/api/gestion/login" method="POST" className="space-y-4">
            <input type="hidden" name="from" value={from ?? "/gestion"} />

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                className="input mt-1"
                placeholder="admin@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input mt-1"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-2"
            >
              Se connecter →
            </button>
          </form>
        </div>

        {/* Back to site */}
        <p className="text-center mt-6">
          <a href="/" className="text-amber-400/60 hover:text-amber-400 text-sm transition-colors">
            ← Retour au site
          </a>
        </p>
      </div>
    </div>
  );
}
