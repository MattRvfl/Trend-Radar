// Chargement des JSON de site/data : fetch revalidé, cache mémoire, erreur locale à chaque fichier.
const cache = new Map();

export const MARKETS = ['FR', 'US'];
export const isMarket = (m) => MARKETS.includes(m);
const isKey = (s) => typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s);
const isPeriod = (s) => typeof s === 'string' && /^(7d|30d|\d{4}(-\d{2})?)$/.test(s);

function load(path) {
  if (!cache.has(path)) {
    const p = fetch(`data/${path}`, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
      return r.json();
    });
    p.catch(() => cache.delete(path)); // « Réessayer » relance vraiment le fetch
    cache.set(path, p);
  }
  return cache.get(path);
}

export const getMeta = () => load('meta.json');
export const getLatest = () => load('latest.json');
export const getIndex = () => load('rankings/index.json');
export function getRanking(key) {
  return isPeriod(key) ? load(`rankings/${key}.json`) : Promise.reject(new Error('période invalide'));
}
export function getHistory(market, category) {
  return isMarket(market) && isKey(category)
    ? load(`history/${market}-${category}.json`)
    : Promise.reject(new Error('historique invalide'));
}

const daysCache = new WeakMap();
/** Union des dates présentes dans un fichier d'historique = jours où la catégorie a été relevée. */
export function collectedDays(hist) {
  if (!daysCache.has(hist)) {
    const set = new Set();
    for (const p of Object.values(hist || {})) for (const d of Object.keys((p && p.ranks) || {})) set.add(d);
    daysCache.set(hist, set);
  }
  return daysCache.get(hist);
}
