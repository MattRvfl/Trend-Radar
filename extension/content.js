// Relevé (extension) : encart sur une page produit Amazon (amazon.fr, amazon.com) ou d'une boutique Shopify.
// Lit l'identifiant, le titre et le prix affichés sur la page, demande à background.js la place du
// produit dans les relevés, et propose « Voir dans Relevé » et « Calculer la rentabilité ».
// Rien n'est envoyé à un serveur : le titre et le prix voyagent dans le fragment (#…) du lien, que le
// navigateur ne transmet jamais.
(() => {
  if (window.top !== window || document.getElementById('releve-ext')) return;

  const ASIN = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/;

  /** « 1 234,56 € », « $1,234.56 » → 1234.56 (null si illisible). */
  function parsePrice(text, market) {
    const s = String(text || '').replace(/[^\d.,]/g, '');
    if (!s) return null;
    const lastC = s.lastIndexOf(',');
    const lastD = s.lastIndexOf('.');
    let norm;
    if (lastC >= 0 && lastD >= 0) norm = lastC > lastD ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (lastC >= 0) norm = market === 'US' && /,\d{3}$/.test(s) ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.');
    else norm = s;
    const v = Number.parseFloat(norm);
    return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  }

  function amazonPage() {
    const m = location.hostname.endsWith('amazon.com') ? 'US' : location.hostname.endsWith('amazon.fr') ? 'FR' : null;
    const id = (location.pathname.match(ASIN) || [])[1];
    if (!m || !id) return null;
    const priceEl = document.querySelector('#corePrice_feature_div .a-price .a-offscreen, #corePriceDisplay_desktop_feature_div .a-price .a-offscreen, #apex_desktop .a-price .a-offscreen, #price_inside_buybox, .a-price .a-offscreen');
    const title = (document.getElementById('productTitle') || {}).textContent || document.title;
    return { kind: 'amazon', market: m, asin: id, title: title.trim().slice(0, 200), price: priceEl ? parsePrice(priceEl.textContent, m) : null };
  }

  async function shopifyPage() {
    const mm = location.pathname.match(/^(.*\/products\/[^/?#.]+)/);
    if (!mm) return null;
    let p;
    try {
      const r = await fetch(`${location.origin}${mm[1]}.js`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!r.ok) return null;
      p = await r.json();
    } catch { return null; }
    if (!p || !Array.isArray(p.variants) || typeof p.price !== 'number') return null; // pas une boutique Shopify
    const cur = ((document.querySelector('meta[property="og:price:currency"], meta[property="product:price:currency"]') || {}).content || '').toUpperCase();
    const market = cur === 'USD' ? 'US' : cur === 'EUR' ? 'FR' : null;
    return { kind: 'shopify', market: market || 'FR', currency: cur, host: location.hostname, title: String(p.title || '').slice(0, 200), price: market ? p.price / 100 : null };
  }

  const ask = (msg) => new Promise((resolve) => {
    try { chrome.runtime.sendMessage(msg, (res) => resolve(chrome.runtime.lastError ? null : res)); } catch { resolve(null); }
  });

  /** Petit constructeur DOM : jamais d'innerHTML avec des données de page. */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) el.setAttribute(k, v); });
    kids.flat().forEach((k) => { if (k != null && k !== false) el.append(k); });
    return el;
  }

  const CSS = `
:host { all: initial; }
.card { position: fixed; right: 16px; bottom: 16px; z-index: 2147483646; width: 300px; max-width: calc(100vw - 32px); box-sizing: border-box;
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; color: #18191B; background: #fff;
  border: 1px solid #E4E4E7; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,.14); padding: 14px 16px 16px; }
.head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.logo { width: 20px; height: 20px; border-radius: 6px; }
.brand { font-weight: 650; flex: 1; }
.x { all: unset; cursor: pointer; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; color: #5F6168; font-size: 18px; }
.x:hover, .x:focus-visible { background: #F1F1F2; outline: none; }
.big { font-size: 17px; font-weight: 650; margin: 2px 0; }
.muted { color: #5F6168; font-size: 13px; }
.acts { display: grid; gap: 8px; margin-top: 12px; }
a.btn { display: block; text-align: center; text-decoration: none; padding: 9px 12px; border-radius: 8px; font-weight: 600; font-size: 14px; }
a.primary { background: #2F5BEA; color: #fff; }
a.primary:hover { background: #2549C8; }
a.ghost { color: #18191B; border: 1px solid #D4D4D8; }
a.ghost:hover { background: #F6F6F7; }
@media (prefers-color-scheme: dark) {
  .card { color: #ECECEE; background: #17181B; border-color: #2C2D31; }
  .muted, .x { color: #A1A2A8; }
  .x:hover, .x:focus-visible { background: #24252A; }
  a.ghost { color: #ECECEE; border-color: #3A3B40; }
  a.ghost:hover { background: #24252A; }
}`;

  function render(page, res) {
    const site = (res && res.site) || 'https://mattrvfl.github.io/Trend-Radar/';
    const prod = res && res.product;
    const q = new URLSearchParams({ m: page.market });
    if (prod) { q.set('c', prod.category); q.set('id', page.asin); } else if (page.title) q.set('t', page.title);
    if (page.price) q.set('p', String(page.price));
    const calc = `${site}#/rentabilite?${q}`;

    let lines;
    if (page.kind === 'amazon' && prod) {
      lines = [
        h('p', { class: 'big' }, prod.rank ? `n° ${prod.rank} en ${prod.label}` : `Sorti du top 30 ${prod.label}`),
        h('p', { class: 'muted' }, prod.rank
          ? `Meilleures ventes Amazon ${page.market} aujourd'hui · meilleur rang : n° ${prod.best} · ${prod.days} j dans le top 30`
          : `Meilleur rang relevé : n° ${prod.best} · ${prod.days} j dans le top 30`),
      ];
    } else if (page.kind === 'amazon') {
      lines = [h('p', { class: 'big' }, 'Pas dans les classements relevés'),
        h('p', { class: 'muted' }, res && res.error ? 'Relevé ne répond pas pour l’instant.' : 'Relevé suit les 30 premières meilleures ventes de 17 catégories : ce produit n’y figure pas.')];
    } else {
      lines = [h('p', { class: 'big' }, res && res.store ? `Boutique suivie : ${res.store}` : 'Boutique Shopify'),
        h('p', { class: 'muted' }, page.price ? `Prix affiché : ${page.price.toLocaleString('fr-FR', { style: 'currency', currency: page.currency || 'EUR' })}`
          : page.currency ? `Devise ${page.currency} : saisissez le prix vous-même dans le calculateur.` : 'Prix non lu : saisissez-le dans le calculateur.')];
    }

    const host = h('div', { id: 'releve-ext' });
    const root = host.attachShadow({ mode: 'closed' });
    const close = h('button', { class: 'x', type: 'button', 'aria-label': 'Fermer Relevé' }, '×');
    close.addEventListener('click', () => host.remove());
    const acts = h('div', { class: 'acts' },
      prod ? h('a', { class: 'btn ghost', href: `${site}#/produit/${page.market}/${encodeURIComponent(prod.category)}/${page.asin}`, target: '_blank', rel: 'noopener' }, 'Voir l’historique dans Relevé') : null,
      h('a', { class: 'btn primary', href: calc, target: '_blank', rel: 'noopener' }, 'Calculer la rentabilité'));
    root.append(h('style', {}, CSS), h('aside', { class: 'card', role: 'complementary', 'aria-label': 'Relevé' },
      h('div', { class: 'head' }, h('img', { class: 'logo', src: chrome.runtime.getURL('icons/icon-48.png'), alt: '' }), h('span', { class: 'brand' }, 'Relevé'), close),
      lines, acts));
    document.documentElement.append(host);
  }

  (async () => {
    const page = amazonPage() || (location.pathname.includes('/products/') ? await shopifyPage() : null);
    if (!page) return;
    const res = await ask({ type: 'releve:lookup', market: page.market, asin: page.asin, host: page.host });
    render(page, res);
  })();
})();
