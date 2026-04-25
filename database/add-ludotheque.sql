-- Ludothèque (user game library)
CREATE TYPE IF NOT EXISTS ludotheque_statut AS ENUM ('possede', 'souhaite', 'joue');

CREATE TABLE IF NOT EXISTS ludotheque (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jeu_id     UUID NOT NULL REFERENCES jeux(id) ON DELETE CASCADE,
  statut     ludotheque_statut NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, jeu_id, statut)
);

CREATE INDEX IF NOT EXISTS ludotheque_user_idx ON ludotheque(user_id);
CREATE INDEX IF NOT EXISTS ludotheque_jeu_idx  ON ludotheque(jeu_id);

-- RLS
ALTER TABLE ludotheque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ludotheque_select_own" ON ludotheque
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ludotheque_insert_own" ON ludotheque
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ludotheque_delete_own" ON ludotheque
  FOR DELETE USING (auth.uid() = user_id);
