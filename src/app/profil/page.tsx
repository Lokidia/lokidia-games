import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export default async function ProfilPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) redirect("/connexion");

  const sbService = createServiceClient();

  const [{ data: profile }, { data: ludotheque }] = await Promise.all([
    sbService.from("profiles").select("pseudo, avatar_url, created_at").eq("id", user.id).single(),
    sbService
      .from("ludotheque")
      .select("statut, jeux(slug, nom, image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const pseudo = (profile as { pseudo: string | null } | null)?.pseudo ?? user.email?.split("@")[0] ?? "Joueur";
  const createdAt = (profile as { created_at: string } | null)?.created_at;

  type LudoItem = { statut: string; jeux: { slug: string; nom: string; image_url: string | null } | null };
  const items = (ludotheque ?? []) as unknown as LudoItem[];

  const STATUT_LABELS: Record<string, string> = {
    possede: "📚 J'ai ce jeu",
    souhaite: "❤️ Je le veux",
    joue: "🎮 J'y joue",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header profil */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-2xl font-black text-white shrink-0">
          {pseudo[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-amber-950">{pseudo}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          {createdAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Membre depuis {new Date(createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <SignOutButton />
      </div>

      {/* Ludothèque */}
      <div>
        <h2 className="text-lg font-bold text-amber-950 mb-4">Ma ludothèque ({items.length} jeux)</h2>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-10 text-center">
            <p className="text-gray-500 text-sm">Votre ludothèque est vide.</p>
            <Link href="/jeux" className="inline-block mt-3 text-amber-700 font-semibold hover:underline text-sm">
              Parcourir les jeux →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              item.jeux && (
                <Link
                  key={i}
                  href={`/jeu/${item.jeux.slug}`}
                  className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-center gap-3 hover:border-amber-300 transition-colors"
                >
                  <span className="text-sm text-gray-500 w-28 shrink-0">{STATUT_LABELS[item.statut]}</span>
                  <span className="font-semibold text-gray-900 text-sm">{item.jeux.nom}</span>
                </Link>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        Déconnexion
      </button>
    </form>
  );
}
