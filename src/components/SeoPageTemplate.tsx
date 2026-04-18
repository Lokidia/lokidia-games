import Link from "next/link";
import { SeoPage } from "@/lib/seo/types";

interface SeoPageTemplateProps {
  page: SeoPage;
}

export default function SeoPageTemplate({ page }: SeoPageTemplateProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-700 font-semibold mb-3">
          Guide de recommandation
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
        <h2 className="text-2xl font-bold text-amber-900 mb-5">Questions fréquentes</h2>
        <dl className="space-y-5">
          {page.faq.map((item) => (
            <div key={item.question}>
              <dt className="font-semibold text-stone-900 mb-1">{item.question}</dt>
              <dd className="text-stone-700 leading-7">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {(page.similarPages.length > 0 || page.internalLinks.length > 0) && (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {page.similarPages.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Pages similaires</h2>
              <ul className="space-y-2">
                {page.similarPages.map((item) => (
                  <li key={`${item.keyword}-${item.url}`}>
                    <Link
                      href={item.url}
                      className="text-amber-700 hover:text-amber-900 hover:underline text-sm font-medium transition-colors"
                    >
                      {item.keyword}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {page.internalLinks.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Aller plus loin</h2>
              <ul className="space-y-2">
                {page.internalLinks.map((href) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-amber-700 hover:text-amber-900 hover:underline text-sm font-medium transition-colors"
                    >
                      {href}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
