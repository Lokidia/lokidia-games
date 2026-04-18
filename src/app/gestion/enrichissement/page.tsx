import { createServiceClient } from "@/utils/supabase/service";
import EnrichissementManager from "./_components/EnrichissementManager";

export const dynamic = "force-dynamic";

export default async function AdminEnrichissementPage() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("jeux")
    .select(
      "id, slug, nom, description, image_url, regles, mecaniques, annee, joueurs_min, joueurs_max, duree_min, duree_max, age_min, complexite, note, updated_at, jeux_prix(marchand, prix, url), jeux_categories(categorie_id, categories(id, nom))",
    )
    .order("nom");

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <EnrichissementManager initialJeux={(data as never[]) ?? []} />
    </div>
  );
}
