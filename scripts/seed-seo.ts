import { loadEnvConfig } from "@next/env";

// Charge .env.local avant tout import qui utilise ANTHROPIC_API_KEY
loadEnvConfig(process.cwd());

import { getOrCreateSeoPage } from "../src/lib/seo/service";
import { findSeoPageByHash } from "../src/lib/seo/repository";
import { buildCanonicalSeoInput } from "../src/lib/seo/normalize";
import { SEO_TARGET_COMBINATIONS } from "../src/lib/seo/combinations";

async function main() {
  const total = SEO_TARGET_COMBINATIONS.length;
  console.log(`\n🌱 Seed SEO — ${total} combinaisons cibles\n${"─".repeat(50)}`);

  let generated = 0;
  let cached = 0;
  let errors = 0;

  for (let i = 0; i < SEO_TARGET_COMBINATIONS.length; i++) {
    const { label, input } = SEO_TARGET_COMBINATIONS[i];
    const canonical = buildCanonicalSeoInput(input);
    const existing = await findSeoPageByHash(canonical.inputHash);
    const prefix = `[${String(i + 1).padStart(2, "0")}/${total}]`;

    if (existing) {
      cached++;
      console.log(`${prefix} ⚡ [cache]   ${label}`);
      continue;
    }

    try {
      await getOrCreateSeoPage(input);
      generated++;
      console.log(`${prefix} ✅ [généré]  ${label}`);
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${prefix} ❌ [erreur]  ${label}\n         ${msg}`);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✔  ${generated} page(s) générée(s)`);
  console.log(`⚡  ${cached} page(s) depuis le cache`);
  if (errors > 0) console.log(`❌  ${errors} erreur(s)`);
  console.log();
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
