import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

type LudoRow = {
  statut: string;
  jeux: {
    id: string;
    slug: string;
    nom: string;
    image_url: string | null;
    note: number;
    jeux_prix: { prix: string; marchand: string }[];
    jeux_categories: { categories: { nom: string } | null }[];
  } | null;
};

export async function generateMetadata({ params }: { params: Promise<{ pseudo: string }> }): Promise<Metadata> {
  const { pseudo } = await params;
  return { title: `Ludothèque de ${decodeURIComponent(pseudo)} — Lokidia Games` };
}

export default async function PublicProfilPage({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo: rawPseudo } = await params;
  const pseudo = decodeURIComponent(rawPseudo);

  const svc = createServiceClient();

  const { data: targetProfile } = await svc
    .from("profiles")
    .select("id, pseudo, created_at")
    .eq("pseudo", pseudo)
    .single();

  if (!targetProfile) notFound();
  const target = targetProfile as { id: string; pseudo: string; created_at: string };

  const { data: targetLudo } = await svc
    .from("ludotheque")
    .select("statut, jeux(id, slug, nom, image_url, note, jeux_prix(prix, marchand), jeux_categories(categories(nom)))")
    .eq("user_id", target.id)
    .order("created_at", { ascending: false });

  const targetItems = (targetLudo ?? []) as unknown as LudoRow[];
  const possede  = targetItems.filter(i => i.statut === "possede");
  const souhaite = targetItems.filter(i => i.statut === "souhaite");


  // ── Viewer context ──────────────────────────────────────────────────────────
  const sbServer = await createClient();
  const { data: { user: viewer } } = await sbServer.auth.getUser();

  let isFriend = false;
  let commonGames: NonNullable<LudoRow["jeux"]>[] = [];
  let onlyThey:    NonNullable<LudoRow["jeux"]>[] = [];
  let onlyMe:      NonNullable<LudoRow["jeux"]>[] = [];

  if (viewer && viewer.id !== target.id) {
    const { data: friendRow } = await svc
      .from("amis")
      .select("statut")
      .or(`and(user_id.eq.${viewer.id},ami_id.eq.${target.id}),and(user_id.eq.${target.id},ami_id.eq.${viewer.id})`)
      .single();

    isFriend = (friendRow as { statut: string } | null)?.statut === "accepte";

    if (isFriend) {
      const { data: myLudo } = await svc
        .from("ludotheque")
        .select("statut, jeux(id, slug, nom)")
        .eq("user_id", viewer.id);

      type SimpleRow = { jeux: { id: string; slug: string; nom: string } | null };
      const myItems = (myLudo ?? []) as unknown as SimpleRow[];
      const myJeuIds    = new Set(myItems.map(r => r.jeux?.id).filter(Boolean) as string[]);
      const theirJeuIds = new Set(targetItems.map(r => r.jeux?.id).filter(Boolean) as string[]);

      commonGames = targetItems.filter(r => r.jeux && myJeuIds.has(r.jeux.id)).map(r => r.jeux!);
      onlyThey    = targetItems.filter(r => r.jeux && !myJeuIds.has(r.jeux.id)).map(r => r.jeux!);
      onlyMe      = myItems.filter(r => r.jeux && !theirJeuIds.has(r.jeux.id)).map(r => r.jeux) as NonNullable<LudoRow["jeux"]>[];
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center font-black text-white text-2xl shrink-0">
            {target.pseudo[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-amber-950">{target.pseudo}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Membre depuis{" "}
              {new Date(target.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {viewer && !isFriend && viewer.id !== target.id && (
              <form action="/api/amis" method="POST">
                <input type="hidden" name="pseudo" value={target.pseudo} />
                <button type="submit" className="text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-lg transition-colors">
                  + Ajouter
                </button>
              </form>
            )}
            <Link href="/jeux" className="hidden sm:inline-flex text-sm font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50 px-4 py-2 rounded-xl transition-colors">
              ← Catalogue
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-amber-800">{possede.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">📚 Possédés</p>
          </div>
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-rose-700">{souhaite.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">❤️ Souhaités</p>
          </div>
        </div>

        {/* Jeux en commun (amis seulement) */}
        {isFriend && commonGames.length > 0 && (
          <section className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
            <h2 className="text-base font-black text-emerald-900 mb-3">
              🎯 Jeux en commun ({commonGames.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {commonGames.map(g => (
                <Link key={g.id} href={`/jeu/${g.slug}`}
                  className="bg-white rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-gray-900 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors truncate">
                  ✅ {g.nom}
                </Link>
              ))}
            </div>
            {(onlyThey.length > 0 || onlyMe.length > 0) && (
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                {onlyThey.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                      Chez {target.pseudo} mais pas chez toi
                    </p>
                    <div className="flex flex-col gap-1">
                      {onlyThey.slice(0, 5).map(g => (
                        <Link key={g.id} href={`/jeu/${g.slug}`}
                          className="bg-white rounded-lg border border-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:border-amber-200 transition-colors truncate">
                          {g.nom}
                        </Link>
                      ))}
                      {onlyThey.length > 5 && <p className="text-xs text-gray-400 pl-1">+{onlyThey.length - 5} autres</p>}
                    </div>
                  </div>
                )}
                {onlyMe.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                      Chez toi mais pas chez {target.pseudo}
                    </p>
                    <div className="flex flex-col gap-1">
                      {onlyMe.slice(0, 5).map(g => (
                        <Link key={g.id} href={`/jeu/${g.slug}`}
                          className="bg-white rounded-lg border border-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:border-amber-200 transition-colors truncate">
                          {g.nom}
                        </Link>
                      ))}
                      {onlyMe.length > 5 && <p className="text-xs text-gray-400 pl-1">+{onlyMe.length - 5} autres</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Collection */}
        {possede.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-amber-950 mb-4">
              Collection de {target.pseudo}{" "}
              <span className="text-amber-600 font-bold text-base">({possede.length} jeu{possede.length > 1 ? "x" : ""})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {possede.map((item, i) => item.jeux && (
                <JeuCard key={i} jeu={item.jeux} statut="possede" />
              ))}
            </div>
          </section>
        )}

        {/* Wishlist */}
        {souhaite.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-amber-950 mb-4">
              Wishlist{" "}
              <span className="text-rose-600 font-bold text-base">({souhaite.length} jeu{souhaite.length > 1 ? "x" : ""})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {souhaite.map((item, i) => item.jeux && (
                <JeuCard key={i} jeu={item.jeux} statut="souhaite" />
              ))}
            </div>
          </section>
        )}

        {targetItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-16 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-500 text-sm">{target.pseudo} n&apos;a pas encore de jeux dans sa ludothèque.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── JeuCard ──────────────────────────────────────────────────────────────────

type JeuCardData = {
  slug: string; nom: string; image_url: string | null; note: number;
  jeux_categories?: { categories: { nom: string } | null }[];
};

function JeuCard({ jeu, statut }: { jeu: JeuCardData; statut: string }) {
  const cats = (jeu.jeux_categories ?? []).map(jc => jc.categories?.nom).filter(Boolean) as string[];
  return (
    <Link
      href={`/jeu/${jeu.slug}`}
      className="group bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-300 transition-all overflow-hidden flex flex-col"
    >
      <div className="relative h-40 bg-amber-50 overflow-hidden">
        {jeu.image_url ? (
          <Image src={jeu.image_url} alt={jeu.nom} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎲</div>
        )}
        <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm ${
          statut === "possede" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        }`}>
          {statut === "possede" ? "📚 Possédé" : "❤️ Souhaité"}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 group-hover:text-amber-800 transition-colors">{jeu.nom}</p>
        {jeu.note > 0 && <p className="text-xs text-amber-600 font-semibold">★ {jeu.note.toFixed(1)}</p>}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {cats.slice(0, 2).map(cat => (
              <span key={cat} className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{cat}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
