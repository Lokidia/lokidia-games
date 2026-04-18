import { createServiceClient } from "@/utils/supabase/service";
import AssociationsEditor from "./_components/AssociationsEditor";

export const dynamic = "force-dynamic";

export default async function AdminAssociationsPage() {
  const sb = createServiceClient();

  const [jeuxRes, catsRes] = await Promise.all([
    sb
      .from("jeux")
      .select("id, slug, nom, jeux_categories(categorie_id)")
      .order("nom"),
    sb.from("categories").select("id, slug, nom, type, parent_id").order("nom"),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <AssociationsEditor
        jeux={(jeuxRes.data as never[]) ?? []}
        categories={(catsRes.data as never[]) ?? []}
      />
    </div>
  );
}
