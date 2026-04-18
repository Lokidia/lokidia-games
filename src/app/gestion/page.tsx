import Link from "next/link";
import { createServiceClient } from "@/utils/supabase/service";
import { listSeoPages } from "@/lib/seo/repository";

export const dynamic = "force-dynamic";

function StatCard({
  value, label, color, icon,
}: {
  value: string | number;
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm flex items-start gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

const SECTIONS = [
  {
    href: "/admin/jeux",
    icon: "🎲",
    title: "Jeux",
    desc: "Ajouter, modifier ou supprimer des jeux. Gérer les descriptions, règles, images et prix.",
    color: "from-amber-500 to-orange-500",
  },
  {
    href: "/admin/categories",
    icon: "🗂️",
    title: "Catégories",
    desc: "Arborescence du méga-menu. Créer des catégories racines et des sous-catégories.",
    color: "from-orange-500 to-red-500",
  },
  {
    href: "/admin/associations",
    icon: "🔗",
    title: "Associations",
    desc: "Lier les jeux à leurs catégories. Sélectionner un jeu et cocher ses catégories.",
    color: "from-amber-600 to-amber-400",
  },
  {
    href: "/admin/enrichissement",
    icon: "✅",
    title: "Enrichissement",
    desc: "Indicateurs de complétude par jeu : image, description, règles, prix manquants.",
    color: "from-emerald-600 to-emerald-400",
  },
  {
    href: "/admin/seo",
    icon: "🔍",
    title: "SEO",
    desc: "Générer les pages SEO IA pour les 20 combinaisons cibles. Suivi des tokens économisés.",
    color: "from-blue-600 to-blue-400",
  },
];

export default async function AdminPage() {
  const sb = createServiceClient();

  const [jeuxRes, catsRes, recentRes, seoPages] = await Promise.all([
    sb.from("jeux").select("*", { count: "exact", head: true }),
    sb.from("categories").select("*", { count: "exact", head: true }),
    sb
      .from("jeux")
      .select("slug, nom, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6),
    listSeoPages(),
  ]);

  const nbJeux = jeuxRes.count ?? 0;
  const nbCats = catsRes.count ?? 0;
  const nbSeoGenerated = seoPages.filter((p) =>
    ["generated", "published"].includes(p.status),
  ).length;
  const seoPct = seoPages.length > 0 ? Math.round((nbSeoGenerated / 20) * 100) : 0;

  type RecentJeu = { slug: string; nom: string; updated_at: string };
  const recentJeux: RecentJeu[] = (recentRes.data as RecentJeu[] | null) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* Header */}
      <div>
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
          Administration
        </p>
        <h1 className="text-3xl font-black text-amber-950">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble de Lokidia Games</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard value={nbJeux}          label="Jeux référencés"   color="text-amber-700"   icon="🎲" />
        <StatCard value={nbCats}           label="Catégories"        color="text-orange-600"  icon="🗂️" />
        <StatCard value={nbSeoGenerated}   label="Pages SEO générées" color="text-emerald-600" icon="🔍" />
        <StatCard value={`${seoPct} %`}    label="Couverture SEO"    color={seoPct === 100 ? "text-emerald-600" : "text-amber-600"} icon="📈" />
      </div>

      {/* Section cards */}
      <div>
        <h2 className="text-lg font-bold text-amber-950 mb-4">Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ href, icon, title, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${color} p-4 flex items-center gap-3`}>
                <span className="text-3xl">{icon}</span>
                <span className="text-white font-black text-lg">{title}</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-amber-700 group-hover:text-amber-900 transition-colors">
                  Ouvrir <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent modifications */}
      {recentJeux.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100">
            <h2 className="font-bold text-amber-950">Dernières modifications</h2>
          </div>
          <ul className="divide-y divide-amber-50">
            {recentJeux.map((jeu) => (
              <li key={jeu.slug} className="flex items-center justify-between px-6 py-3 hover:bg-amber-50/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-amber-900">{jeu.nom}</p>
                  <p className="text-xs text-gray-400 font-mono">{jeu.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(jeu.updated_at).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/jeu/${jeu.slug}`}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    Voir →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
