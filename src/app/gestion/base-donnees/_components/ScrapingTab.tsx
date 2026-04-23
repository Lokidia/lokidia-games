"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { ApifyProduct } from "@/app/api/admin/apify/search/route";

type ProductState = "new" | "in_jeux" | "in_staging" | "staged" | "staging" | "error";

interface ProductItem extends ApifyProduct {
  state: ProductState;
  stagingId?: string;
  doublonRef?: string;
}

const STATE_CONFIG: Record<ProductState, { label: string; badgeColor: string; disabled: boolean }> = {
  new:        { label: "Nouveau",       badgeColor: "bg-green-100 text-green-700 border border-green-200", disabled: false },
  in_jeux:    { label: "Déjà publié",   badgeColor: "bg-red-100 text-red-700 border border-red-200",       disabled: true  },
  in_staging: { label: "En staging",    badgeColor: "bg-orange-100 text-orange-700 border border-orange-200", disabled: true },
  staged:     { label: "Mis en staging",badgeColor: "bg-blue-100 text-blue-700 border border-blue-200",    disabled: true  },
  staging:    { label: "Envoi…",        badgeColor: "bg-purple-100 text-purple-700",                       disabled: true  },
  error:      { label: "Erreur ❌",     badgeColor: "bg-red-100 text-red-700",                             disabled: false },
};

const ASMODEE_BASE = "https://www.amazon.fr/s?me=A1X6FK5RDHNB96&marketplaceID=A13V1IB3VIYZZH";

const QUICK_SEARCHES_AMAZON = [
  { label: "🎲 Jeux de société",  url: "https://www.amazon.fr/s?rh=n%3A322086011&s=review-rank&language=fr_FR", maxItems: 20 },
  { label: "🏆 Top Bestsellers",  url: "https://www.amazon.fr/s?rh=n%3A322086011&s=review-rank&language=fr_FR", maxItems: 100 },
  { label: "♟️ Jeux stratégie",   url: "https://www.amazon.fr/s?k=jeux+strat%C3%A9gie&rh=n%3A322086011&language=fr_FR" },
  { label: "👨‍👩‍👧 Jeux familiaux",  url: "https://www.amazon.fr/s?k=famille&rh=n%3A322086011&language=fr_FR" },
  { label: "🎓 Jeux experts",     url: "https://www.amazon.fr/s?k=expert&rh=n%3A322086011&language=fr_FR" },
  { label: "🆕 Nouveautés 2025",  url: "https://www.amazon.fr/s?k=2025&rh=n%3A322086011&s=date-desc-rank&language=fr_FR" },
];

const QUICK_SEARCHES_ASMODEE = [
  { label: "🎲 Tous les jeux",    url: `${ASMODEE_BASE}&language=fr_FR`, maxItems: 20 },
  { label: "🆕 Nouveautés 2025",  url: `${ASMODEE_BASE}&k=2025&s=date-desc-rank&language=fr_FR` },
  { label: "👨‍👩‍👧 Jeux familiaux",  url: `${ASMODEE_BASE}&k=famille&language=fr_FR` },
  { label: "🎓 Jeux experts",     url: `${ASMODEE_BASE}&k=expert&language=fr_FR` },
];

function buildAmazonUrl(kw: string, source: "amazon" | "asmodee") {
  if (source === "asmodee") {
    return kw.trim()
      ? `${ASMODEE_BASE}&k=${encodeURIComponent(kw)}&language=fr_FR`
      : `${ASMODEE_BASE}&language=fr_FR`;
  }
  return `https://www.amazon.fr/s?k=${encodeURIComponent(kw + " jeu de société")}&rh=n%3A322086011&language=fr_FR`;
}

function ProductCard({ product, onStage }: { product: ProductItem; onStage: (p: ProductItem) => void }) {
  const { label, badgeColor, disabled } = STATE_CONFIG[product.state];

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${product.state === "in_jeux" || product.state === "in_staging" ? "opacity-70 border-gray-100" : "border-amber-100"}`}>
      <div className="relative w-full h-36 bg-gray-50 flex items-center justify-center">
        {product.image ? (
          <Image src={product.image} alt={product.nom} fill className="object-contain p-3" unoptimized />
        ) : (
          <span className="text-4xl opacity-20">🎲</span>
        )}
        <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {label}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.nom || "—"}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 gap-2 flex-wrap">
          {product.prix && <span className="font-bold text-amber-700">{product.prix}</span>}
          {product.asin && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{product.asin}</span>}
        </div>
        {product.url && (
          <a href={product.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline truncate">
            Voir sur Amazon ↗
          </a>
        )}
        <button
          onClick={() => onStage(product)}
          disabled={disabled}
          className={`w-full text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-amber-700 hover:bg-amber-800 text-white"
          }`}
        >
          {product.state === "staging"   ? "Envoi en cours…" :
           product.state === "staged"    ? "✅ En staging" :
           product.state === "in_jeux"   ? "Déjà dans la base" :
           product.state === "in_staging"? "Déjà en staging" :
           "→ Envoyer en staging"}
        </button>
      </div>
    </div>
  );
}

export default function ScrapingTab({ source }: { source: "amazon" | "asmodee" }) {
  const [keyword, setKeyword] = useState("");
  const [maxItems, setMaxItems] = useState(5);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; retrying: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const BATCH_SIZE = 5;
  const BATCH_DELAY_MS = 3000;

  function addPageToUrl(url: string, page: number): string {
    if (page <= 1) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}page=${page}`;
  }

  async function fetchBatch(amazonUrl: string, signal: AbortSignal): Promise<ApifyProduct[]> {
    const res = await fetch("/api/admin/apify/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amazonUrl, maxItems: BATCH_SIZE, source }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Erreur Apify");
    return (data.products ?? []) as ApifyProduct[];
  }

  const search = useCallback(async (kw: string, overrideUrl?: string, overrideMax?: number) => {
    if (!kw.trim() && !overrideUrl) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setStatus("loading");
    setErrorMsg("");
    setProducts([]);
    setBatchProgress(null);

    const limit = overrideMax ?? maxItems;
    const baseUrl = overrideUrl ?? buildAmazonUrl(kw, source);
    const isBatchMode = limit > BATCH_SIZE;
    const totalBatches = isBatchMode ? Math.ceil(limit / BATCH_SIZE) : 1;

    try {
      // Prefetch known ASINs in parallel with first batch
      const [jeuxAsinsRes, stagingRes] = await Promise.all([
        fetch("/api/admin/jeux/asins"),
        fetch("/api/admin/staging?limit=500"),
      ]);
      const [jeuxAsinsData, stagingData] = await Promise.all([
        jeuxAsinsRes.json(),
        stagingRes.json(),
      ]);
      const jeuxAsins = new Set<string>((jeuxAsinsData.asins ?? []) as string[]);
      const stagingAsins = new Set<string>(
        ((stagingData.items ?? []) as { asin: string | null }[])
          .map((i) => i.asin).filter(Boolean) as string[]
      );
      const seenAsins = new Set<string>();

      function classify(p: ApifyProduct): ProductItem {
        let state: ProductState = "new";
        if (p.asin && jeuxAsins.has(p.asin))      state = "in_jeux";
        else if (p.asin && stagingAsins.has(p.asin)) state = "in_staging";
        return { ...p, state };
      }

      if (!isBatchMode) {
        // Single request
        const amazonUrl = addPageToUrl(baseUrl, 1);
        const raw = await fetchBatch(amazonUrl, signal);
        setProducts(raw.map(classify));
        setStatus("done");
        return;
      }

      // Batch mode: sequential pages with delay + 1 retry
      for (let batch = 1; batch <= totalBatches; batch++) {
        if (signal.aborted) break;
        setBatchProgress({ current: batch, total: totalBatches, retrying: false });

        const amazonUrl = addPageToUrl(baseUrl, batch);
        let raw: ApifyProduct[] = [];

        try {
          raw = await fetchBatch(amazonUrl, signal);
        } catch (err) {
          if ((err as Error).name === "AbortError") break;
          // 1 retry
          setBatchProgress({ current: batch, total: totalBatches, retrying: true });
          await new Promise((r) => setTimeout(r, 2000));
          if (signal.aborted) break;
          try {
            raw = await fetchBatch(amazonUrl, signal);
          } catch {
            // skip this batch and continue
          }
        }

        // Deduplicate by ASIN
        const fresh = raw.filter((p) => !p.asin || !seenAsins.has(p.asin));
        fresh.forEach((p) => { if (p.asin) seenAsins.add(p.asin); });

        if (fresh.length > 0) {
          setProducts((prev) => [...prev, ...fresh.map(classify)]);
        }

        // If Apify returned fewer items than requested, no more pages
        if (raw.length < BATCH_SIZE) break;

        if (batch < totalBatches && !signal.aborted) {
          await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
        }
      }

      setBatchProgress(null);
      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setBatchProgress(null);
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }, [keyword, maxItems, source]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStage = useCallback(async (product: ProductItem) => {
    setProducts((prev) => prev.map((p) => p.asin === product.asin ? { ...p, state: "staging" } : p));
    try {
      const res = await fetch("/api/admin/staging/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: product.nom,
          asin: product.asin,
          prix: product.prix,
          image: product.image,
          url: product.url,
          source,
          data_brute: product,
        }),
      });
      const data = await res.json();
      setProducts((prev) => prev.map((p) =>
        p.asin === product.asin
          ? { ...p, state: "staged", stagingId: data.staging_id, doublonRef: data.doublon_ref ?? undefined }
          : p
      ));
    } catch {
      setProducts((prev) => prev.map((p) => p.asin === product.asin ? { ...p, state: "error" } : p));
    }
  }, [source]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400">Rapide :</span>
          {(source === "asmodee" ? QUICK_SEARCHES_ASMODEE : QUICK_SEARCHES_AMAZON).map(({ label, url, maxItems: qMax }) => (
            <button
              key={label}
              onClick={() => {
                setKeyword("");
                if (qMax) setMaxItems(qMax);
                search("", url, qMax);
              }}
              disabled={status === "loading"}
              className="px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors disabled:opacity-50">
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-52">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Mot-clé</label>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="ex: Wingspan, Catan…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              onKeyDown={(e) => e.key === "Enter" && search(keyword)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Résultats</label>
            <select value={maxItems} onChange={(e) => setMaxItems(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
              {[5, 10, 20, 30, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={() => search(keyword)} disabled={status === "loading" || !keyword.trim()}
            className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2">
            {status === "loading" ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>Recherche…</>
            ) : "🔍 Rechercher"}
          </button>
          {status === "loading" && (
            <button onClick={() => { abortRef.current?.abort(); setStatus("idle"); }}
              className="text-sm text-red-500 hover:text-red-700">Annuler</button>
          )}
        </div>
        {source === "asmodee" && (
          <p className="text-xs text-gray-400">Filtre Amazon : marque Asmodée uniquement.</p>
        )}
      </div>

      {/* Legend */}
      {status === "done" && (
        <div className="flex flex-wrap gap-2 text-xs">
          {(["new", "in_staging", "in_jeux"] as ProductState[]).map((s) => (
            <span key={s} className={`px-2 py-0.5 rounded-full font-medium ${STATE_CONFIG[s].badgeColor}`}>
              {STATE_CONFIG[s].label}
            </span>
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">❌ {errorMsg}</div>
      )}
      {status === "loading" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
          {batchProgress ? (
            <>
              <div className="flex items-center justify-between text-sm text-amber-800">
                <span className="font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {batchProgress.retrying
                    ? `Lot ${batchProgress.current}/${batchProgress.total} — nouvelle tentative…`
                    : `Lot ${batchProgress.current}/${batchProgress.total} en cours…`}
                </span>
                <span className="text-xs text-amber-600">
                  {Math.round((batchProgress.current - 1) / batchProgress.total * 100)}%
                </span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-700 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((batchProgress.current - 1) / batchProgress.total * 100)}%` }}
                />
              </div>
              {products.length > 0 && (
                <p className="text-xs text-amber-700 font-medium">{products.length} produit{products.length > 1 ? "s" : ""} trouvé{products.length > 1 ? "s" : ""} jusqu&apos;ici</p>
              )}
              <p className="text-xs text-amber-600">Pause de 3 s entre chaque lot pour éviter le blocage Amazon.</p>
            </>
          ) : (
            <div className="flex items-center gap-3 text-sm text-amber-800">
              <svg className="w-5 h-5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Chargement des ASINs existants et lancement du scraping…
            </div>
          )}
        </div>
      )}
      {status === "idle" && (
        <div className="bg-white rounded-xl border border-dashed border-amber-200 p-12 text-center">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="text-gray-500 text-sm">Lance une recherche pour voir les produits Amazon.</p>
        </div>
      )}
      {status === "done" && products.length === 0 && (
        <p className="text-center text-gray-400 py-8">Aucun produit retourné.</p>
      )}
      {status === "done" && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.asin || p.nom} product={p} onStage={handleStage} />
          ))}
        </div>
      )}
    </div>
  );
}
