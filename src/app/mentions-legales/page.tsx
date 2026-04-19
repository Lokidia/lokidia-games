import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales — Lokidia Games",
  description: "Mentions légales du site Lokidia Games.",
  robots: { index: false },
};

export default function MentionsLegales() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-amber-700 hover:underline text-sm mb-8 inline-block">
        ← Retour à l&apos;accueil
      </Link>

      <h1 className="text-3xl font-black text-amber-900 mb-8">Mentions légales</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 flex flex-col gap-8 text-gray-700">

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">1. Éditeur du site</h2>
          <p className="text-sm leading-relaxed">
            Le site <strong>lokidia-games.fr</strong> est édité par :
          </p>
          <ul className="text-sm space-y-1 pl-4 border-l-2 border-amber-200">
            <li><strong>Nom :</strong> Mathieu Marousez</li>
            <li><strong>Statut :</strong> Particulier</li>
            <li><strong>Contact :</strong> <a href="mailto:mmarousez59@gmail.com" className="text-amber-700 hover:underline">mmarousez59@gmail.com</a></li>
            <li><strong>Site web :</strong> lokidia-games.fr</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">2. Hébergement</h2>
          <p className="text-sm leading-relaxed">Le site est hébergé par :</p>
          <ul className="text-sm space-y-3">
            <li className="pl-4 border-l-2 border-amber-200">
              <strong>Vercel Inc.</strong> (hébergement front-end)<br />
              340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis<br />
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">vercel.com</a>
            </li>
            <li className="pl-4 border-l-2 border-amber-200">
              <strong>Supabase Inc.</strong> (base de données)<br />
              970 Toa Payoh North, #07-04, Singapour<br />
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">supabase.com</a>
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">3. Propriété intellectuelle</h2>
          <p className="text-sm leading-relaxed">
            L&apos;ensemble du contenu de ce site (textes, images, fiches jeux) est la propriété de Mathieu Marousez ou de leurs auteurs respectifs et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
            Toute reproduction, distribution ou modification sans autorisation préalable est interdite.
          </p>
          <p className="text-sm leading-relaxed">
            Les images des jeux de société sont la propriété de leurs éditeurs respectifs.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">4. Liens affiliés</h2>
          <p className="text-sm leading-relaxed">
            Ce site participe au Programme Partenaires d&apos;Amazon EU, un programme d&apos;affiliation conçu pour permettre à des sites de percevoir une rémunération grâce à la création de liens vers Amazon.fr.
            Les liens vers Philibert peuvent également être des liens affiliés.
            Ces partenariats n&apos;influencent pas notre sélection de jeux ni nos avis.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">5. Limitation de responsabilité</h2>
          <p className="text-sm leading-relaxed">
            Les prix affichés sur ce site sont fournis à titre indicatif et peuvent varier. Lokidia Games ne saurait être tenu responsable des erreurs de prix, des ruptures de stock ou de tout préjudice lié à l&apos;utilisation de ces informations.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">6. Droit applicable</h2>
          <p className="text-sm leading-relaxed">
            Le présent site est soumis au droit français. Tout litige sera de la compétence exclusive des tribunaux français.
          </p>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          Dernière mise à jour : avril 2025
        </p>
      </div>
    </div>
  );
}
