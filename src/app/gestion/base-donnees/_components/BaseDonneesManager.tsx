"use client";

import { useState } from "react";
import ScrapingTab from "./ScrapingTab";
import StagingTab from "./StagingTab";

type MainTab = "amazon" | "asmodee" | "staging";

export default function BaseDonneesManager() {
  const [tab, setTab] = useState<MainTab>("amazon");

  const TAB = (t: MainTab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
        tab === t ? "bg-amber-700 text-white" : "text-gray-600 hover:bg-amber-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-amber-950">Base de données</h1>
        <p className="text-sm text-gray-500 mt-1">
          Scrapez Amazon via Apify, envoyez en staging, puis publiez les jeux enrichis par Claude.
        </p>
      </div>

      <div className="flex gap-2 bg-white rounded-xl border border-amber-100 p-1.5 w-fit">
        {TAB("amazon",  "🛒 Amazon (Apify)")}
        {TAB("asmodee", "🏢 Boutique Asmodée")}
        {TAB("staging", "📋 Staging")}
      </div>

      {tab === "amazon"  && <ScrapingTab source="amazon" />}
      {tab === "asmodee" && <ScrapingTab source="asmodee" />}
      {tab === "staging" && <StagingTab />}
    </div>
  );
}
