-- Migration : ajout du champ position sur categories
-- Coller dans l'éditeur SQL de Supabase (https://supabase.com/dashboard → SQL Editor)

ALTER TABLE categories ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Initialise les positions en ordre alphabétique pour ne pas tout mettre à 0
UPDATE categories c
SET position = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY COALESCE(parent_id::text, '') ORDER BY nom) - 1 AS row_num
  FROM categories
) sub
WHERE c.id = sub.id;
