import { createServiceClient } from "@/utils/supabase/service";
import JeuxManager from "./_components/JeuxManager";

export const dynamic = "force-dynamic";

export default async function AdminJeuxPage() {
  const sb = createServiceClient();

  const [jeuxRes, catsRes] = await Promise.all([
    sb
      .from("jeux")
      .select(
        "id, slug, nom, annee, complexite, note, image_url, updated_at, actif, ean, youtube_id, jeux_prix(marchand, prix, url), jeux_categories(categories(id, nom))",
      )
      .order("nom"),
    sb.from("categories").select("id, slug, nom, type, parent_id").order("nom"),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <JeuxManager
        initialJeux={(jeuxRes.data as never[]) ?? []}
        categories={(catsRes.data as never[]) ?? []}
      />
    </div>
  );
}
