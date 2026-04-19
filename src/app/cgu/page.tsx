import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Lokidia Games",
  description: "Conditions générales d'utilisation du site Lokidia Games.",
  robots: { index: false },
};

export default function CGU() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-amber-700 hover:underline text-sm mb-8 inline-block">
        ← Retour à l&apos;accueil
      </Link>

      <h1 className="text-3xl font-black text-amber-900 mb-8">Conditions Générales d&apos;Utilisation</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 flex flex-col gap-8 text-gray-700">

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">1. Objet</h2>
          <p className="text-sm leading-relaxed">
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation du site <strong>lokidia-games.fr</strong>, encyclopédie de jeux de société éditée par Mathieu Marousez.
            L&apos;utilisation du site implique l&apos;acceptation pleine et entière de ces CGU.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">2. Accès au service</h2>
          <p className="text-sm leading-relaxed">
            Le site est accessible gratuitement à tout utilisateur disposant d&apos;un accès à Internet.
            L&apos;éditeur se réserve le droit de modifier, suspendre ou interrompre l&apos;accès au site à tout moment et sans préavis.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">3. Prix indicatifs</h2>
          <p className="text-sm leading-relaxed">
            Les prix affichés sur Lokidia Games sont <strong>fournis à titre indicatif</strong> et sont susceptibles de varier à tout moment sans préavis.
            Ils sont récupérés auprès de boutiques partenaires et peuvent ne pas refléter le prix exact au moment de votre achat.
          </p>
          <p className="text-sm leading-relaxed">
            Lokidia Games ne garantit pas l&apos;exactitude des prix affichés et ne saurait être tenu responsable de toute différence entre le prix affiché et le prix réel pratiqué par les marchands.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">4. Liens affiliés — Amazon</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm leading-relaxed font-medium text-amber-900">
              🛒 Partenariat Amazon
            </p>
            <p className="text-sm leading-relaxed mt-2">
              En tant que Partenaire Amazon, Lokidia Games réalise un bénéfice sur les achats remplissant les conditions requises.
              Lorsque vous cliquez sur un lien Amazon présent sur ce site et effectuez un achat, nous percevons une commission sans que cela n&apos;entraîne de surcoût pour vous.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">5. Liens affiliés — Philibert et autres</h2>
          <p className="text-sm leading-relaxed">
            Ce site peut également contenir des liens affiliés vers d&apos;autres boutiques partenaires (Philibert, Cultura, Fnac).
            Ces partenariats sont clairement indiqués et permettent de financer le fonctionnement du site.
            Ils n&apos;influencent en aucun cas notre sélection de jeux ni nos recommandations.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">6. Propriété intellectuelle</h2>
          <p className="text-sm leading-relaxed">
            Le contenu éditorial du site (fiches jeux, descriptions, sélections) est protégé par le droit d&apos;auteur.
            Toute reproduction sans autorisation écrite préalable est interdite.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">7. Limitation de responsabilité</h2>
          <p className="text-sm leading-relaxed">
            Lokidia Games s&apos;efforce de fournir des informations exactes et à jour, mais ne peut garantir l&apos;exhaustivité ou l&apos;exactitude de tous les contenus.
            L&apos;éditeur décline toute responsabilité pour tout dommage direct ou indirect résultant de l&apos;utilisation du site.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">8. Modifications des CGU</h2>
          <p className="text-sm leading-relaxed">
            L&apos;éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont invités à les consulter régulièrement.
            La version en vigueur est celle publiée sur cette page.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">9. Droit applicable</h2>
          <p className="text-sm leading-relaxed">
            Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur exécution sera de la compétence exclusive des tribunaux français.
          </p>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          Dernière mise à jour : avril 2025
        </p>
      </div>
    </div>
  );
}
