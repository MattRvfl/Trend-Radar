// Relevé (extension) : encart sur une page produit Amazon (amazon.fr, amazon.com) ou d'une boutique Shopify.
// Sur Amazon, ce script est chargé automatiquement ; ailleurs, seulement quand on clique sur l'icône
// de l'extension (background.js). Il lit l'identifiant, le titre et le prix affichés sur la page, demande
// à background.js la place du produit dans les relevés, et propose « Voir dans Relevé » et « Calculer la
// rentabilité ». Le titre et le prix voyagent dans le fragment (#…) du lien, que le navigateur ne transmet
// jamais, et les liens n'envoient pas l'adresse de la page visitée (noreferrer).
(() => {
  if (window.top !== window) return;
  const manual = window.__releveManual === true; // injecté par un clic sur l'icône
  window.__releveManual = false;
  if (window.__releveRunning) {
    if (manual && !document.getElementById('releve-ext')) window.__releveShow?.(true);
    return;
  }
  window.__releveRunning = true;

  const ASIN = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/;
  const SITE = 'https://mattrvfl.github.io/Trend-Radar/';

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

  // Prix à payer, du bloc le plus sûr au moins sûr ; jamais un prix barré, unitaire ou d'un autre produit.
  const AMAZON_PRICE = [
    '#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen',
    '#corePrice_feature_div .priceToPay .a-offscreen',
    '#corePrice_desktop .apexPriceToPay .a-offscreen',
    '#apex_desktop .apexPriceToPay .a-offscreen',
    '#corePrice_feature_div .a-price:not([data-a-strike]):not(.a-text-price) .a-offscreen',
    '#price_inside_buybox',
    '#newBuyBoxPrice',
  ];

  function amazonPage() {
    const m = location.hostname.endsWith('amazon.com') ? 'US' : location.hostname.endsWith('amazon.fr') ? 'FR' : null;
    const id = (location.pathname.match(ASIN) || [])[1];
    if (!m || !id) return null;
    let price = null;
    for (const sel of AMAZON_PRICE) {
      const el = document.querySelector(sel);
      price = el ? parsePrice(el.textContent, m) : null;
      if (price) break;
    }
    const title = (document.getElementById('productTitle') || {}).textContent || document.title;
    return { kind: 'amazon', market: m, asin: id, title: title.trim().slice(0, 200), price };
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
    const vid = new URLSearchParams(location.search).get('variant');
    const v = p.variants.find((x) => String(x.id) === vid) || p.variants.find((x) => x.available) || p.variants[0];
    const cents = v && typeof v.price === 'number' ? v.price : p.price;
    const cur = ((document.querySelector('meta[property="og:price:currency"], meta[property="product:price:currency"]') || {}).content || '').toUpperCase();
    const market = cur === 'USD' ? 'US' : cur === 'EUR' ? 'FR' : null;
    return { kind: 'shopify', market: market || 'FR', currency: cur, host: location.hostname, title: String(p.title || '').slice(0, 200), price: market ? cents / 100 : null };
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

  /** Logo dessiné sur place (aucune ressource de l'extension exposée aux sites). */
  function logo() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'logo'); svg.setAttribute('viewBox', '0 0 20 20'); svg.setAttribute('aria-hidden', 'true');
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('width', '20'); rect.setAttribute('height', '20'); rect.setAttribute('rx', '6'); rect.setAttribute('fill', '#18191B');
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', '4,14.5 8,10 11,12 16,5.5'); line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#fff');
    line.setAttribute('stroke-width', '2'); line.setAttribute('stroke-linecap', 'round'); line.setAttribute('stroke-linejoin', 'round');
    svg.append(rect, line);
    return svg;
  }

  const CSS = `
:host { all: initial; }
.card { position: fixed; right: 16px; bottom: 16px; z-index: 2147483646; width: 300px; max-width: calc(100vw - 32px); box-sizing: border-box;
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; color: #18191B; background: #fff;
  border: 1px solid #E4E4E7; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,.14); padding: 14px 16px 16px; }
.head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.logo { width: 20px; height: 20px; flex: none; }
.brand { font-weight: 650; flex: 1; }
.x { all: unset; cursor: pointer; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; color: #5F6168; font-size: 18px; }
.x:hover, .x:focus-visible { background: #F1F1F2; outline: none; }
p { margin: 0; }
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

  const link = (cls, href, text) => h('a', { class: `btn ${cls}`, href, target: '_blank', rel: 'noopener noreferrer', referrerpolicy: 'no-referrer' }, text);

  function calcHref(site, page, prod) {
    const q = new URLSearchParams({ m: page.market });
    if (prod) { q.set('c', prod.category); q.set('id', page.asin); } else if (page.title) q.set('t', page.title);
    if (page.price) q.set('p', String(page.price));
    if (page.kind === 'shopify') q.set('canal', 'shopify');
    return `${site}#/rentabilite?${q}`;
  }

  function lines(page, res) {
    const prod = res && res.product;
    const down = !res || res.error;
    if (!page) {
      return [h('p', { class: 'big' }, 'Aucune fiche produit reconnue'),
        h('p', { class: 'muted' }, 'Relevé s’affiche sur les pages produit Amazon (amazon.fr, amazon.com) et des boutiques Shopify. Vous pouvez aussi calculer une rentabilité à la main.')];
    }
    if (page.kind === 'amazon' && prod) {
      if (prod.rank == null) {
        return [h('p', { class: 'big' }, `${prod.label} : pas de relevé aujourd’hui`),
          h('p', { class: 'muted' }, `La catégorie n’a pas pu être relevée ce matin. Meilleur rang relevé : n° ${prod.best} · ${prod.days} j dans le top 30`)];
      }
      return [h('p', { class: 'big' }, prod.rank ? `n° ${prod.rank} en ${prod.label}` : `Sorti du top 30 ${prod.label}`),
        h('p', { class: 'muted' }, prod.rank
          ? `Meilleures ventes Amazon ${page.market} aujourd’hui · meilleur rang : n° ${prod.best} · ${prod.days} j dans le top 30`
          : `Meilleur rang relevé : n° ${prod.best} · ${prod.days} j dans le top 30`)];
    }
    if (page.kind === 'amazon') {
      return down
        ? [h('p', { class: 'big' }, 'Classements indisponibles pour l’instant'), h('p', { class: 'muted' }, 'Relevé ne répond pas. Le calcul de rentabilité reste possible.')]
        : [h('p', { class: 'big' }, 'Pas dans les classements relevés'),
          h('p', { class: 'muted' }, 'Relevé suit les 30 premières meilleures ventes de 17 catégories : ce produit n’y figure pas.')];
    }
    return [h('p', { class: 'big' }, res && res.store ? `Boutique suivie : ${res.store}` : 'Boutique Shopify'),
      h('p', { class: 'muted' }, page.price ? `Prix affiché : ${page.price.toLocaleString('fr-FR', { style: 'currency', currency: page.currency || 'EUR' })}`
        : page.currency ? `Devise ${page.currency} : saisissez le prix vous-même dans le calculateur.` : 'Prix non lu : saisissez-le dans le calculateur.')];
  }

  let host = null;
  let shownFor = null;

  function render(page, res) {
    if (host) host.remove();
    const site = (res && res.site) || SITE;
    const prod = page && res && res.product;
    host = h('div', { id: 'releve-ext' });
    const root = host.attachShadow({ mode: 'closed' });
    const close = h('button', { class: 'x', type: 'button', 'aria-label': 'Fermer Relevé' }, '×');
    close.addEventListener('click', () => { host.remove(); host = null; });
    const calc = link('primary', page ? calcHref(site, page, prod) : `${site}#/rentabilite`, 'Calculer la rentabilité');
    // Le prix a pu changer depuis l'affichage (variante choisie sur la page) : relu au moment du clic.
    calc.addEventListener('click', () => {
      if (!page || page.kind !== 'amazon') return;
      const now = amazonPage();
      if (now && now.asin === page.asin && now.price) calc.href = calcHref(site, now, prod);
    });
    const acts = h('div', { class: 'acts' },
      prod ? link('ghost', `${site}#/produit/${page.market}/${encodeURIComponent(prod.category)}/${page.asin}`, 'Voir l’historique dans Relevé') : null,
      page ? null : link('ghost', site, 'Ouvrir Relevé'),
      calc);
    root.append(h('style', {}, CSS), h('aside', { class: 'card', role: 'complementary', 'aria-label': 'Relevé' },
      h('div', { class: 'head' }, logo(), h('span', { class: 'brand' }, 'Relevé'), close),
      lines(page, res), acts));
    document.documentElement.append(host);
  }

  async function show(manualClick) {
    const page = amazonPage() || (manualClick ? await shopifyPage() : null);
    if (!page && !manualClick) return;
    const key = page ? `${page.kind}:${page.asin || location.pathname}` : null;
    const res = page ? await ask({ type: 'releve:lookup', market: page.market, asin: page.asin, host: page.host }) : null;
    shownFor = key;
    render(page, res);
  }
  window.__releveShow = show;

  show(manual);

  // Amazon change de variante sans recharger la page (nouvel ASIN dans l'adresse) : l'encart suit.
  let last = location.href;
  setInterval(() => {
    if (location.href === last) return;
    last = location.href;
    const p = amazonPage();
    const key = p ? `amazon:${p.asin}` : null;
    if (key && key !== shownFor && host) show(false);
  }, 1500);
})();
