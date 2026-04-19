const BGG_SEARCH_URL =
  "https://boardgamegeek.com/xmlapi2/search?query=2024&type=boardgame&sort=yearpublished";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/xml,text/xml,*/*",
};

export interface BggNouveaute {
  bggId: string;
  nom: string;
  annee: number | null;
}

export async function fetchBggNouveautes(): Promise<BggNouveaute[]> {
  const res = await fetch(BGG_SEARCH_URL, { headers: HEADERS });
  if (!res.ok) throw new Error(`BGG search returned HTTP ${res.status}`);

  const xml = await res.text();

  // Extract <item> entries
  const itemRegex = /<item\s+type="boardgame"\s+id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
  const nameRegex = /<name\s+type="primary"\s+[^>]*value="([^"]+)"/;
  const yearRegex = /<yearpublished\s+value="(\d+)"/;

  const results: BggNouveaute[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && results.length < 10) {
    const bggId = match[1];
    const block = match[2];

    const nomMatch = nameRegex.exec(block);
    const yearMatch = yearRegex.exec(block);

    const nom = nomMatch?.[1] ?? "(inconnu)";
    const annee = yearMatch ? parseInt(yearMatch[1], 10) : null;

    results.push({ bggId, nom, annee });
  }

  // Sort by most recent year first
  return results.sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0)).slice(0, 10);
}
