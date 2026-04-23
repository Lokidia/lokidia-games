-- Staging table for game imports from Apify / manual sources
CREATE TABLE IF NOT EXISTS jeux_staging (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nom            TEXT        NOT NULL,
  asin           TEXT,
  prix           TEXT,
  image_url      TEXT,
  url_amazon     TEXT,
  description_brute TEXT,
  source         TEXT        NOT NULL DEFAULT 'amazon'
                             CHECK (source IN ('amazon', 'asmodee', 'manuel')),
  statut         TEXT        NOT NULL DEFAULT 'en_attente'
                             CHECK (statut IN ('en_attente', 'approuve', 'rejete')),
  date_scraping  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_brute     JSONB,
  jeu_id         UUID        REFERENCES jeux(id) ON DELETE SET NULL,
  doublon_detecte BOOLEAN    NOT NULL DEFAULT false,
  doublon_ref    TEXT
);

CREATE INDEX IF NOT EXISTS jeux_staging_statut_idx ON jeux_staging (statut);
CREATE INDEX IF NOT EXISTS jeux_staging_asin_idx   ON jeux_staging (asin) WHERE asin IS NOT NULL;
CREATE INDEX IF NOT EXISTS jeux_staging_date_idx   ON jeux_staging (date_scraping DESC);

ALTER TABLE jeux_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON jeux_staging FOR ALL TO service_role USING (true) WITH CHECK (true);
