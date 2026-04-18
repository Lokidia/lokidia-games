import { createServiceClient } from "@/utils/supabase/service";
import Navbar, { type MenuGroup } from "./Navbar";

type CatRow = { id: string; slug: string; nom: string; parent_id: string | null };

export default async function NavbarWrapper() {
  let menuGroups: MenuGroup[] = [];

  try {
    // Use service client — no cookies() dependency, safe in root layout
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("categories")
      .select("id, slug, nom, parent_id")
      .order("nom");

    if (error) throw error;
    if (data && data.length > 0) {
      const cats = data as CatRow[];

      // Only categories with parent_id === null are roots
      const roots = cats.filter((c) => c.parent_id === null);
      const nonRoots = cats.filter((c) => c.parent_id !== null);

      if (roots.length > 0) {
        menuGroups = roots
          .map((root) => ({
            label: root.nom,
            slug:  root.slug,
            items: nonRoots
              .filter((c) => c.parent_id === root.id)
              .map((c) => ({ nom: c.nom, slug: c.slug })),
          }))
          // Prefer groups that have children (show hierarchy first)
          .sort((a, b) => b.items.length - a.items.length)
          // Cap at 8 nav entries to prevent navbar overflow
          .slice(0, 8);
      } else {
        // All categories are children of something not in the result set — show all as flat groups (max 8)
        menuGroups = cats.slice(0, 8).map((c) => ({
          label: c.nom,
          slug:  c.slug,
          items: [],
        }));
      }
    }
  } catch {
    // Fallback: empty menu — site still works, just no mega-menu
  }

  return <Navbar menuGroups={menuGroups} />;
}
