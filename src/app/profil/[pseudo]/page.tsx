import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

type LudoRow = { statut: string; jeux: { id: string; slug: string; nom: string } | null };

const STATUT_LABELS: Record<string, string> = {
  possede: "📚 J'ai ce jeu",
  souhaite: "❤️ Je le veux",
  joue: "🎮 J'y joue",
};

export async function generateMetadata({ params }: { params: Promise<{ pseudo: string }> }): Promise<Metadata> {
  const { pseudo } = await params;
  return { title: `Ludothèque de ${decodeURIComponent(pseudo)} — Lokidia Games` };
}

export default async function PublicProfilPage({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo: rawPseudo } = await params;
  const pseudo = decodeURIComponent(rawPseudo);

  const svc = createServiceClient();

  // Fetch target profile
  const { data: targetProfile } = await svc
    .from("profiles")
    .select("id, pseudo, created_at")
    .eq("pseudo", pseudo)
    .single();

  if (!targetProfile) notFound();
  const target = targetProfile as { id: string; pseudo: string; created_at: string };

  // Fetch target's ludothèque
  const { data: targetLudo } = await svc
    .from("ludotheque")
    .select("statut, jeux(id, slug, nom)")
    .eq("user_id", target.id)
    .order("created_at", { ascending: false });

  const targetItems = (targetLudo ?? []) as unknown as LudoRow[];

  // Get current viewer
  const sbServer = await createClient();
  const { data: { user: viewer } } = await sbServer.auth.getUser();

  let isFriend = false;
  let commonGames: LudoRow["jeux"][] = [];
  let onlyThey: LudoRow["jeux"][] = [];
  let onlyMe: LudoRow["jeux"][] = [];

  if (viewer && viewer.id !== target.id) {
    // Check friendship
    const { data: friendRow } = await svc
      .from("amis")
      .select("statut")
      .or(`and(user_id.eq.${viewer.id},ami_id.eq.${target.id}),and(user_id.eq.${target.id},ami_id.eq.${viewer.id})`)
      .single();

    isFriend = (friendRow as { statut: string } | null)?.statut === "accepte";

    if (isFriend) {
      // Fetch my ludothèque for comparison
      const { data: myLudo } = await svc
        .from("ludotheque")
        .select("statut, jeux(id, slug, nom)")
        .eq("user_id", viewer.id);

      const myItems = (myLudo ?? []) as unknown as LudoRow[];
      const myJeuIds = new Set(myItems.map(r => r.jeux?.id).filter(Boolean) as string[]);
      const theirJeuIds = new Set(targetItems.map(r => r.jeux?.id).filter(Boolean) as string[]);

      commonGames = targetItems
        .filter(r => r.jeux && myJeuIds.has(r.jeux.id))
        .map(r => r.jeux!);

      onlyThey = targetItems
        .filter(r => r.jeux && !myJeuIds.has(r.jeux.id))
        .map(r => r.jeux!);

      onlyMe = myItems
        .filter(r => r.jeux && !theirJeuIds.has(r.jeux.id))
        .map(r => r.jeux!);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 mb-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-amber-700 flex items-center justify-center text-xl font-black text-white shrink-0">
          {target.pseudo[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-amber-950">{target.pseudo}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Membre depuis {new Date(target.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </div>
        {viewer && !isFriend && viewer.id !== target.id && (
          <form action="/api/amis" method="POST">
            <input type="hidden" name="pseudo" value={target.pseudo} />
            <button type="submit" className="text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-lg transition-colors">
              + Ajouter
            </button>
          </form>
        )}
      </div>

      {/* Jeux en commun (friends only) */}
      {isFriend && (
        <section id="commun" className="mb-8">
          <h2 className="text-lg font-bold text-amber-950 mb-4">
            🎯 Jeux en commun ({commonGames.length})
          </h2>
          {commonGames.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun jeu en commun pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {commonGames.map(g => g && (
                <Link key={g.id} href={`/jeu/${g.slug}`}
                  className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3 text-sm font-semibold text-gray-900 hover:border-emerald-300 transition-colors">
                  ✅ {g.nom}
                </Link>
              ))}
            </div>
          )}

          {onlyThey.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Jeux que {target.pseudo} a mais pas toi
              </p>
              <div className="flex flex-col gap-1.5">
                {onlyThey.map(g => g && (
                  <Link key={g.id} href={`/jeu/${g.slug}`}
                    className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600 hover:border-amber-200 transition-colors">
                    {g.nom}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {onlyMe.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Jeux que tu as mais pas {target.pseudo}
              </p>
              <div className="flex flex-col gap-1.5">
                {onlyMe.map(g => g && (
                  <Link key={g.id} href={`/jeu/${g.slug}`}
                    className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600 hover:border-amber-200 transition-colors">
                    {g.nom}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Public ludothèque */}
      <section>
        <h2 className="text-lg font-bold text-amber-950 mb-4">
          Ludothèque de {target.pseudo} ({targetItems.length} jeux)
        </h2>
        {targetItems.length === 0 ? (
          <p className="text-gray-400 text-sm">Ludothèque vide.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {targetItems.map((item, i) => item.jeux && (
              <Link key={i} href={`/jeu/${item.jeux.slug}`}
                className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-center gap-3 hover:border-amber-300 transition-colors">
                <span className="text-sm text-gray-500 w-28 shrink-0">{STATUT_LABELS[item.statut] ?? item.statut}</span>
                <span className="font-semibold text-gray-900 text-sm">{item.jeux.nom}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
