import { SeoGenerationInput } from "./types";

const OUTPUT_SCHEMA = `{
  "title": "string — 60 chars max",
  "meta": "string — 155 chars max",
  "url": "string — must start with /jeux/",
  "h1": "string",
  "intro": "string — 3 to 5 sentences, editorial paragraph about this game category",
  "sections": [
    { "h2": "string", "text": "string — 3-5 sentences" },
    { "h2": "string", "text": "string — 3-5 sentences" },
    { "h2": "string", "text": "string — 3-5 sentences" }
  ],
  "faq": [
    { "question": "string", "answer": "string — 2-3 sentences" },
    { "question": "string", "answer": "string — 2-3 sentences" },
    { "question": "string", "answer": "string — 2-3 sentences" }
  ],
  "similarPages": [
    { "keyword": "string", "url": "string — internal path starting with /jeux/" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" },
    { "keyword": "string", "url": "string" }
  ],
  "internalLinks": [
    "/jeux/example-1",
    "/jeux/example-2",
    "/jeux/example-3",
    "/jeux/example-4",
    "/jeux/example-5"
  ]
}`;

export function buildSeoPrompt(input: SeoGenerationInput): string {
  return `Tu es un expert SEO spécialisé dans les jeux de société.

Ta mission :
Créer une page SEO complète ET proposer des idées d’optimisation pour un site de recommandation de jeux de société.

CONTEXTE PAGE :
- Genre : ${input.genre}
- Nombre de joueurs : ${input.joueurs?.trim() || "non specifie"}
- Durée : ${input.duree?.trim() || "non specifie"}
- Niveau : ${input.niveau?.trim() || "non specifie"}
- Cible : ${input.cible?.trim() || "non specifie"}

OBJECTIFS :
1. Générer une page SEO optimisée
2. Proposer des idées de pages similaires pour le maillage interne
3. Générer des URLs SEO pertinentes

CONTRAINTES :
- Ton naturel, humain, non robotique
- Optimisé SEO mais sans sur-optimisation
- Pas de listes génériques inutiles
- Ne pas inventer de jeux précis
- Toujours rester pertinent pour un utilisateur qui cherche un jeu
- Title : 60 caractères maximum
- Meta description : 155 caractères maximum
- URL : doit commencer par /jeux/
- Il faut exactement 3 sections H2
- Il faut exactement 3 questions dans la FAQ
- Il faut exactement 10 similarPages
- Il faut exactement 5 internalLinks

IMPORTANT :
- Réponds UNIQUEMENT avec du JSON valide — aucun markdown, aucun bloc \`\`\`, aucun texte avant ou après
- Le JSON doit commencer exactement par { et se terminer par }
- internalLinks doit être un tableau de 5 chaînes de caractères (URLs internes), PAS d’objets
- L’URL finale canonique sera reconstruite côté application
- Respecte exactement ce schéma :
${OUTPUT_SCHEMA}`;
}
