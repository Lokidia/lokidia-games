import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Lokidia Games",
  description: "Politique de confidentialité et protection des données personnelles de Lokidia Games.",
  robots: { index: false },
};

export default function Confidentialite() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-amber-700 hover:underline text-sm mb-8 inline-block">
        ← Retour à l&apos;accueil
      </Link>

      <h1 className="text-3xl font-black text-amber-900 mb-8">Politique de confidentialité</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 flex flex-col gap-8 text-gray-700">

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">1. Responsable du traitement</h2>
          <p className="text-sm leading-relaxed">
            Le responsable du traitement des données personnelles collectées via le site <strong>lokidia-games.fr</strong> est :
            Mathieu Marousez, joignable à <a href="mailto:mmarousez59@gmail.com" className="text-amber-700 hover:underline">mmarousez59@gmail.com</a>.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">2. Données collectées</h2>
          <p className="text-sm leading-relaxed">
            <strong>Lokidia Games ne collecte aucune donnée personnelle sans votre consentement explicite.</strong>
          </p>
          <p className="text-sm leading-relaxed">
            Le site peut collecter les données suivantes uniquement si vous les fournissez volontairement :
          </p>
          <ul className="text-sm list-disc pl-6 space-y-1">
            <li>Adresse e-mail (si vous utilisez le formulaire de contact ou la newsletter)</li>
          </ul>
          <p className="text-sm leading-relaxed">
            Ces données sont utilisées uniquement pour répondre à vos demandes et ne sont jamais revendues à des tiers.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">3. Cookies</h2>
          <p className="text-sm leading-relaxed">
            Ce site utilise exclusivement des <strong>cookies techniques</strong> nécessaires à son fonctionnement :
          </p>
          <ul className="text-sm list-disc pl-6 space-y-1">
            <li><strong>cookie-consent</strong> — mémorise votre choix concernant les cookies (durée : 1 an)</li>
            <li><strong>Cookies de session Supabase</strong> — authentification espace administrateur uniquement</li>
          </ul>
          <p className="text-sm leading-relaxed">
            Aucun cookie publicitaire ou de traçage tiers (Google Analytics, Facebook Pixel, etc.) n&apos;est utilisé sur ce site.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">4. Liens affiliés et tiers</h2>
          <p className="text-sm leading-relaxed">
            Ce site contient des liens vers des boutiques partenaires (Amazon, Philibert, Cultura, Fnac).
            En cliquant sur ces liens, vous quittez notre site et êtes soumis à la politique de confidentialité de ces tiers.
            Lokidia Games ne contrôle pas les pratiques de ces sites et décline toute responsabilité à leur égard.
          </p>
          <p className="text-sm leading-relaxed">
            Les liens Amazon sont des liens affiliés dans le cadre du Programme Partenaires Amazon EU.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">5. Vos droits RGPD</h2>
          <p className="text-sm leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679),
            vous disposez des droits suivants :
          </p>
          <ul className="text-sm list-disc pl-6 space-y-1">
            <li><strong>Droit d&apos;accès</strong> — connaître les données vous concernant</li>
            <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
            <li><strong>Droit à l&apos;effacement</strong> — demander la suppression de vos données</li>
            <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong>Droit d&apos;opposition</strong> — vous opposer au traitement de vos données</li>
          </ul>
          <p className="text-sm leading-relaxed">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:mmarousez59@gmail.com" className="text-amber-700 hover:underline">mmarousez59@gmail.com</a>
          </p>
          <p className="text-sm leading-relaxed">
            Vous avez également le droit d&apos;introduire une réclamation auprès de la{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">CNIL</a> (Commission Nationale de l&apos;Informatique et des Libertés).
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-amber-900">6. Sécurité</h2>
          <p className="text-sm leading-relaxed">
            Les données sont hébergées sur des serveurs sécurisés (Vercel Inc. et Supabase Inc.) avec chiffrement HTTPS.
            Nous mettons en œuvre les mesures techniques appropriées pour protéger vos données contre tout accès non autorisé.
          </p>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          Dernière mise à jour : avril 2025
        </p>
      </div>
    </div>
  );
}
