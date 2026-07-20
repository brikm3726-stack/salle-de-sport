-- ============================================================
--  MA SALLE — SCHÉMA DE LA BASE DE DONNÉES
-- ============================================================
--  Comment l'utiliser :
--  1. Ouvre ton projet sur https://supabase.com
--  2. Menu de gauche → "SQL Editor" → "New query"
--  3. Colle TOUT ce fichier, puis clique sur "Run"
-- ============================================================

-- ---------- PROFIL DU COACH ----------
-- Chaque coach = un utilisateur connecté (Google ou email).
create table if not exists coaches (
  id               uuid primary key references auth.users(id) on delete cascade,
  nom              text,
  prenom           text,
  telephone        text,
  nom_salle        text,
  nombre_athletes  int default 0,
  avatar_url       text,
  profil_complet   boolean default false,
  cree_le          timestamptz default now()
);

-- ---------- ATHLÈTES ----------
create table if not exists athletes (
  id                     uuid primary key default gen_random_uuid(),
  coach_id               uuid not null references auth.users(id) on delete cascade,
  nom                    text not null,
  prenom                 text not null,
  telephone              text,
  photo_url              text,
  date_paiement          date not null default current_date,
  date_prochain_paiement date not null,
  mois_consecutifs       int  default 1,
  bonus_actif            boolean default false,
  cree_le                timestamptz default now()
);

-- ---------- HISTORIQUE DES PAIEMENTS ----------
create table if not exists paiements (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid not null references athletes(id) on delete cascade,
  coach_id         uuid not null references auth.users(id) on delete cascade,
  date_paiement    date not null,
  date_fin         date not null,
  montant          numeric,
  mois_consecutifs int,
  bonus_applique   boolean default false,
  cree_le          timestamptz default now()
);

-- ============================================================
--  SÉCURITÉ (RLS) : chaque coach ne voit QUE ses données
-- ============================================================
alter table coaches  enable row level security;
alter table athletes enable row level security;
alter table paiements enable row level security;

-- Coaches : chacun gère sa propre fiche
drop policy if exists "coach lit son profil"  on coaches;
drop policy if exists "coach gere son profil" on coaches;
create policy "coach lit son profil"  on coaches for select using (auth.uid() = id);
create policy "coach gere son profil" on coaches for all    using (auth.uid() = id) with check (auth.uid() = id);

-- Athlètes : chacun gère les siens
drop policy if exists "coach gere ses athletes" on athletes;
create policy "coach gere ses athletes" on athletes for all
  using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- Paiements : idem
drop policy if exists "coach gere ses paiements" on paiements;
create policy "coach gere ses paiements" on paiements for all
  using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- ============================================================
--  CRÉATION AUTO DU PROFIL À L'INSCRIPTION
-- ============================================================
create or replace function public.creer_profil_coach()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.coaches (id, prenom, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.creer_profil_coach();

-- ============================================================
--  STOCKAGE DES PHOTOS
-- ============================================================
--  Crée aussi un bucket public "photos" :
--  Menu "Storage" → "New bucket" → nom: photos → coche "Public bucket".
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos lecture publique" on storage.objects;
drop policy if exists "photos envoi connecte"   on storage.objects;
create policy "photos lecture publique" on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos envoi connecte" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
