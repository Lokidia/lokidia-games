import { createServiceClient } from "@/utils/supabase/service";
import Navbar, { type MenuGroup } from "./Navbar";

type CatRow = { id: string; slug: string; nom: string; parent_id: string | null };

function buildMenuGroups(cats: CatRow[]): MenuGroup[] {
  const idSet = new Set(cats.map((c) => c.id));

  // Roots = parent_id is null OR points to an id not in this result set
  const roots = cats.filter((c) => !c.parent_id || !idSet.has(c.parent_id));
  const nonRoots = cats.filter((c) => c.parent_id && idSet.has(c.parent_id));

  if (roots.length === 0) return [];

  return roots
    .map((root) => ({
      label: root.nom,
      slug:  root.slug,
      items: nonRoots
        .filter((c) => c.parent_id === root.id)
        .map((c) => ({ nom: c.nom, slug: c.slug })),
    }))
    .slice(0, 8);
}

export default async function NavbarWrapper() {
  let menuGroups: MenuGroup[] = [];

  try {
    const sb = createServiceClient();

    // Try with actif + position (requires migrations to have been run)
    let { data, error } = await sb
      .from("categories")
      .select("id, slug, nom, parent_id")
      .eq("actif", true)
      .order("position", { ascending: true, nullsFirst: false })
      .order("nom");

    // Fallback: columns don't exist yet — fetch without them
    if (error) {
      ({ data, error } = await sb
        .from("categories")
        .select("id, slug, nom, parent_id")
        .order("nom"));
    }

    if (error) throw error;
    if (data && data.length > 0) {
      menuGroups = buildMenuGroups(data as CatRow[]);
    }
  } catch {
    // Site still works, just no mega-menu
  }

  return <Navbar menuGroups={menuGroups} />;
}
