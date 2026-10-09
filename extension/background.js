// Relevé (extension) : télécharge l'index produits publié par le site, le garde 6 h, répond aux pages.
// Aucune donnée de navigation n'est envoyée : seuls les fichiers publics de Relevé sont téléchargés.
const SITE = 'https://mattrvfl.github.io/Trend-Radar/';
const TTL = 6 * 3600 * 1000;
let pending = null;

async function fetchJSON(path) {
  const r = await fetch(SITE + path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
  return r.json();
}

const RETRY = 15 * 60 * 1000; // après un échec, pas de nouvel essai avant 15 min (copie précédente utilisée)

async function load() {
  const { releve, releveFailedAt } = await chrome.storage.local.get(['releve', 'releveFailedAt']);
  if (releve && Date.now() - releve.at < TTL) return releve;
  if (releve && releveFailedAt && Date.now() - releveFailedAt < RETRY) return releve;
  try {
    const [index, meta] = await Promise.all([fetchJSON('data/products.json'), fetchJSON('data/meta.json')]);
    const fresh = { at: Date.now(), date: index.date, products: index.products || {}, categories: meta.categories || {}, stores: meta.stores || {} };
    await chrome.storage.local.set({ releve: fresh, releveFailedAt: 0 });
    return fresh;
  } catch (e) {
    await chrome.storage.local.set({ releveFailedAt: Date.now() });
    if (releve) return releve; // site injoignable : la dernière copie vaut mieux qu'un faux « absent »
    throw e;
  }
}

/** Une seule requête à la fois, même si plusieurs onglets demandent en même temps. */
const data = () => {
  if (!pending) pending = load().finally(() => { pending = null; });
  return pending;
};

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (!msg || msg.type !== 'releve:lookup') return false;
  data().then((d) => {
    const m = msg.market === 'US' ? 'US' : 'FR';
    const asin = typeof msg.asin === 'string' && /^[A-Z0-9]{10}$/.test(msg.asin) ? msg.asin : null;
    const row = asin ? (d.products[m] || {})[asin] : null;
    const store = typeof msg.host === 'string' ? Object.values(d.stores).flatMap((s) => Object.entries(s)).find(([h]) => h === msg.host) : null;
    reply({
      site: SITE, date: d.date,
      product: row ? { category: row[0], label: d.categories[row[0]] || row[0], rank: row[1], best: row[2], days: row[3] } : null,
      store: store ? store[1].name : null,
    });
  }, (e) => reply({ site: SITE, error: String(e && e.message) }));
  return true; // réponse asynchrone
});

// Clic sur l'icône : l'encart s'affiche sur la page ouverte (Shopify, ou Amazon après fermeture).
// activeTab donne l'accès à cet onglet pour ce clic seulement ; pages interdites (chrome://…) → le site.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.__releveManual = true; } });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch {
    chrome.tabs.create({ url: SITE });
  }
});
