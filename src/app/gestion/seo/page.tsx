import { listSeoPages } from "@/lib/seo/repository";
import { buildCanonicalSeoInput } from "@/lib/seo/normalize";
import { SEO_TARGET_COMBINATIONS } from "@/lib/seo/combinations";
import AdminDashboard from "../AdminDashboard";
import type { TargetItem } from "../AdminDashboard";

export const dynamic = "force-dynamic";

export default async function SeoAdminPage() {
  const records = await listSeoPages();
  const byHash = new Map(records.map((r) => [r.input_hash, r]));

  const targets: TargetItem[] = SEO_TARGET_COMBINATIONS.map(({ label, input }) => {
    const canonical = buildCanonicalSeoInput(input);
    const record = byHash.get(canonical.inputHash) ?? null;
    return {
      label,
      url: canonical.url,
      slug: record?.slug ?? null,
      input,
      payload_json: record?.payload_json ?? null,
      generated: record !== null,
      status: record?.status ?? null,
      generatedAt: record?.generated_at ?? null,
    };
  });

  const targetHashes = new Set(
    SEO_TARGET_COMBINATIONS.map(({ input }) => buildCanonicalSeoInput(input).inputHash),
  );
  const extraPages = records
    .filter((r) => !targetHashes.has(r.input_hash))
    .map((r) => ({
      slug: r.slug,
      url: r.payload_json.url,
      status: r.status,
      generatedAt: r.generated_at,
    }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <AdminDashboard targets={targets} extraPages={extraPages} />
    </div>
  );
}
