import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/utils/supabase/service";

export async function generateMetadata({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo } = await params;
  return { title: `Wishlist de ${pseudo} – Lokidia Games`, description: `Les jeux que ${pseudo} souhaite recevoir.` };
}

export default async function WishlistPage({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo } = await params;
  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("id, pseudo")
    .eq("pseudo", pseudo)
    .single();

  if (!profile) notFound();

  type WishItem = {
    jeux: {
      slug: string;
      nom: string;
      image_url: string | null;
      note: number;
      jeux_prix: { prix: number; url: string; boutique: string }[];
    } | null;
  };

  const { data: ludo } = await svc
    .from("ludotheque")
    .select("jeux(slug, nom, image_url, note, jeux_prix(prix, url, boutique))")
    .eq("user_id", profile.id)
    .eq("statut", "souhaite")
    .order("created_at", { ascending: false });

  const items = (ludo ?? []) as unknown as WishItem[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex w-16 h-16 rounded-full bg-amber-700 items-center justify-center text-2xl font-black text-white mb-3">
          {pseudo[0]?.toUpperCase()}
        </div>
        <h1 className="text-2xl font-black text-amber-950">
          Wishlist de {pseudo}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {items.length} jeu{items.length !== 1 ? "x" : ""} sur la liste de souhaits
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-12 text-center">
          <p className="text-5xl mb-3">🎁</p>
          <p className="text-gray-500 text-sm">La wishlist est vide pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, i) => {
            if (!item.jeux) return null;
            const jeu = item.jeux;
            const bestPrice = jeu.jeux_prix?.reduce(
              (min, p) => (p.prix && p.prix < min.prix ? p : min),
              { prix: Infinity, url: "", boutique: "" }
            );
            return (
              <div key={i} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex gap-4 p-4 hover:border-amber-300 transition-colors">
                {jeu.image_url && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <Image src={jeu.image_url} alt={jeu.nom} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/jeu/${jeu.slug}`} className="font-bold text-gray-900 hover:text-amber-800 leading-tight block truncate">
                    {jeu.nom}
                  </Link>
                  {jeu.note > 0 && (
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">★ {jeu.note.toFixed(1)}</p>
                  )}
                  {bestPrice && bestPrice.prix !== Infinity && (
                    <p className="text-sm text-gray-500 mt-1">
                      À partir de{" "}
                      <a href={bestPrice.url} target="_blank" rel="noopener noreferrer" className="text-amber-700 font-semibold hover:underline">
                        {bestPrice.prix.toFixed(2)} € sur {bestPrice.boutique}
                      </a>
                    </p>
                  )}
                </div>
                {bestPrice && bestPrice.prix !== Infinity && (
                  <a
                    href={bestPrice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-center bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-colors"
                  >
                    Offrir 🎁
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-10">
        Lokidia Games · <Link href="/" className="hover:underline">Accueil</Link>
      </p>
    </div>
  );
}
