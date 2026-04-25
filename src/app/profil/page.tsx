import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

type Tab = "ludotheque" | "amis";

const STATUT_LABELS: Record<string, string> = {
  possede: "📚 J'ai ce jeu",
  souhaite: "❤️ Je le veux",
  joue: "🎮 J'y joue",
};

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/connexion");

  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === "amis" ? "amis" : "ludotheque";

  const svc = createServiceClient();

  const [{ data: profile }, { data: ludotheque }, { data: amisData }] = await Promise.all([
    svc.from("profiles").select("pseudo, created_at").eq("id", user.id).single(),
    svc
      .from("ludotheque")
      .select("statut, jeux(slug, nom)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    svc
      .from("amis")
      .select("id, statut, user_id, ami_id, profiles_user:user_id(pseudo), profiles_ami:ami_id(pseudo)")
      .or(`user_id.eq.${user.id},ami_id.eq.${user.id}`)
      .eq("statut", "accepte"),
  ]);

  const pseudo = (profile as { pseudo: string | null } | null)?.pseudo ?? user.email?.split("@")[0] ?? "Joueur";
  const createdAt = (profile as { created_at: string } | null)?.created_at;

  type LudoItem = { statut: string; jeux: { slug: string; nom: string } | null };
  const items = (ludotheque ?? []) as unknown as LudoItem[];

  type AmiRow = { id: string; user_id: string; ami_id: string; profiles_user: { pseudo: string | null } | null; profiles_ami: { pseudo: string | null } | null };
  const friends = (amisData ?? []) as unknown as AmiRow[];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 mb-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-amber-700 flex items-center justify-center text-xl font-black text-white shrink-0">
          {pseudo[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-amber-950">{pseudo}</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
          {createdAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Membre depuis {new Date(createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <SignOutButton />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <Link
          href="/profil?tab=ludotheque"
          className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${
            tab === "ludotheque" ? "bg-white text-amber-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📚 Ma ludothèque ({items.length})
        </Link>
        <Link
          href="/profil?tab=amis"
          className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${
            tab === "amis" ? "bg-white text-amber-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          👥 Mes amis ({friends.length})
        </Link>
      </div>

      {/* Tab: Ludothèque */}
      {tab === "ludotheque" && (
        <div>
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-10 text-center">
              <p className="text-gray-500 text-sm">Votre ludothèque est vide.</p>
              <Link href="/jeux" className="inline-block mt-3 text-amber-700 font-semibold hover:underline text-sm">
                Parcourir les jeux →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item, i) => item.jeux && (
                <Link key={i} href={`/jeu/${item.jeux.slug}`}
                  className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-center gap-3 hover:border-amber-300 transition-colors">
                  <span className="text-sm text-gray-500 w-28 shrink-0">{STATUT_LABELS[item.statut]}</span>
                  <span className="font-semibold text-gray-900 text-sm">{item.jeux.nom}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Amis */}
      {tab === "amis" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{friends.length} ami{friends.length !== 1 ? "s" : ""}</p>
            <Link href="/profil/amis" className="text-sm font-semibold text-amber-700 hover:underline">
              Gérer mes amis →
            </Link>
          </div>

          {friends.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-10 text-center">
              <p className="text-gray-500 text-sm">Aucun ami pour l&apos;instant.</p>
              <Link href="/profil/amis" className="inline-block mt-3 text-amber-700 font-semibold hover:underline text-sm">
                Inviter des amis →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {friends.map((r) => {
                const friendPseudo = r.user_id === user.id
                  ? (r.profiles_ami?.pseudo ?? "?")
                  : (r.profiles_user?.pseudo ?? "?");
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {(friendPseudo[0] ?? "?").toUpperCase()}
                    </span>
                    <Link href={`/profil/${friendPseudo}`} className="flex-1 font-semibold text-sm text-gray-900 hover:text-amber-800">
                      {friendPseudo}
                    </Link>
                    <Link href={`/profil/${friendPseudo}#commun`} className="text-xs text-amber-700 font-semibold hover:underline">
                      Jeux en commun →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button type="submit" className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors">
        Déconnexion
      </button>
    </form>
  );
}
