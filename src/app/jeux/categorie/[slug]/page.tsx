import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getJeuxByCategorie } from "@/lib/jeux-repository";
import { createServiceClient } from "@/utils/supabase/service";
import CarteJeu from "@/components/CarteJeu";

type PageParams = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // Must use service client here — no request context at build time (cookies() would throw)
  try {
    const sb = createServiceClient();
    const { data } = await sb.from("categories").select("slug");
    return (data ?? []).map((c: { slug: string }) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const { categorie } = await getJeuxByCategorie(slug);

  if (!categorie) {
    return { title: "Catégorie introuvable — Lokidia Games" };
  }

  const title = `Jeux ${categorie.nom} — Lokidia Games`;
  const description = `Découvrez tous les jeux de société de la catégorie ${categorie.nom}. Fiches détaillées, règles et comparateur de prix sur Lokidia Games.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function CategoriePage({ params }: PageParams) {
  const { slug } = await params;
  const { jeux, categorie } = await getJeuxByCategorie(slug);

  if (!categorie) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-amber-700 transition-colors">Accueil</Link>
        <span className="text-gray-300">›</span>
        <Link href="/jeux" className="hover:text-amber-700 transition-colors">Jeux</Link>
        <span className="text-gray-300">›</span>
        <span className="text-amber-800 font-semibold">{categorie.nom}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-amber-950 mb-2">
          Jeux {categorie.nom}
        </h1>
        <p className="text-gray-500">
          {jeux.length === 0
            ? "Aucun jeu dans cette catégorie pour l'instant."
            : `${jeux.length} jeu${jeux.length > 1 ? "x" : ""} dans cette catégorie`}
        </p>
      </div>

      {/* Games grid */}
      {jeux.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {jeux.map((jeu) => (
            <CarteJeu key={jeu.slug} jeu={jeu} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
          <span className="text-5xl block mb-4">🎲</span>
          <p className="text-lg font-semibold text-amber-900 mb-1">
            Aucun jeu dans cette catégorie
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Les jeux de cette catégorie n&apos;ont pas encore été associés.
          </p>
          <Link
            href="/jeux"
            className="bg-amber-700 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-800 transition-colors inline-block"
          >
            Voir tous les jeux
          </Link>
        </div>
      )}

      {/* Back link */}
      <div className="mt-10">
        <Link
          href="/jeux"
          className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1.5 w-fit"
        >
          ← Tous les jeux
        </Link>
      </div>
    </div>
  );
}
