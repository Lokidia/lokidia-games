import type { Metadata } from "next";
import FiltresEtJeux from "@/components/FiltresEtJeux";
import { getAllJeux, getJeuxByCategorie } from "@/lib/jeux-repository";
import type { Jeu } from "@/types/jeu";

export const metadata: Metadata = {
  title: "Tous les jeux de société — Lokidia Games",
  description: "Parcourez notre encyclopédie de jeux de société : filtrez par catégorie, nombre de joueurs, durée ou complexité. Comparez les prix et trouvez votre prochain jeu.",
  alternates: { canonical: "/jeux" },
  openGraph: {
    title: "Tous les jeux de société — Lokidia Games",
    description: "Plus de 100 fiches jeux avec règles, prix et avis. Filtrez et comparez pour choisir le jeu parfait.",
    url: "/jeux",
    locale: "fr_FR",
    type: "website",
  },
};

export default async function JeuxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; categorie?: string }>;
}) {
  const params = await searchParams;

  let jeux: Jeu[];
  let categorieTitre: string | undefined;
  let categorieSlug: string | undefined;

  if (params.categorie) {
    const result = await getJeuxByCategorie(params.categorie);
    jeux = result.jeux;
    categorieTitre = result.categorie?.nom ?? undefined;
    categorieSlug = params.categorie;
  } else {
    jeux = await getAllJeux();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <FiltresEtJeux
        jeux={jeux}
        searchQuery={params.q}
        filtreInitial={params.filtre}
        categorieTitre={categorieTitre}
        categorieSlug={categorieSlug}
      />
    </div>
  );
}
