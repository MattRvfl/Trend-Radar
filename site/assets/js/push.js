// Notifications push : état, activation (sur geste uniquement), sujets et marchés, désactivation.
// L'abonnement est enregistré par RPC Supabase : via supabase-js si une session est chargée (rattache
// l'abonnement au compte), sinon par un simple fetch avec la clé publique, sans charger la bibliothèque.
import { SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY } from './config.js';
import { isConfigured, cachedSession, getClient } from './auth.js';
import { isIOS, isStandalone } from './device.js';
import { swRegistration } from './pwa.js';

export const TOPICS = ['article', 'rush'];
export const MARKETS = ['FR', 'US'];
const KEY = 'releve.push'; // { topics, markets, endpoint } : choix de cet appareil, rien d'autre
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};
const pick = (list, allowed) => allowed.filter((x) => Array.isArray(list) && list.includes(x));

function fail(code, cause) {
  const e = new Error(code);
  e.code = code;
  if (cause) e.cause = cause;
  return e;
}

/** Préférences de cet appareil (défaut : les deux sujets, le marché affiché). */
export function readPrefs() {
  let p = {};
  try { p = JSON.parse(ls.get(KEY) || '{}') || {}; } catch { p = {}; }
  const m = ls.get('releve.market');
  const topics = pick(p.topics, TOPICS);
  const markets = pick(p.markets, MARKETS);
  return {
    topics: topics.length ? topics : ['article', 'rush'],
    markets: markets.length ? markets : [MARKETS.includes(m) ? m : 'FR'],
    endpoint: typeof p.endpoint === 'string' ? p.endpoint : null,
  };
}
function writePrefs(p) {
  ls.set(KEY, JSON.stringify({ topics: pick(p.topics, TOPICS), markets: pick(p.markets, MARKETS), endpoint: p.endpoint || null }));
}

const configured = () => isConfigured() && typeof VAPID_PUBLIC_KEY === 'string' && /^[A-Za-z0-9_-]{80,}$/.test(VAPID_PUBLIC_KEY);
export const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/**
 * État sur cet appareil :
 * unavailable (pas configuré) · ios-install (iPhone/iPad hors écran d'accueil) · unsupported · denied · on · off.
 */
export async function getState() {
  if (!configured()) return 'unavailable';
  if (isIOS() && !isStandalone()) return 'ios-install';
  if (!window.isSecureContext || !supported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await swRegistration();
  if (!reg || !reg.pushManager) return 'unsupported';
  let sub = null;
  try { sub = await reg.pushManager.getSubscription(); } catch { sub = null; }
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

function b64urlToBytes(s) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function sameKey(sub, key) {
  const k = sub.options && sub.options.applicationServerKey;
  if (!k) return true;
  const a = new Uint8Array(k);
  return a.length === key.length && a.every((v, i) => v === key[i]);
}

async function rpc(fn, args) {
  if (cachedSession()) {
    const c = await getClient();
    const { error } = await c.rpc(fn, args);
    if (error) throw error;
    return;
  }
  const r = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) { const e = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
}

async function save(sub, prefs) {
  const j = sub.toJSON();
  const keys = j.keys || {};
  if (!/^https:\/\//.test(j.endpoint || '') || !keys.p256dh || !keys.auth) throw fail('bad-subscription');
  const topics = pick(prefs.topics, TOPICS);
  const markets = pick(prefs.markets, MARKETS);
  if (!topics.length || !markets.length) throw fail('empty-choice');
  await rpc('save_push_subscription', { p_endpoint: j.endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth, p_topics: topics, p_markets: markets });
  writePrefs({ topics, markets, endpoint: j.endpoint });
}

function askPermission() {
  return new Promise((resolve) => {
    const p = Notification.requestPermission(resolve); // ancienne forme à rappel (Safari)
    if (p && typeof p.then === 'function') p.then(resolve, () => resolve('default'));
  });
}

/**
 * Active les notifications. À appeler DIRECTEMENT depuis un clic ou un changement d'interrupteur :
 * la demande d'autorisation du navigateur est la toute première étape.
 */
export async function enable(prefs) {
  const perm = await askPermission();
  if (perm !== 'granted') throw fail(perm === 'denied' ? 'denied' : 'dismissed');
  const reg = await swRegistration();
  if (!reg || !reg.pushManager) throw fail('unsupported');
  const key = b64urlToBytes(VAPID_PUBLIC_KEY);
  let sub;
  try {
    sub = await reg.pushManager.getSubscription();
    if (sub && !sameKey(sub, key)) { await sub.unsubscribe().catch(() => {}); sub = null; }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  } catch (e) {
    throw fail('subscribe', e);
  }
  try {
    await save(sub, prefs);
  } catch (e) {
    await sub.unsubscribe().catch(() => {}); // pas d'abonnement fantôme que le serveur ignore
    throw e;
  }
}

/** Nouveaux sujets ou marchés : réenregistrés si l'abonnement est actif, sinon gardés pour l'activation. */
export async function update(prefs) {
  const reg = await swRegistration();
  const sub = reg && reg.pushManager ? await reg.pushManager.getSubscription().catch(() => null) : null;
  if (sub && Notification.permission === 'granted') await save(sub, prefs);
  else writePrefs({ ...prefs, endpoint: null });
}

/** Désactive sur cet appareil. Renvoie false si le serveur n'a pas pu être prévenu (il le saura au prochain envoi). */
export async function disable() {
  const prefs = readPrefs();
  const reg = await swRegistration();
  const sub = reg && reg.pushManager ? await reg.pushManager.getSubscription().catch(() => null) : null;
  writePrefs({ ...prefs, endpoint: null });
  if (!sub) return true;
  const { endpoint } = sub;
  await sub.unsubscribe().catch(() => {});
  try {
    await rpc('delete_push_subscription', { p_endpoint: endpoint });
    return true;
  } catch {
    return false;
  }
}

/** Au démarrage : si le navigateur a renouvelé l'abonnement, on réenregistre la nouvelle adresse. */
export async function refresh() {
  if (!configured() || !supported() || Notification.permission !== 'granted') return;
  const reg = await swRegistration();
  if (!reg || !reg.pushManager) return;
  const sub = await reg.pushManager.getSubscription().catch(() => null);
  const prefs = readPrefs();
  if (!sub) {
    if (prefs.endpoint) writePrefs({ ...prefs, endpoint: null });
    return;
  }
  if (prefs.endpoint !== sub.endpoint) await save(sub, prefs).catch(() => {});
}
