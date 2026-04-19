import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { upsertSeoRecordSupabase, urlToSlug } from "@/lib/seo/supabase-repository";
import { createServiceClient } from "@/utils/supabase/service";
import type { SeoPage } from "@/lib/seo/types";

const MODEL = process.env.ANTHROPIC_SEO_MODEL ?? "claude-haiku-4-5-20251001";

function buildPrompt(
  type: "static" | "category" | "game",
  label: string,
  url: string,
  ctx: Record<string, unknown>,
): string {
  const site = "Lokidia Games est une encyclopédie française de jeux de société. Le site propose des fiches détaillées avec règles résumées, comparateur de prix Amazon/Philibert/Cultura et recommandations personnalisées.";

  let pageCtx = "";
  if (type === "static") {
    pageCtx = `Page : "${label}" (${url})\nDescription du contenu : ${ctx.description ?? ""}`;
  } else if (type === "category") {
    const games = (ctx.games as string[] | undefined) ?? [];
    pageCtx = `Catégorie de jeux de société : "${label}"\nURL : ${url}\nJeux dans cette catégorie : ${games.length > 0 ? games.slice(0, 25).join(", ") : "(liste non disponible)"}`;
  } else {
    pageCtx = `Jeu de société : "${label}"
URL : ${url}
Description : ${ctx.description ?? ""}
Joueurs : ${ctx.joueurs_min}-${ctx.joueurs_max} joueurs
Durée : ${ctx.duree_min}-${ctx.duree_max} min
Âge : ${ctx.age_min}+
Complexité : ${ctx.complexite}
Mécaniques : ${((ctx.mecaniques as string[]) ?? []).join(", ")}`;
  }

  return `${site}

${pageCtx}

Génère le contenu SEO pour cette page. Réponds UNIQUEMENT avec l'objet JSON ci-dessous, sans texte ni markdown autour.

{
  "title": "(max 60 caractères, inclure le nom + Lokidia Games)",
  "meta": "(max 155 caractères, description naturelle avec les mots-clés principaux)",
  "h1": "(différent du title, plus développé)",
  "intro": "(paragraphe de 50-80 mots, ton naturel, informatif)",
  "sections": [
    {"h2": "Titre section 1", "text": "2-3 phrases de contenu utile."},
    {"h2": "Titre section 2", "text": "2-3 phrases de contenu utile."}
  ],
  "faq": [
    {"question": "Question pertinente pour cette page ?", "answer": "Réponse concise en 1-2 phrases."},
    {"question": "Autre question fréquente ?", "answer": "Réponse concise en 1-2 phrases."}
  ]
}

Contraintes : langue française, ton engageant, title ≤60 chars, meta ≤155 chars, pas de sur-optimisation.`;
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  throw new Error("No JSON found in response");
}

function parsePage(raw: string, url: string): SeoPage {
  const json = extractJson(raw);
  const p = JSON.parse(json) as Record<string, unknown>;

  function str(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v.trim() : fallback;
  }

  const sections = Array.isArray(p.sections)
    ? (p.sections as Array<Record<string, unknown>>).slice(0, 4).map((s) => ({
        h2: str(s.h2, "Section"),
        text: str(s.text, ""),
      }))
    : [];

  const faq = Array.isArray(p.faq)
    ? (p.faq as Array<Record<string, unknown>>).slice(0, 4).map((f) => ({
        question: str(f.question, "Question ?"),
        answer: str(f.answer, ""),
      }))
    : [];

  return {
    title: str(p.title).slice(0, 70),
    meta: str(p.meta).slice(0, 160),
    url,
    h1: str(p.h1) || str(p.title),
    intro: str(p.intro),
    sections,
    faq,
    similarPages: [],
    internalLinks: ["/jeux"],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      url: string;
      type: "static" | "category" | "game";
      context: Record<string, unknown>;
      force?: boolean;
    };

    const { url, type, context, force = false } = body;
    if (!url || !type) {
      return NextResponse.json({ error: "url and type required" }, { status: 400 });
    }

    // Load games for category context if needed
    let enrichedContext = { ...context };
    if (type === "category") {
      const slug = url.split("/").pop() ?? "";
      const sb = createServiceClient();
      const { data: cat } = await sb
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .single();
      if (cat) {
        const { data: children } = await sb
          .from("categories")
          .select("id")
          .eq("parent_id", (cat as { id: string }).id);
        const catIds = [(cat as { id: string }).id, ...((children ?? []) as { id: string }[]).map((c) => c.id)];
        const { data: assoc } = await sb
          .from("jeux_categories")
          .select("jeu_id")
          .in("categorie_id", catIds);
        if (assoc && assoc.length > 0) {
          const jeuIds = [...new Set((assoc as { jeu_id: string }[]).map((a) => a.jeu_id))];
          const { data: jeux } = await sb
            .from("jeux")
            .select("nom")
            .in("id", jeuIds)
            .order("note", { ascending: false })
            .limit(25);
          enrichedContext = { ...enrichedContext, games: ((jeux ?? []) as { nom: string }[]).map((j) => j.nom) };
        }
      }
    }

    // Check if already exists and not forcing
    if (!force) {
      const { createServiceClient: svcClient } = await import("@/utils/supabase/service");
      const sb = svcClient();
      const slug = urlToSlug(url);
      const { data: existing } = await sb.from("seo_pages").select("slug").eq("slug", slug).single();
      if (existing) {
        const { data: full } = await sb
          .from("seo_pages")
          .select("input_hash, slug, payload_json, status, generated_at, updated_at")
          .eq("slug", slug)
          .single();
        return NextResponse.json(full);
      }
    }

    const label = String(context.nom ?? context.label ?? url);
    const prompt = buildPrompt(type, label, url, enrichedContext);

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content.find((c) => c.type === "text");
    if (!text || text.type !== "text") throw new Error("Empty response");

    const page = parsePage(text.text, url);
    const record = await upsertSeoRecordSupabase(url, page);

    return NextResponse.json(record);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-page]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
