import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type Params = { params: Promise<{ slug: string }> };

interface YTSearchItem {
  id: { videoId: string };
  snippet: { title: string; defaultAudioLanguage?: string; defaultLanguage?: string };
}
interface YTSearchResponse {
  items?: YTSearchItem[];
  error?: { message: string };
}
interface YTStatsResponse {
  items?: Array<{ statistics: { viewCount: string } }>;
}

async function searchYouTube(nom: string, apiKey: string): Promise<string | null> {
  const queries = [
    `${nom} jeu de société règles présentation`,
    `${nom} jeu de société comment jouer`,
    `${nom} board game review`,
  ];

  for (const q of queries) {
    const params = new URLSearchParams({
      part: "snippet",
      q,
      type: "video",
      relevanceLanguage: "fr",
      maxResults: "5",
      key: apiKey,
    });

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const err = await res.json() as YTSearchResponse;
        throw new Error(err.error?.message ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as YTSearchResponse;
      const items = data.items ?? [];
      if (!items.length) continue;

      // Fetch view counts for the candidates
      const ids = items.map((i) => i.id.videoId).join(",");
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const statsData = statsRes.ok ? (await statsRes.json() as YTStatsResponse) : null;
      const statsItems = statsData?.items ?? [];

      // Build a map videoId → viewCount
      const views: Record<string, number> = {};
      for (const s of statsItems) {
        const id = (s as unknown as { id: string }).id;
        views[id] = parseInt(s.statistics.viewCount ?? "0", 10);
      }

      // Prefer a video with ≥1000 views; fall back to first result
      const sorted = items.sort((a, b) => (views[b.id.videoId] ?? 0) - (views[a.id.videoId] ?? 0));
      const best = sorted.find((v) => (views[v.id.videoId] ?? 0) >= 1000) ?? sorted[0];
      if (best) return best.id.videoId;
    } catch {
      continue;
    }
  }

  return null;
}

export async function POST(_: Request, { params }: Params) {
  const { slug } = await params;
  const apiKey = process.env.YOUTUBE_API_KEY ?? "";

  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY manquante dans .env.local" }, { status: 500 });
  }

  const sb = createServiceClient();
  const { data: jeu } = await sb.from("jeux").select("id, nom, youtube_id").eq("slug", slug).single();

  if (!jeu) return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });

  const row = jeu as unknown as { id: string; nom: string; youtube_id: string | null };

  const youtubeId = await searchYouTube(row.nom, apiKey);

  if (!youtubeId) {
    return NextResponse.json({ found: false, message: "Aucune vidéo trouvée" });
  }

  const { error } = await sb.from("jeux").update({ youtube_id: youtubeId }).eq("id", row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ found: true, youtube_id: youtubeId });
}
