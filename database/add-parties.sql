-- Game sessions history
create table if not exists parties (
  id           uuid primary key default gen_random_uuid(),
  createur_id  uuid not null references auth.users(id) on delete cascade,
  jeu_id       uuid references jeux(id) on delete set null,
  date_partie  date not null default current_date,
  duree_minutes int,
  gagnant_id   uuid references auth.users(id) on delete set null,
  joueurs      uuid[] not null default '{}',
  notes        text,
  created_at   timestamptz default now()
);

alter table parties enable row level security;

-- Creator and participants can read
create policy "Participants can view parties"
  on parties for select
  using (
    auth.uid() = createur_id
    or auth.uid() = any(joueurs)
  );

-- Only creator can insert
create policy "Creator can insert parties"
  on parties for insert
  with check (auth.uid() = createur_id);

-- Only creator can update/delete
create policy "Creator can update parties"
  on parties for update
  using (auth.uid() = createur_id);

create policy "Creator can delete parties"
  on parties for delete
  using (auth.uid() = createur_id);

-- Index for fast lookups
create index if not exists parties_createur_idx on parties (createur_id);
create index if not exists parties_date_idx on parties (date_partie desc);
