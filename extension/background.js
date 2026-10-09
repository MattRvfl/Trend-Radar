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

async function load() {
  const { releve } = await chrome.storage.local.get('releve');
  if (releve && Date.now() - releve.at < TTL) return releve;
  const [index, meta] = await Promise.all([fetchJSON('data/products.json'), fetchJSON('data/meta.json')]);
  const fresh = { at: Date.now(), date: index.date, products: index.products || {}, categories: meta.categories || {}, stores: meta.stores || {} };
  await chrome.storage.local.set({ releve: fresh });
  return fresh;
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
    const row = msg.asin ? (d.products[m] || {})[msg.asin] : null;
    const store = msg.host ? Object.values(d.stores).flatMap((s) => Object.entries(s)).find(([h]) => h === msg.host) : null;
    reply({
      site: SITE, date: d.date,
      product: row ? { category: row[0], label: d.categories[row[0]] || row[0], rank: row[1], best: row[2], days: row[3] } : null,
      store: store ? store[1].name : null,
    });
  }, (e) => reply({ site: SITE, error: String(e && e.message) }));
  return true; // réponse asynchrone
});

chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: SITE }));
