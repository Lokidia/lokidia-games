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
  new:        { label: "Nouveau",        badgeColor: "bg-green-100 text-green-700 border border-green-200",     disabled: false },
  in_jeux:    { label: "Déjà publié",    badgeColor: "bg-red-100 text-red-700 border border-red-200",           disabled: true  },
  in_staging: { label: "En staging",     badgeColor: "bg-orange-100 text-orange-700 border border-orange-200", disabled: true  },
  staged:     { label: "Mis en staging", badgeColor: "bg-blue-100 text-blue-700 border border-blue-200",        disabled: true  },
  staging:    { label: "Envoi…",         badgeColor: "bg-purple-100 text-purple-700",                           disabled: true  },
  error:      { label: "Erreur ❌",      badgeColor: "bg-red-100 text-red-700",                                 disabled: false },
};

const ASMODEE_BASE = "https://www.amazon.fr/s?me=A1X6FK5RDHNB96&marketplaceID=A13V1IB3VIYZZH";
const POPULAR_QUERIES = [
  "meilleures ventes jeux de société",
  "jeux de société populaires famille",
  "jeux de société stratégie populaires",
  "nouveautés jeux de société",
];

const SCORE_BADGE: Record<ApifyProduct["scoreLabel"], string> = {
  excellent: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  bon: "bg-blue-100 text-blue-700 border border-blue-200",
  moyen: "bg-amber-100 text-amber-700 border border-amber-200",
};

function buildAmazonUrl(nom: string, source: "amazon" | "asmodee"): string {
  if (source === "asmodee") {
    return `${ASMODEE_BASE}&k=${encodeURIComponent(nom)}&language=fr_FR`;
  }
  return `https://www.amazon.fr/s?k=${encodeURIComponent(nom + " jeu de société")}&language=fr_FR`;
}

function ProductCard({ product, onStage }: { product: ProductItem; onStage: (p: ProductItem) => void }) {
  const { label, badgeColor, disabled } = STATE_CONFIG[product.state];

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${disabled && product.state !== "staged" ? "opacity-60 border-gray-100" : "border-amber-100"}`}>
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
          <span className={`px-1.5 py-0.5 rounded-full font-semibold ${SCORE_BADGE[product.scoreLabel]}`}>
            {product.score}/100
          </span>
        </div>
        {(product.rating || product.reviewsCount) && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {product.rating && <span>{product.rating.toFixed(1)}/5</span>}
            {product.reviewsCount && <span>{product.reviewsCount} avis</span>}
          </div>
        )}
        {product.raisons.length > 0 && (
          <p className="text-[11px] text-emerald-700 line-clamp-2">
            {product.raisons.slice(0, 3).join(" • ")}
          </p>
        )}
        {product.alertes.length > 0 && (
          <p className="text-[11px] text-orange-600 line-clamp-2">
            {product.alertes.join(" • ")}
          </p>
        )}
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
          {product.state === "staging"    ? "Envoi en cours…"       :
           product.state === "staged"     ? "✅ En staging"         :
           product.state === "in_jeux"    ? "Déjà dans la base"     :
           product.state === "in_staging" ? "Déjà en staging"       :
           "→ Envoyer en staging"}
        </button>
      </div>
    </div>
  );
}

export default function ScrapingTab({ source }: { source: "amazon" | "asmodee" }) {
  const [nom, setNom] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async () => {
    if (!nom.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setStatus("loading");
    setErrorMsg("");
    setProducts([]);

    const amazonUrl = buildAmazonUrl(nom.trim(), source);

    try {
      const [apifyRes, jeuxAsinsRes, stagingRes] = await Promise.all([
        fetch("/api/admin/apify/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amazonUrl, query: nom.trim(), maxItems: 20, source }),
          signal,
        }),
        fetch("/api/admin/jeux/asins"),
        fetch("/api/admin/staging?limit=500"),
      ]);

      const [apifyData, jeuxAsinsData, stagingData] = await Promise.all([
        apifyRes.json(),
        jeuxAsinsRes.json(),
        stagingRes.json(),
      ]);

      if (!apifyRes.ok) throw new Error(apifyData.error ?? "Erreur inconnue");

      const jeuxAsins = new Set<string>((jeuxAsinsData.asins ?? []) as string[]);
      const stagingAsins = new Set<string>(
        ((stagingData.items ?? []) as { asin: string | null }[])
          .map((i) => i.asin).filter(Boolean) as string[]
      );

      const items: ProductItem[] = (apifyData.products as ApifyProduct[]).map((p) => {
        let state: ProductState = "new";
        if (p.asin && jeuxAsins.has(p.asin))        state = "in_jeux";
        else if (p.asin && stagingAsins.has(p.asin)) state = "in_staging";
        return { ...p, state };
      });

      setProducts(items);
      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }, [nom, source]);

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
          description: product.raisons.join(" • "),
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
      {/* Search */}
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5 flex flex-col gap-3 max-w-lg">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Nom du jeu</label>
          <p className="text-xs text-gray-400 mb-2">
            Tapez un jeu, une catégorie ou une recherche populaire. Les accessoires et faux positifs sont filtrés.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={source === "asmodee" ? "ex: Catan, Wingspan…" : "ex: Catan, Pandemic, Wingspan…"}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              onKeyDown={(e) => e.key === "Enter" && search()}
              autoFocus
            />
            <button
              onClick={search}
              disabled={status === "loading" || !nom.trim()}
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2 shrink-0"
            >
              {status === "loading" ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : "🔍"}
              Rechercher
            </button>
            {status === "loading" && (
              <button
                onClick={() => { abortRef.current?.abort(); setStatus("idle"); }}
                className="text-sm text-red-500 hover:text-red-700 transition-colors shrink-0"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
        {source === "asmodee" && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            🏢 Recherche limitée à la boutique officielle Asmodée sur Amazon.fr
          </p>
        )}
        {source === "amazon" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => setNom(query)}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">❌ {errorMsg}</div>
      )}

      {status === "loading" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-3">
          <svg className="w-5 h-5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Recherche Amazon en cours — peut prendre 30 à 90 secondes…
        </div>
      )}

      {status === "idle" && (
        <div className="bg-white rounded-xl border border-dashed border-amber-200 p-10 text-center max-w-lg">
          <span className="text-3xl block mb-2">🎲</span>
          <p className="text-gray-500 text-sm">Entrez le nom d&apos;un jeu et lancez la recherche.</p>
        </div>
      )}

      {status === "done" && products.length === 0 && (
        <p className="text-gray-400 text-sm py-4">Aucun résultat trouvé pour &quot;{nom}&quot;.</p>
      )}

      {status === "done" && products.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            {(["new", "in_staging", "in_jeux"] as ProductState[]).map((s) => (
              <span key={s} className={`px-2 py-0.5 rounded-full font-medium ${STATE_CONFIG[s].badgeColor}`}>
                {STATE_CONFIG[s].label}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
              triés par pertinence
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard key={p.asin || p.nom} product={p} onStage={handleStage} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
