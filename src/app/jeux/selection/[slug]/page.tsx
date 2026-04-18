import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeoPageBySlug } from "@/lib/seo/service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const record = await getSeoPageBySlug(slug);

  if (!record) {
    return {
      title: "Page SEO introuvable",
    };
  }

  return {
    title: record.payload_json.title,
    description: record.payload_json.meta,
    alternates: {
      canonical: record.payload_json.url,
    },
    openGraph: {
      title: record.payload_json.title,
      description: record.payload_json.meta,
      url: record.payload_json.url,
      locale: "fr_FR",
      type: "article",
    },
  };
}

export default async function SeoSelectionPage({ params }: PageProps) {
  const { slug } = await params;
  const record = await getSeoPageBySlug(slug);

  if (!record) {
    notFound();
  }

  const page = record.payload_json;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-700 font-semibold mb-3">
          Selection SEO
        </p>
        <h1 className="text-4xl font-black text-amber-950 mb-4">{page.h1}</h1>
        <p className="text-lg text-stone-700 leading-8">{page.intro}</p>
      </header>

      <div className="space-y-10">
        {page.sections.map((section) => (
          <section key={section.h2} className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-amber-900 mb-3">{section.h2}</h2>
            <p className="text-stone-700 leading-7">{section.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-10 bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-amber-900 mb-5">FAQ</h2>
        <div className="space-y-5">
          {page.faq.map((item) => (
            <div key={item.question}>
              <h3 className="font-semibold text-stone-900 mb-1">{item.question}</h3>
              <p className="text-stone-700 leading-7">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Pages similaires</h2>
          <ul className="space-y-3">
            {page.similarPages.map((item) => (
              <li key={`${item.keyword}-${item.url}`} className="text-stone-700">
                <span className="font-semibold">{item.keyword}</span>
                <span className="text-stone-400"> - </span>
                <span className="text-amber-700">{item.url}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Maillage interne</h2>
          <ul className="space-y-3">
            {page.internalLinks.map((item) => (
              <li key={item} className="text-amber-700">{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
