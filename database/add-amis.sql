-- Unique pseudo required for /profil/[pseudo] routing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_pseudo_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_pseudo_unique UNIQUE (pseudo);
  END IF;
END $$;

-- Amis table
CREATE TYPE IF NOT EXISTS amis_statut AS ENUM ('en_attente', 'accepte', 'refuse');

CREATE TABLE IF NOT EXISTS amis (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ami_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  statut     amis_statut NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ami_id),
  CHECK (user_id != ami_id)
);

CREATE INDEX IF NOT EXISTS amis_user_idx ON amis(user_id);
CREATE INDEX IF NOT EXISTS amis_ami_idx  ON amis(ami_id);

-- RLS
ALTER TABLE amis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amis_select_own" ON amis
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ami_id);

CREATE POLICY "amis_insert_own" ON amis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "amis_update_recipient" ON amis
  FOR UPDATE USING (auth.uid() = ami_id);   -- only recipient can accept/refuse

CREATE POLICY "amis_delete_sender" ON amis
  FOR DELETE USING (auth.uid() = user_id);  -- sender can cancel pending request

-- EAN column on jeux (for barcode scanner lookup)
ALTER TABLE jeux ADD COLUMN IF NOT EXISTS ean TEXT;
CREATE INDEX IF NOT EXISTS jeux_ean_idx ON jeux(ean);
