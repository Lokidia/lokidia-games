import { createServiceClient } from "@/utils/supabase/service";
import type { SeoPage, SeoPageRecord, SeoPageStatus } from "./types";

export function urlToSlug(url: string): string {
  return (url.startsWith("/") ? url.slice(1) : url) || "home";
}

export async function getSeoRecordByUrlSupabase(url: string): Promise<SeoPageRecord | null> {
  try {
    const sb = createServiceClient();
    const slug = urlToSlug(url);
    const { data } = await sb
      .from("seo_pages")
      .select("input_hash, slug, payload_json, status, generated_at, updated_at")
      .eq("slug", slug)
      .single();
    return (data as SeoPageRecord) ?? null;
  } catch {
    return null;
  }
}

export async function listAllSeoRecordsSupabase(): Promise<SeoPageRecord[]> {
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("seo_pages")
      .select("input_hash, slug, payload_json, status, generated_at, updated_at")
      .order("updated_at", { ascending: false });
    return (data ?? []) as SeoPageRecord[];
  } catch {
    return [];
  }
}

export async function upsertSeoRecordSupabase(
  url: string,
  page: SeoPage,
  status: SeoPageStatus = "generated",
): Promise<SeoPageRecord> {
  const sb = createServiceClient();
  const slug = urlToSlug(url);
  const now = new Date().toISOString();
  const record: SeoPageRecord = {
    input_hash: slug,
    slug,
    payload_json: { ...page, url },
    status,
    generated_at: now,
    updated_at: now,
  };
  await sb.from("seo_pages").upsert(record, { onConflict: "slug" });
  return record;
}

export async function updateSeoRecordSupabase(
  slug: string,
  partial: Partial<SeoPage>,
): Promise<SeoPageRecord | null> {
  try {
    const sb = createServiceClient();
    const { data: existing } = await sb
      .from("seo_pages")
      .select("*")
      .eq("slug", slug)
      .single();
    if (!existing) return null;

    const updated = {
      ...(existing as SeoPageRecord),
      payload_json: { ...(existing as SeoPageRecord).payload_json, ...partial },
      status: "draft" as const,
      updated_at: new Date().toISOString(),
    };

    await sb.from("seo_pages").update(updated).eq("slug", slug);
    return updated;
  } catch {
    return null;
  }
}
