-- ============================================================
-- Lokidia Games — Schéma Supabase
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================


-- ============================================================
-- 0. Extensions
-- ============================================================

-- pgcrypto : gen_random_uuid() (dispo nativement en PG13+, garde pour compatibilité)
create extension if not exists pgcrypto;


-- ============================================================
-- 1. Types énumérés
-- ============================================================

do $$ begin
  create type complexite_level as enum (
    'Très simple',
    'Simple',
    'Intermédiaire',
    'Complexe',
    'Expert'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type marchand_type as enum ('amazon', 'philibert', 'cultura', 'fnac');
exception when duplicate_object then null; end $$;

do $$ begin
  create type seo_status as enum ('generated', 'published', 'draft', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_type as enum ('group', 'category', 'tag');
exception when duplicate_object then null; end $$;


-- ============================================================
-- 2. Fonction utilitaire : mise à jour automatique de updated_at
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 3. Table : jeux
-- ============================================================

create table if not exists jeux (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  nom         text        not null,
  annee       smallint    not null,
  description text        not null,
  joueurs_min smallint    not null check (joueurs_min >= 1),
  joueurs_max smallint    not null check (joueurs_max >= joueurs_min),
  duree_min   smallint    not null check (duree_min >= 0),
  duree_max   smallint    not null check (duree_max >= duree_min),
  age_min     smallint    not null check (age_min >= 0),
  complexite  complexite_level not null,
  note        numeric(3,1) not null check (note >= 0 and note <= 10),
  mecaniques  text[]      not null default '{}',
  regles      text[]      not null default '{}',
  image_url   text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists jeux_slug_idx       on jeux (slug);
create index if not exists jeux_complexite_idx on jeux (complexite);
create index if not exists jeux_note_idx       on jeux (note desc);
create index if not exists jeux_annee_idx      on jeux (annee desc);

-- Recherche plein texte (nom + description)
create index if not exists jeux_fts_idx on jeux
  using gin (to_tsvector('french', nom || ' ' || description));

drop trigger if exists jeux_updated_at on jeux;
create trigger jeux_updated_at
  before update on jeux
  for each row execute function set_updated_at();


-- ============================================================
-- 4. Table : jeux_prix  (une ligne par marchand par jeu)
-- ============================================================

create table if not exists jeux_prix (
  id        uuid         primary key default gen_random_uuid(),
  jeu_id    uuid         not null references jeux(id) on delete cascade,
  marchand  marchand_type not null,
  url       text         not null,
  prix      text         not null,          -- format "34,95€" tel que stocké
  unique (jeu_id, marchand)
);

create index if not exists jeux_prix_jeu_id_idx on jeux_prix (jeu_id);


-- ============================================================
-- 5. Table : categories  (arborescence méga menu, parent_id null = racine)
-- ============================================================

create table if not exists categories (
  id         uuid          primary key default gen_random_uuid(),
  slug       text          not null unique,
  nom        text          not null,
  parent_id  uuid          references categories(id) on delete cascade,
  position   smallint      not null default 0,
  type       category_type not null default 'category',
  created_at timestamptz   not null default now()
);

create index if not exists categories_parent_id_idx on categories (parent_id);
create index if not exists categories_slug_idx      on categories (slug);


-- ============================================================
-- 6. Table : jeux_categories  (table de liaison N×N)
-- ============================================================

create table if not exists jeux_categories (
  jeu_id       uuid not null references jeux(id)       on delete cascade,
  categorie_id uuid not null references categories(id) on delete cascade,
  primary key (jeu_id, categorie_id)
);

create index if not exists jeux_categories_jeu_id_idx       on jeux_categories (jeu_id);
create index if not exists jeux_categories_categorie_id_idx on jeux_categories (categorie_id);


-- ============================================================
-- 7. Table : seo_pages  (migration de data/seo-pages.json)
-- ============================================================

create table if not exists seo_pages (
  input_hash   text        primary key,
  slug         text        not null unique,
  payload_json jsonb       not null,
  status       seo_status  not null default 'generated',
  generated_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists seo_pages_status_idx      on seo_pages (status);
create index if not exists seo_pages_generated_at_idx on seo_pages (generated_at desc);
create index if not exists seo_pages_url_idx
  on seo_pages ((payload_json->>'url'));

drop trigger if exists seo_pages_updated_at on seo_pages;
create trigger seo_pages_updated_at
  before update on seo_pages
  for each row execute function set_updated_at();


-- ============================================================
-- 8. Row Level Security
-- ============================================================

alter table jeux            enable row level security;
alter table jeux_prix       enable row level security;
alter table categories      enable row level security;
alter table jeux_categories enable row level security;
alter table seo_pages       enable row level security;

-- Lecture publique (site en accès libre)
create policy "jeux_select_public"
  on jeux for select using (true);

create policy "jeux_prix_select_public"
  on jeux_prix for select using (true);

create policy "categories_select_public"
  on categories for select using (true);

create policy "jeux_categories_select_public"
  on jeux_categories for select using (true);

-- Seules les pages SEO publiées sont lisibles publiquement
create policy "seo_pages_select_public"
  on seo_pages for select
  using (status in ('generated', 'published'));

-- Écriture réservée au service role (clé secrète côté API Next.js)
-- → pas de politique INSERT/UPDATE/DELETE publique : Supabase service_role bypass RLS


-- ============================================================
-- 9. Seed : catégories du méga menu
-- ============================================================

-- Groupes de premier niveau
insert into categories (slug, nom, type, position) values
  ('genres',          'Genres',          'group', 0),
  ('primes',          'Les primés',       'group', 1),
  ('idees-cadeaux',   'Idées cadeaux',    'group', 2),
  ('mieux-notes',     'Les mieux notés',  'group', 3),
  ('par-joueurs',     'Par joueurs',      'group', 4),
  ('duree',           'Durée',            'group', 5),
  ('nouveautes',      'Nouveautés',       'group', 6),
  ('themes',          'Thèmes',           'group', 7)
on conflict (slug) do nothing;

-- Sous-catégories : Genres
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'category'::category_type, v.pos, c.id
from categories c,
     (values
       ('strategie',   'Stratégie',  0),
       ('cooperatif',  'Coopératif', 1),
       ('familial',    'Familial',   2),
       ('ambiance',    'Ambiance',   3),
       ('cartes',      'Cartes',     4),
       ('des',         'Dés',        5)
     ) as v(slug, nom, pos)
where c.slug = 'genres'
on conflict (slug) do nothing;

-- Sous-catégories : Les primés
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'category'::category_type, v.pos, c.id
from categories c,
     (values
       ('spiel-des-jahres', 'Spiel des Jahres', 0),
       ('as-dor',           'As d''Or',          1),
       ('prix-urus',        'Prix Urus',         2)
     ) as v(slug, nom, pos)
where c.slug = 'primes'
on conflict (slug) do nothing;

-- Sous-catégories : Idées cadeaux
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'category'::category_type, v.pos, c.id
from categories c,
     (values
       ('moins-de-20-euros', 'Moins de 20€',  0),
       ('pour-enfants',      'Pour enfants',  1),
       ('pour-gamers',       'Pour gamers',   2),
       ('en-couple',         'En couple',     3)
     ) as v(slug, nom, pos)
where c.slug = 'idees-cadeaux'
on conflict (slug) do nothing;

-- Sous-catégories : Les mieux notés
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'category'::category_type, v.pos, c.id
from categories c,
     (values
       ('top-10-general', 'Top 10 général', 0),
       ('top-famille',    'Top Famille',    1),
       ('top-expert',     'Top Expert',     2)
     ) as v(slug, nom, pos)
where c.slug = 'mieux-notes'
on conflict (slug) do nothing;

-- Sous-catégories : Par joueurs
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'category'::category_type, v.pos, c.id
from categories c,
     (values
       ('solo',         'Solo',             0),
       ('a-2',          'À 2',              1),
       ('a-5-plus',     'Entre amis (5+)',  2),
       ('grande-tablee','Grande tablée',    3)
     ) as v(slug, nom, pos)
where c.slug = 'par-joueurs'
on conflict (slug) do nothing;

-- Sous-catégories : Durée
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'category'::category_type, v.pos, c.id
from categories c,
     (values
       ('apero',   'Apéro (< 15 min)', 0),
       ('soiree',  'Soirée (1-2h)',    1),
       ('marathon','Marathon (3h+)',   2)
     ) as v(slug, nom, pos)
where c.slug = 'duree'
on conflict (slug) do nothing;

-- Sous-catégories : Nouveautés (tags)
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'tag'::category_type, v.pos, c.id
from categories c,
     (values
       ('sorties-2024', 'Sorties 2024', 0),
       ('kickstarter',  'Kickstarter',  1),
       ('tendances',    'Tendances',    2)
     ) as v(slug, nom, pos)
where c.slug = 'nouveautes'
on conflict (slug) do nothing;

-- Sous-catégories : Thèmes (tags)
insert into categories (slug, nom, type, position, parent_id)
select v.slug, v.nom, 'tag'::category_type, v.pos, c.id
from categories c,
     (values
       ('medieval',       'Médiéval',       0),
       ('science-fiction','Science-fiction', 1),
       ('nature',         'Nature',          2),
       ('enquete',        'Enquête',         3)
     ) as v(slug, nom, pos)
where c.slug = 'themes'
on conflict (slug) do nothing;


-- ============================================================
-- 10. Vue utilitaire : jeux avec catégories (tableau aplati)
-- ============================================================

create or replace view jeux_avec_categories as
select
  j.id,
  j.slug,
  j.nom,
  j.annee,
  j.complexite,
  j.note,
  j.joueurs_min,
  j.joueurs_max,
  j.duree_min,
  j.duree_max,
  j.age_min,
  j.image_url,
  coalesce(
    array_agg(cat.nom order by cat.nom) filter (where cat.id is not null),
    '{}'::text[]
  ) as categories
from jeux j
left join jeux_categories jc on jc.jeu_id = j.id
left join categories cat     on cat.id = jc.categorie_id
group by j.id;


-- ============================================================
-- 11. Requête de migration : data/seo-pages.json → seo_pages
-- ============================================================
-- Exécuter depuis un script Node.js avec le contenu du fichier JSON :
--
--   const records = JSON.parse(fs.readFileSync('data/seo-pages.json', 'utf8'));
--   for (const r of records) {
--     await supabase.from('seo_pages').upsert({
--       input_hash:   r.input_hash,
--       slug:         r.slug,
--       payload_json: r.payload_json,
--       status:       r.status,
--       generated_at: r.generated_at,
--       updated_at:   r.updated_at,
--     }, { onConflict: 'input_hash' });
--   }
