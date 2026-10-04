-- Relevé : notifications push (appliquée le 2026-10-04 via le connecteur Supabase).
-- Ré-exécutable sans risque après schema.sql.

-- Durcissement (conseillers de sécurité Supabase) : la fonction du déclencheur et la suppression de
-- compte ne sont pas des RPC publiques.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Un abonnement push par navigateur / appareil. Accessible uniquement par les deux RPC ci-dessous.
create table if not exists public.push_subscriptions (
  endpoint    text primary key check (endpoint like 'https://%' and length(endpoint) < 1000),
  p256dh      text not null check (length(p256dh) < 200),
  auth        text not null check (length(auth) < 100),
  user_id     uuid references auth.users (id) on delete cascade,
  topics      text[] not null default '{article,rush}' check (topics <@ array['article','rush']),
  markets     text[] not null default '{FR}' check (markets <@ array['FR','US'] and cardinality(markets) > 0),
  created_at  timestamptz not null default now(),
  failures    int not null default 0
);
alter table public.push_subscriptions enable row level security;   -- aucune politique : RPC + service role

create or replace function public.save_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text,
  p_topics text[] default '{article,rush}', p_markets text[] default '{FR}'
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.push_subscriptions (endpoint, p256dh, auth, user_id, topics, markets)
  values (p_endpoint, p_p256dh, p_auth, auth.uid(), p_topics, p_markets)
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh, auth = excluded.auth, topics = excluded.topics,
        markets = excluded.markets, user_id = coalesce(auth.uid(), public.push_subscriptions.user_id),
        failures = 0;
end $$;
revoke all on function public.save_push_subscription(text, text, text, text[], text[]) from public;
grant execute on function public.save_push_subscription(text, text, text, text[], text[]) to anon, authenticated;

-- Connaître l'endpoint (une URL secrète détenue par le navigateur) prouve la propriété.
create or replace function public.delete_push_subscription(p_endpoint text) returns void
language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;
revoke all on function public.delete_push_subscription(text) from public;
grant execute on function public.delete_push_subscription(text) to anon, authenticated;

-- Notifications déjà envoyées (un article, une ruée) : une relance n'en renvoie jamais.
create table if not exists public.push_events (
  id         text primary key,              -- 'article:2026-W42', 'rush:FR:jouets:pokémon:2026-10-12'
  sent_at    timestamptz not null default now(),
  recipients int not null default 0
);
alter table public.push_events enable row level security;          -- service role uniquement
