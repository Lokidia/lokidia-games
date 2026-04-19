import { createServiceClient } from "@/utils/supabase/service";
import CategoriesManager from "./_components/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("categories")
    .select("id, slug, nom, type, parent_id, actif")
    .order("nom");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <CategoriesManager initialCategories={(data as never[]) ?? []} />
    </div>
  );
}
