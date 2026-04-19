-- Migration : ajout du champ actif sur jeux et categories
-- Coller dans l'éditeur SQL de Supabase (https://supabase.com/dashboard → SQL Editor)

ALTER TABLE jeux       ADD COLUMN IF NOT EXISTS actif boolean NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS actif boolean NOT NULL DEFAULT true;
