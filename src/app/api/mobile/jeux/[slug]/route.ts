import { NextResponse } from "next/server";
import { getJeuBySlug } from "@/lib/jeux-repository";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const jeu = await getJeuBySlug(slug);

  if (!jeu) {
    return NextResponse.json({ error: "Jeu introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    jeu: {
      id: jeu.id,
      slug: jeu.slug,
      nom: jeu.nom,
      annee: jeu.annee,
      description: jeu.description,
      joueursMin: jeu.joueursMin,
      joueursMax: jeu.joueursMax,
      dureeMin: jeu.dureeMin,
      dureeMax: jeu.dureeMax,
      ageMin: jeu.ageMin,
      complexite: jeu.complexite,
      note: jeu.note,
      categories: jeu.categories,
      mecaniques: jeu.mecaniques,
      regles: jeu.regles,
      pointsForts: jeu.pointsForts ?? [],
      imageUrl: jeu.imageUrl,
      acheter: jeu.acheter,
    },
  });
}
