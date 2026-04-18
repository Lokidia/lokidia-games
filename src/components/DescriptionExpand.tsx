"use client";

import { useState } from "react";

const LIMIT = 500;

export default function DescriptionExpand({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= LIMIT) {
    return <p className="text-gray-700 text-lg leading-relaxed">{text}</p>;
  }

  return (
    <div>
      <p className="text-gray-700 text-lg leading-relaxed">
        {expanded ? text : `${text.slice(0, LIMIT).trimEnd()}…`}
      </p>
      <button
        onClick={() => setExpanded(e => !e)}
        className="mt-2 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
      >
        {expanded ? "Lire moins ↑" : "Lire plus ↓"}
      </button>
    </div>
  );
}
