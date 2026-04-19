# Veille quotidienne — Lokidia Games

Workflow automatisé déclenché par le cron `/api/cron/veille` (quotidien, 8h00 UTC).

## Déclenchement

```
GET /api/cron/veille
Authorization: Bearer $CRON_SECRET
```

Configurer dans Vercel Cron Jobs (`vercel.json`) :

```json
{
  "crons": [
    {
      "path": "/api/cron/veille",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Sources surveillées

### 1. BGG — Nouveautés
- **Outil** : `src/tools/fetch-bgg-nouveautes.ts`
- **Source** : `https://boardgamegeek.com/xmlapi2/search?query=2024&type=boardgame&sort=yearpublished`
- **Sortie** : 10 derniers jeux publiés avec bggId, nom, année

### 2. Reddit r/boardgames *(à implémenter)*
- **Source** : `https://www.reddit.com/r/boardgames/new.json?limit=10`
- **Filtres** : posts avec flair "News", "Kickstarter", "New Release"
- **Outil à créer** : `src/tools/fetch-reddit-boardgames.ts`

### 3. Philibert — Nouveautés *(à implémenter)*
- **Source** : `https://www.philibertnet.com/fr/nouveautes/` (scraping HTML)
- **Filtres** : jeux ajoutés dans les 7 derniers jours
- **Outil à créer** : `src/tools/fetch-philibert-nouveautes.ts`

## Pipeline prévu

```
fetchBggNouveautes()
  → filtrer les jeux déjà en base (par bgg_id ou nom normalisé)
  → enrichir via geekdo API (description, image, note)
  → traduire la description si en anglais (Claude Haiku)
  → upsert dans Supabase (actif = false par défaut, review manuelle)
  → notifier l'admin (email ou webhook)
```

## Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Token secret pour authentifier les appels cron |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase |
| `ANTHROPIC_API_KEY` | Pour la traduction Haiku |
