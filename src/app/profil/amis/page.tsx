import Link from "next/link";
import SectionAmis from "@/components/profil/SectionAmis";

export default function AmisPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/profil?tab=amis" className="text-sm text-amber-700 hover:underline">← Mon profil</Link>
        <h1 className="text-2xl font-black text-amber-950 mt-1">Mes amis</h1>
      </div>
      <SectionAmis />
    </div>
  );
}
