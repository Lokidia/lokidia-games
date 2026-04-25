import Link from "next/link";
import SectionNotifications from "@/components/profil/SectionNotifications";

export default function NotificationsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/profil?tab=notifications" className="text-sm text-amber-700 hover:underline">← Mon profil</Link>
        <h1 className="text-2xl font-black text-amber-950 mt-1">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Recevez des alertes quand un ami ajoute un jeu ou vous invite à une partie.
        </p>
      </div>
      <SectionNotifications />
    </div>
  );
}
