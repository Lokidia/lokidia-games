import { SeoGenerationInput } from "./types";

const OUTPUT_SCHEMA = `{
  "title": "",
  "meta": "",
  "url": "",
  "h1": "",
  "intro": "",
  "sections": [
    { "h2": "", "text": "" },
    { "h2": "", "text": "" },
    { "h2": "", "text": "" }
  ],
  "faq": [
    { "question": "", "answer": "" },
    { "question": "", "answer": "" },
    { "question": "", "answer": "" }
  ],
  "similarPages": [
    { "keyword": "", "url": "" }
  ],
  "internalLinks": []
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
- Réponds uniquement avec un JSON valide
- N’ajoute aucun markdown
- N’ajoute aucun texte avant ou après le JSON
- L'URL finale canonique sera reconstruite côté application, donc propose une URL cohérente mais simple
- Respecte exactement ce schéma :
${OUTPUT_SCHEMA}`;
}
