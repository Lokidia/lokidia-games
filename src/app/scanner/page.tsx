"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const ScannerCamera = dynamic(() => import("@/components/ScannerCamera"), { ssr: false });

export default function ScannerPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-amber-700 hover:underline">← Accueil</Link>
        <h1 className="text-2xl font-black text-amber-950 mt-2">Scanner un jeu 📷</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pointez votre caméra vers le code-barres EAN-13 d&apos;une boîte de jeu.
        </p>
      </div>
      <ScannerCamera />
    </div>
  );
}
