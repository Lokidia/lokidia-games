export const SEO_PAGES_TABLE_SQL = `
create table if not exists seo_pages (
  input_hash text primary key,
  slug text not null unique,
  payload_json jsonb not null,
  status text not null check (status in ('generated', 'published', 'draft', 'archived')),
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_pages_status_idx on seo_pages (status);
create index if not exists seo_pages_generated_at_idx on seo_pages (generated_at desc);
`.trim();
