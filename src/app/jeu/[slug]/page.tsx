import { notFound } from "next/navigation";
import Link from "next/link";
import { getJeuBySlug, getAllJeuxSlugs } from "@/lib/jeux-repository";
import ComparateurPrix from "@/components/ComparateurPrix";
import DescriptionExpand from "@/components/DescriptionExpand";
import { Complexite } from "@/types/jeu";

function getComplexiteColor(complexite: Complexite): string {
  if (complexite === "Simple") {
    return "text-green-500";
  }

  if (complexite === "Complexe") {
    return "text-orange-500";
  }

  if (complexite === "Expert") {
    return "text-red-600";
  }

  if (complexite.includes("Inter")) {
    return "text-yellow-600";
  }

  return "text-green-600";
}

export async function generateStaticParams() {
  const slugs = await getAllJeuxSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function FicheJeu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const jeu = await getJeuBySlug(slug);

  if (!jeu) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/jeux" className="text-amber-700 hover:underline text-sm mb-6 inline-block">
        Retour aux jeux
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">{jeu.nom}</h1>
            <p className="text-gray-500 mt-1">{jeu.annee}</p>
          </div>
          <div className="bg-amber-100 text-amber-800 text-lg font-bold px-4 py-2 rounded-xl">
            {jeu.note > 0 && (
  <span>{jeu.note}/10</span>
)}
          </div>
        </div>

        <DescriptionExpand text={jeu.description} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Joueurs", value: `${jeu.joueursMin}-${jeu.joueursMax}`, icon: "👥" },
            { label: "Durée", value: `${jeu.dureeMin}-${jeu.dureeMax} min`, icon: "⏱️" },
            { label: "Âge", value: `${jeu.ageMin}+`, icon: "🎂" },
            { label: "Complexité", value: jeu.complexite, icon: "🧠", color: getComplexiteColor(jeu.complexite) },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className={`font-semibold text-sm ${color ?? "text-amber-900"}`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categories</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {jeu.categories.map((cat) => (
                <span key={cat} className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mecaniques</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {jeu.mecaniques.map((m) => (
                <span key={m} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {jeu.regles.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-amber-900 mb-3">Comment jouer ?</h2>
            <ul className="flex flex-col gap-2">
              {jeu.regles.map((regle, i) => (
                <li key={i} className="flex gap-3 text-gray-700">
                  <span className="bg-amber-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {regle}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="max-w-sm">
          <ComparateurPrix nomJeu={jeu.nom} acheter={jeu.acheter} />
        </div>
      </div>
    </div>
  );
}
