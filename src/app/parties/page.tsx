import Link from "next/link";
import SectionParties from "@/components/profil/SectionParties";

export default function PartiesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/profil?tab=parties" className="text-sm text-amber-700 hover:underline">← Mon profil</Link>
        <h1 className="text-2xl font-black text-amber-950 mt-1">Historique des parties</h1>
      </div>
      <SectionParties />
    </div>
  );
}
