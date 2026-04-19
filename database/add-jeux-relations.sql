-- Table des relations entre jeux (extensions, jeux similaires, réimplantations)
CREATE TABLE IF NOT EXISTS jeux_relations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  jeu_id      UUID        NOT NULL REFERENCES jeux(id) ON DELETE CASCADE,
  jeu_lie_id  UUID        NOT NULL REFERENCES jeux(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('extension', 'similaire', 'reimplementation')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT jeux_relations_unique  UNIQUE (jeu_id, jeu_lie_id, type),
  CONSTRAINT jeux_relations_no_self CHECK  (jeu_id != jeu_lie_id)
);

CREATE INDEX IF NOT EXISTS jeux_relations_jeu_id_idx     ON jeux_relations(jeu_id);
CREATE INDEX IF NOT EXISTS jeux_relations_jeu_lie_id_idx ON jeux_relations(jeu_lie_id);
CREATE INDEX IF NOT EXISTS jeux_relations_type_idx       ON jeux_relations(type);

-- RLS : lecture publique, écriture via service_role uniquement
ALTER TABLE jeux_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jeux_relations_public_read"
  ON jeux_relations FOR SELECT USING (true);

CREATE POLICY "jeux_relations_service_write"
  ON jeux_relations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
