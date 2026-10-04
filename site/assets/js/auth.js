// Comptes (Supabase Auth, flux PKCE). La bibliothèque n'est chargée (import dynamique) que si config.js
// est renseigné ET qu'on en a besoin : page compte, session déjà enregistrée, ou retour de connexion (?code=).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { safeURL } from './escape.js';

const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
const INTENT = 'releve.nl-intent';
const INTENT_TTL = 864e5; // l'intention d'inscription expire après 24 h
const COLS = 'email,created_at,founding_member,free_until,newsletter,newsletter_consent_at,unsubscribed_at,markets';
export const PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' },
  { id: 'azure', label: 'Microsoft' },
  { id: 'discord', label: 'Discord' },
];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isToken = (t) => typeof t === 'string' && UUID.test(t);

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* idem */ } },
};

export const isConfigured = () => Boolean(safeURL(SUPABASE_URL)) && typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 20;

let clientP = null;
let current = null;
let flash = null;
const listeners = new Set();
export const onAuthChange = (fn) => { listeners.add(fn); };
const emit = (ev) => listeners.forEach((fn) => { try { fn(ev, current); } catch (e) { console.error(e); } });

/** Client Supabase (promesse mémorisée ; un échec de chargement permet de réessayer). */
export function getClient() {
  if (!isConfigured()) return Promise.reject(new Error('not-configured'));
  if (!clientP) {
    clientP = import(LIB).then(({ createClient }) => {
      const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
      });
      // Jamais d'appel Supabase dans ce rappel (verrou interne) : tout passe par setTimeout.
      c.auth.onAuthStateChange((ev, s) => {
        current = s || null;
        setTimeout(() => {
          if (ev === 'SIGNED_IN') applyIntent().catch(() => {});
          emit(ev);
        }, 0);
      });
      return c;
    });
    clientP.catch(() => { clientP = null; });
  }
  return clientP;
}

/** Session courante (attend la fin de l'initialisation, donc de l'échange ?code=). */
export async function getSession() {
  const c = await getClient();
  const { data, error } = await c.auth.getSession();
  if (error) throw error;
  current = data.session || null;
  return current;
}
export const cachedSession = () => current;

/** Une session Supabase est-elle enregistrée dans ce navigateur ? (sans charger la bibliothèque) */
export function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i += 1) if (/^sb-.+-auth-token$/.test(localStorage.key(i) || '')) return true;
  } catch { /* stockage indisponible */ }
  return false;
}

/** Retour de fournisseur ou de lien magique : ?code=… ou ?error=… dans la query (PKCE), jamais dans le hash. */
export function isCallback() {
  const q = new URLSearchParams(location.search);
  return q.has('code') || q.has('error') || q.has('error_description');
}

/** Termine la connexion après redirection, nettoie la query, renvoie la route à afficher. */
export async function completeRedirect() {
  const q = new URLSearchParams(location.search);
  const code = q.get('code');
  const err = q.get('error_description') || q.get('error');
  let msg = err ? humanize({ message: err, code: q.get('error_code') || q.get('error') }) : null;
  if (isConfigured()) {
    try {
      const c = await getClient();
      const res = await c.auth.initialize(); // { error } si l'échange du code a échoué
      if (res && res.error && !msg) msg = humanize(res.error);
      await getSession();
    } catch (e) {
      if (!msg) msg = humanize(e);
    }
    if (code && !current && !msg) {
      msg = "La connexion n'a pas abouti. Ouvrez le lien dans le navigateur où vous l'avez demandé, ou demandez-en un nouveau.";
    }
    if (current) applyIntent().catch(() => {});
  }
  flash = current ? null : msg;
  const target = current ? '#/compte' : '#/connexion';
  history.replaceState(null, '', location.pathname + target);
  return target;
}
/** Message laissé par une redirection ratée (lu une seule fois par la page de connexion). */
export const takeFlash = () => { const f = flash; flash = null; return f; };

export const redirectURL = () => location.origin + location.pathname;

// ---- Intention d'inscription à la newsletter (consentement actif, mémorisé avant la redirection) ----
export function setIntent(on) {
  if (on) ls.set(INTENT, JSON.stringify({ at: Date.now() }));
  else ls.del(INTENT);
}
function readIntent() {
  const raw = ls.get(INTENT);
  if (!raw) return false;
  try {
    const { at } = JSON.parse(raw);
    if (typeof at === 'number' && Date.now() - at < INTENT_TTL) return true;
  } catch { /* valeur illisible */ }
  ls.del(INTENT);
  return false;
}
let intentP = null;
/** Si l'utilisateur a coché « Recevoir l'article hebdo » avant de se connecter : newsletter = true. */
export function applyIntent() {
  if (!readIntent() || !current) return Promise.resolve(false);
  if (!intentP) {
    intentP = updateProfile({ newsletter: true })
      .then(() => { ls.del(INTENT); return true; })
      .finally(() => { intentP = null; });
  }
  return intentP;
}

// ---- Actions ----
export async function signInWithProvider(provider) {
  if (!PROVIDERS.some((p) => p.id === provider)) throw new Error('fournisseur inconnu');
  const c = await getClient();
  const options = { redirectTo: redirectURL() };
  if (provider === 'azure') options.scopes = 'email';
  const { error } = await c.auth.signInWithOAuth({ provider, options });
  if (error) throw error;
}

export async function signInWithEmail(email) {
  const c = await getClient();
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectURL(), shouldCreateUser: true } });
  if (error) throw error;
}

/** Code reçu par e-mail (6 à 8 chiffres selon le réglage Supabase) : ouvre la session dans ce navigateur. */
export async function verifyEmailCode(email, token) {
  const c = await getClient();
  const { data, error } = await c.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  current = (data && data.session) || current;
  return current;
}

/** Erreur de code → phrase française (code faux et code expiré sont indiscernables côté serveur). */
export function humanizeCode(e) {
  const m = String((e && (e.message || e.error_description)) || e || '');
  const code = String((e && e.code) || '');
  const status = e && e.status;
  if (status === 429 || /rate limit|only request this after|too many/i.test(m)) return 'Trop de tentatives rapprochées : patientez une minute, puis réessayez.';
  if (/otp|token|expired|invalid/i.test(m + code) || status === 401 || status === 403 || status === 400) {
    return "Code incorrect ou expiré. Vérifiez les chiffres, ou demandez un nouveau code (chaque code ne sert qu'une fois et expire au bout d'une heure).";
  }
  return humanize(e);
}

export async function signOut() {
  const c = await getClient();
  const { error } = await c.auth.signOut();
  // Réseau indisponible : on ferme au moins la session de ce navigateur.
  if (error) await c.auth.signOut({ scope: 'local' });
  current = null;
}

/** Fournisseurs activés côté Supabase (GET /auth/v1/settings) ; null si inconnu (on affiche tout). */
export async function enabledProviders() {
  try {
    const r = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.external ? j.external : null;
  } catch {
    return null;
  }
}

export async function getProfile() {
  const c = await getClient();
  const s = current || await getSession();
  if (!s) return null;
  const { data, error } = await c.from('profiles').select(COLS).eq('id', s.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Seuls `newsletter` et `markets` sont modifiables (droits SQL) : on n'envoie rien d'autre. */
export async function updateProfile(patch) {
  const c = await getClient();
  const s = current || await getSession();
  if (!s) throw new Error('not-signed-in');
  const body = {};
  if ('newsletter' in patch) body.newsletter = Boolean(patch.newsletter);
  if ('markets' in patch) body.markets = ['FR', 'US'].filter((m) => patch.markets.includes(m));
  if (body.markets && !body.markets.length) throw new Error('au moins un marché');
  const { data, error } = await c.from('profiles').update(body).eq('id', s.user.id).select(COLS).single();
  if (error) throw error;
  return data;
}

export async function deleteAccount() {
  const c = await getClient();
  const { error } = await c.rpc('delete_my_account');
  if (error) throw error;
  await c.auth.signOut({ scope: 'local' });
  current = null;
  setTimeout(() => emit('SIGNED_OUT'), 0);
}

/** Désinscription en un clic (clé anon) : true si le lien correspond à un compte. */
export async function unsubscribe(token) {
  if (!isToken(token)) return false;
  const c = await getClient();
  const { data, error } = await c.rpc('unsubscribe', { token });
  if (error) throw error;
  return data === true;
}

/** Erreurs Supabase / réseau → phrase française (jamais de trace technique). */
export function humanize(e) {
  const m = String((e && (e.message || e.error_description)) || e || '');
  const code = String((e && (e.code || e.name)) || '');
  const status = e && e.status;
  if (/access_denied|cancel/i.test(m + code)) return 'Connexion annulée.';
  if (status === 429 || /rate limit|only request this after|too many/i.test(m)) return 'Trop de demandes rapprochées : patientez une minute, puis réessayez.';
  if (/invalid.*email|email.*invalid|validate email/i.test(m)) return "Cette adresse e-mail n'est pas valide.";
  if (/provider is not enabled|unsupported provider/i.test(m)) return "Ce mode de connexion n'est pas encore activé.";
  if (/expired|invalid.*(code|grant|flow)|code verifier|both auth code/i.test(m + code)) return 'Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau.';
  if (/failed to fetch|networkerror|load failed|retryable|fetch|import|offline/i.test(m + code)) return 'Le serveur ne répond pas. Vérifiez votre connexion, puis réessayez.';
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
