import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getJeuxByCategorie } from "@/lib/jeux-repository";
import { createServiceClient } from "@/utils/supabase/service";
import { getSeoPageByUrl } from "@/lib/seo/service";
import CarteJeu from "@/components/CarteJeu";
import type { SeoPage } from "@/lib/seo/types";

type PageParams = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const sb = createServiceClient();
    const { data } = await sb.from("categories").select("slug");
    return (data ?? []).map((c: { slug: string }) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

// Deduplicate parallel calls from generateMetadata + page component
const loadPageData = cache(async (slug: string) => {
  const [{ jeux, categorie }, seoRecord] = await Promise.all([
    getJeuxByCategorie(slug),
    getSeoPageByUrl(`/jeux/${slug}`),
  ]);
  return { jeux, categorie, seo: seoRecord?.payload_json ?? null };
});

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const { categorie, seo } = await loadPageData(slug);

  if (!categorie) return { title: "Catégorie introuvable — Lokidia Games" };

  const title       = seo?.title       ?? `Jeux ${categorie.nom} — Lokidia Games`;
  const description = seo?.meta        ?? `Découvrez tous les jeux de société de la catégorie ${categorie.nom}. Fiches détaillées, règles et avis sur Lokidia Games.`;
  const canonical   = `/jeux/categorie/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, locale: "fr_FR", type: "article" },
  };
}

export default async function CategoriePage({ params }: PageParams) {
  const { slug } = await params;
  const { jeux, categorie, seo } = await loadPageData(slug);

  if (!categorie) notFound();

  const h1 = seo?.h1 ?? `Jeux ${categorie.nom}`;

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

      {/* SEO header */}
      <header className="mb-8">
        {seo && (
          <p className="text-sm uppercase tracking-[0.2em] text-amber-700 font-semibold mb-3">
            Guide de recommandation
          </p>
        )}
        <h1 className="text-4xl font-black text-amber-950 mb-4">{h1}</h1>
        {seo?.intro && (
          <p className="text-lg text-stone-700 leading-8 max-w-4xl">{seo.intro}</p>
        )}
        {!seo?.intro && (
          <p className="text-gray-500">
            {jeux.length === 0
              ? "Aucun jeu dans cette catégorie pour l'instant."
              : `${jeux.length} jeu${jeux.length > 1 ? "x" : ""} dans cette catégorie`}
          </p>
        )}
      </header>

      {/* Games grid */}
      {jeux.length > 0 ? (
        <section className="mb-12">
          {seo?.intro && (
            <p className="text-sm text-gray-500 mb-4">
              {jeux.length} jeu{jeux.length > 1 ? "x" : ""} dans cette catégorie
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {jeux.map((jeu) => (
              <CarteJeu key={jeu.slug} jeu={jeu} />
            ))}
          </div>
        </section>
      ) : (
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center mb-12">
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

      {/* SEO sections */}
      {seo && seo.sections.length > 0 && (
        <div className="space-y-8 mb-10 max-w-4xl">
          {seo.sections.map((section) => (
            <section
              key={section.h2}
              className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-amber-900 mb-3">{section.h2}</h2>
              <p className="text-stone-700 leading-7">{section.text}</p>
            </section>
          ))}
        </div>
      )}

      {/* FAQ */}
      {seo && seo.faq.length > 0 && (
        <section className="mb-10 bg-white rounded-2xl border border-amber-100 p-6 shadow-sm max-w-4xl">
          <h2 className="text-2xl font-bold text-amber-900 mb-5">Questions fréquentes</h2>
          <dl className="space-y-5">
            {seo.faq.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold text-stone-900 mb-1">{item.question}</dt>
                <dd className="text-stone-700 leading-7">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Similar pages + internal links */}
      {seo && (seo.similarPages.length > 0 || seo.internalLinks.length > 0) && (
        <section className="mb-10 grid gap-6 lg:grid-cols-2 max-w-4xl">
          {seo.similarPages.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Pages similaires</h2>
              <ul className="space-y-2">
                {seo.similarPages.map((item) => (
                  <li key={`${item.keyword}-${item.url}`}>
                    <Link
                      href={item.url}
                      className="text-amber-700 hover:text-amber-900 hover:underline text-sm font-medium transition-colors"
                    >
                      {item.keyword}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {seo.internalLinks.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Aller plus loin</h2>
              <ul className="space-y-2">
                {seo.internalLinks.map((href) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-amber-700 hover:text-amber-900 hover:underline text-sm font-medium transition-colors"
                    >
                      {href}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Back link */}
      <div className="mt-4">
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
