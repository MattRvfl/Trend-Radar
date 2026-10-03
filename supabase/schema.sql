-- Relevé : comptes, newsletter et membres fondateurs.
-- À coller une fois dans Supabase → SQL Editor → Run. Ré-exécutable sans risque.

-- 1. Profil de chaque compte (créé automatiquement à la première connexion) ------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text not null,
  created_at            timestamptz not null default now(),
  -- Tous les inscrits avant le passage payant sont membres fondateurs → 1 an offert.
  -- Au lancement payant : alter column founding_member set default false, puis renseigner free_until.
  founding_member       boolean not null default true,
  free_until            date,
  newsletter            boolean not null default false,
  newsletter_consent_at timestamptz,          -- preuve de consentement (RGPD)
  unsubscribed_at       timestamptz,
  markets               text[] not null default '{FR}' check (markets <@ array['FR','US']),
  unsubscribe_token     uuid not null unique default gen_random_uuid()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Un utilisateur ne peut modifier que ses préférences, jamais son statut fondateur ni ses dates.
revoke update on public.profiles from authenticated, anon;
grant update (newsletter, markets) on public.profiles to authenticated;

-- 2. Création du profil à l'inscription ------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Horodatage du consentement / de la désinscription ---------------------------------------
create or replace function public.track_newsletter_consent() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.newsletter and not old.newsletter then
    new.newsletter_consent_at := now();
    new.unsubscribed_at := null;
  elsif old.newsletter and not new.newsletter then
    new.unsubscribed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists on_newsletter_change on public.profiles;
create trigger on_newsletter_change before update of newsletter on public.profiles
  for each row execute function public.track_newsletter_consent();

-- 4. Désinscription en un clic depuis l'e-mail (sans être connecté) ---------------------------
create or replace function public.unsubscribe(token uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.profiles set newsletter = false
   where unsubscribe_token = token and newsletter;
  get diagnostics n = row_count;
  return n > 0 or exists (select 1 from public.profiles where unsubscribe_token = token);
end $$;
revoke all on function public.unsubscribe(uuid) from public;
grant execute on function public.unsubscribe(uuid) to anon, authenticated;

-- 5. Droit à l'effacement (RGPD) : l'utilisateur supprime son compte lui-même ------------------
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();   -- le profil suit (on delete cascade)
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- 6. Numéros de newsletter déjà envoyés (évite tout double envoi si le robot est relancé) ------
create table if not exists public.newsletter_issues (
  id          text primary key,            -- ex. '2026-W42'
  sent_at     timestamptz not null default now(),
  recipients  int not null default 0
);
alter table public.newsletter_issues enable row level security;   -- aucune politique : service role uniquement
