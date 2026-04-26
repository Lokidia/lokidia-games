import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import ShareWishlistButton from "@/components/ShareWishlistButton";
import SectionAmis from "@/components/profil/SectionAmis";
import SectionParties from "@/components/profil/SectionParties";
import SectionNotifications from "@/components/profil/SectionNotifications";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "profil" | "ludotheque" | "wishlist" | "amis" | "parties" | "notifications";

const VALID_TABS: Tab[] = ["profil", "ludotheque", "wishlist", "amis", "parties", "notifications"];

const STATUT_LABELS: Record<string, string> = {
  possede: "📚 Possédé",
  souhaite: "❤️ Souhaité",
};

type LudoItem = {
  statut: string;
  jeux: {
    slug: string;
    nom: string;
    image_url: string | null;
    note: number;
    jeux_prix: { prix: string; url: string; marchand: string }[];
    jeux_categories: { categories: { nom: string } | null }[];
  } | null;
};

type WishItem = {
  jeux: {
    slug: string;
    nom: string;
    image_url: string | null;
    note: number;
    jeux_prix: { prix: number; url: string; boutique: string }[];
  } | null;
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/connexion");

  const rawTab = (await searchParams).tab ?? "profil";
  const tab: Tab = VALID_TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "profil";

  const svc = createServiceClient();

  // ── Fetch base data (always needed) ──────────────────────────────────────
  const [{ data: profile }, { data: ludotheque }, { count: amisCount }] = await Promise.all([
    svc.from("profiles").select("pseudo, created_at").eq("id", user.id).single(),
    svc
      .from("ludotheque")
      .select("statut, jeux(slug, nom, image_url, note, jeux_prix(prix, url, marchand), jeux_categories(categories(nom)))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    svc
      .from("amis")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${user.id},ami_id.eq.${user.id}`)
      .eq("statut", "accepte"),
  ]);

  const pseudo    = (profile as { pseudo: string | null } | null)?.pseudo ?? user.email?.split("@")[0] ?? "Joueur";
  const createdAt = (profile as { created_at: string } | null)?.created_at;
  const items     = (ludotheque ?? []) as unknown as LudoItem[];

  const possede  = items.filter(i => i.statut === "possede");
  const souhaite = items.filter(i => i.statut === "souhaite");


  // ── Fetch wishlist prices (only when needed) ──────────────────────────────
  let wishItems: WishItem[] = [];
  if (tab === "wishlist") {
    const { data } = await svc
      .from("ludotheque")
      .select("jeux(slug, nom, image_url, note, jeux_prix(prix, url, boutique))")
      .eq("user_id", user.id)
      .eq("statut", "souhaite")
      .order("created_at", { ascending: false });
    wishItems = (data ?? []) as unknown as WishItem[];
  }

  // ── Nav items ─────────────────────────────────────────────────────────────
  const NAV: { tab: Tab; emoji: string; label: string; count?: number }[] = [
    { tab: "profil",        emoji: "👤", label: "Mon profil" },
    { tab: "ludotheque",    emoji: "📚", label: "Ma ludothèque", count: items.length },
    { tab: "wishlist",      emoji: "❤️", label: "Ma wishlist",   count: souhaite.length },
    { tab: "amis",          emoji: "👥", label: "Mes amis",      count: amisCount ?? 0 },
    { tab: "parties",       emoji: "🎮", label: "Mes parties" },
    { tab: "notifications", emoji: "🔔", label: "Notifications" },
  ];

  const sectionTitle = NAV.find(n => n.tab === tab)?.label ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Mobile: compact header ───────────────────────────────────────── */}
        <div className="lg:hidden flex items-center gap-3 mb-5 bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <AvatarCircle letter={pseudo[0]} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-amber-950 truncate">{pseudo}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {/* ── Mobile: scrollable tabs ──────────────────────────────────────── */}
        <div className="lg:hidden overflow-x-auto flex gap-1.5 bg-white border border-amber-100 rounded-2xl shadow-sm p-1.5 mb-5 [&::-webkit-scrollbar]:hidden">
          {NAV.map(item => (
            <Link
              key={item.tab}
              href={`/profil?tab=${item.tab}`}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === item.tab
                  ? "bg-amber-700 text-white shadow-sm"
                  : "text-gray-500 hover:bg-amber-50 hover:text-amber-900"
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === item.tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── Desktop: sidebar + content grid ─────────────────────────────── */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:items-start">

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-3 sticky top-8 self-start">
            {/* User card */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-col items-center gap-3 text-center">
              <AvatarCircle letter={pseudo[0]} size="lg" />
              <div>
                <p className="font-black text-amber-950 text-base leading-tight">{pseudo}</p>
                <p className="text-xs text-gray-400 mt-0.5 break-all">{user.email}</p>
                {createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Membre depuis {new Date(createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <SignOutButton />
            </div>

            {/* Nav links */}
            <nav className="bg-white rounded-2xl border border-amber-100 shadow-sm p-2 flex flex-col gap-0.5">
              {NAV.map(item => (
                <Link
                  key={item.tab}
                  href={`/profil?tab=${item.tab}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    tab === item.tab
                      ? "bg-amber-700 text-white"
                      : "text-gray-600 hover:bg-amber-50 hover:text-amber-900"
                  }`}
                >
                  <span className="text-base shrink-0 w-5 text-center">{item.emoji}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      tab === item.tab ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                    }`}>
                      {item.count}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            {/* Section title */}
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-black text-amber-950">
                {sectionTitle}
              </h1>
              {tab === "wishlist" && <ShareWishlistButton pseudo={pseudo} />}
            </div>

            {/* ── Profil section ─────────────────────────────────────────── */}
            {tab === "profil" && (
              <div className="flex flex-col gap-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard value={items.length} label="Jeux" href="/profil?tab=ludotheque" />
                  <StatCard value={amisCount ?? 0} label="Amis" href="/profil?tab=amis" />
                  <StatCard value={souhaite.length} label="Wishlist" href="/profil?tab=wishlist" />
                </div>

                {/* Profile info */}
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-bold text-amber-900">Informations</h2>
                  <dl className="flex flex-col gap-3">
                    <Row label="Pseudo" value={pseudo} />
                    <Row label="Email" value={user.email ?? ""} />
                    {createdAt && (
                      <Row
                        label="Membre depuis"
                        value={new Date(createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      />
                    )}
                  </dl>
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                  <h2 className="text-sm font-bold text-amber-900 mb-3">Accès rapide</h2>
                  <div className="flex flex-wrap gap-2">
                    {NAV.filter(n => n.tab !== "profil").map(n => (
                      <Link
                        key={n.tab}
                        href={`/profil?tab=${n.tab}`}
                        className="flex items-center gap-1.5 text-sm border border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold px-3 py-2 rounded-xl transition-colors"
                      >
                        {n.emoji} {n.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Ludothèque section ─────────────────────────────────────── */}
            {tab === "ludotheque" && (
              <div className="flex flex-col gap-6">
                {/* Stats bande */}
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

                {items.length === 0 ? (
                  <EmptyState emoji="📚" text="Votre ludothèque est vide.">
                    <Link href="/jeux" className="text-amber-700 font-semibold hover:underline text-sm">
                      Parcourir les jeux →
                    </Link>
                  </EmptyState>
                ) : (
                  <>
                    {possede.length > 0 && (
                      <section>
                        <h2 className="text-sm font-black text-amber-950 mb-4">
                          Ma collection{" "}
                          <span className="text-amber-600 font-bold">({possede.length} jeu{possede.length > 1 ? "x" : ""})</span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {possede.map((item, i) => item.jeux && (
                            <JeuCard key={i} jeu={item.jeux} statut="possede" />
                          ))}
                        </div>
                      </section>
                    )}
                    {souhaite.length > 0 && (
                      <section>
                        <h2 className="text-sm font-black text-amber-950 mb-4">
                          Ma wishlist{" "}
                          <span className="text-rose-600 font-bold">({souhaite.length} jeu{souhaite.length > 1 ? "x" : ""})</span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {souhaite.map((item, i) => item.jeux && (
                            <JeuCard key={i} jeu={item.jeux} statut="souhaite" />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Wishlist section ───────────────────────────────────────── */}
            {tab === "wishlist" && (
              <div className="flex flex-col gap-3">
                {wishItems.length === 0 ? (
                  <EmptyState emoji="❤️" text="Votre wishlist est vide.">
                    <Link href="/jeux" className="text-amber-700 font-semibold hover:underline text-sm">
                      Parcourir les jeux →
                    </Link>
                  </EmptyState>
                ) : (
                  wishItems.map((item, i) => {
                    if (!item.jeux) return null;
                    const jeu = item.jeux;
                    const prices = jeu.jeux_prix ?? [];
                    const best = prices.reduce<{ prix: number; url: string; boutique: string } | null>(
                      (min, p) => (!min || p.prix < min.prix ? p : min),
                      null
                    );
                    return (
                      <div key={i} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex gap-4 items-center hover:border-amber-200 transition-colors">
                        {jeu.image_url ? (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                            <Image src={jeu.image_url} alt={jeu.nom} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-2xl">🎲</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link href={`/jeu/${jeu.slug}`} className="font-bold text-gray-900 hover:text-amber-800 text-sm leading-tight block truncate">
                            {jeu.nom}
                          </Link>
                          {jeu.note > 0 && <p className="text-xs text-amber-600 font-semibold mt-0.5">★ {jeu.note.toFixed(1)}</p>}
                          {best && (
                            <p className="text-xs text-gray-500 mt-1">
                              À partir de{" "}
                              <a href={best.url} target="_blank" rel="noopener noreferrer" className="text-amber-700 font-semibold hover:underline">
                                {best.prix.toFixed(2)} € – {best.boutique}
                              </a>
                            </p>
                          )}
                        </div>
                        {best && (
                          <a
                            href={best.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                          >
                            Voir 🎁
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Client sections ────────────────────────────────────────── */}
            {tab === "amis"          && <SectionAmis />}
            {tab === "parties"       && <SectionParties />}
            {tab === "notifications" && <SectionNotifications />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarCircle({ letter, size }: { letter: string | undefined; size: "sm" | "lg" }) {
  const cls = size === "lg"
    ? "w-16 h-16 text-2xl"
    : "w-10 h-10 text-base";
  return (
    <div className={`${cls} rounded-full bg-amber-700 flex items-center justify-center font-black text-white shrink-0`}>
      {(letter ?? "?").toUpperCase()}
    </div>
  );
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        Déconnexion
      </button>
    </form>
  );
}

function StatCard({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 text-center hover:border-amber-300 transition-colors group"
    >
      <p className="text-2xl font-black text-amber-800 group-hover:text-amber-700">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-xs text-gray-400 w-28 shrink-0">{label}</dt>
      <dd className="text-sm font-semibold text-gray-800 break-all">{value}</dd>
    </div>
  );
}

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

function EmptyState({ emoji, text, children }: { emoji: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-12 text-center">
      <p className="text-4xl mb-3">{emoji}</p>
      <p className="text-gray-500 text-sm">{text}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
