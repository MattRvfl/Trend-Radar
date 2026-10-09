// Vue Rentabilité : marge par vente d'un produit repéré dans Relevé (ou saisi à la main), seuils
// de publicité, prix conseillé, et fiche brouillon à importer dans Shopify (CSV officiel).
// Tout le calcul se fait dans le navigateur : rien n'est envoyé ni enregistré ailleurs que sur cet appareil.
import { html, fr, safeURL } from '../escape.js';
import { getLatest, getHistory, isMarket } from '../data.js';
import { productHash } from '../router.js';
import { dec1, num } from '../format.js';
import { renderSegmented } from '../components/segmented.js';
import { thumb, icon, extLink } from '../components/ui.js';

const KEY = 'releve.profit'; // réglages de frais par marché et par canal (jamais le produit)
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};

// Valeurs de départ indicatives : chaque vendeur les remplace par ses tarifs réels.
const PRESETS = {
  shopify: { FR: { feePct: 1.8, feeFix: 0.25, ship: 5 }, US: { feePct: 2.9, feeFix: 0.3, ship: 6 } },
  amazon: { FR: { feePct: 15, feeFix: 3.5, ship: 0 }, US: { feePct: 15, feeFix: 4, ship: 0 } },
};
const VAT = { FR: 20, US: 0 };
const CHANNELS = [{ value: 'shopify', label: 'Ma boutique' }, { value: 'amazon', label: 'Amazon (FBA)' }];
const TARGET = 30; // marge visée pour le prix conseillé, en % du prix HT

const FIELDS = [
  ['price', 'Prix de vente TTC', 'Ce que paie le client.'],
  ['cost', "Coût d'achat du produit", 'Prix fournisseur par unité, transport jusqu’à vous compris : hors TVA si vous la récupérez, TTC sinon.'],
  ['ship', 'Livraison au client', 'Ce que vous coûte l’envoi d’une commande (0 si vous la facturez à part).'],
  ['feePct', 'Commission et paiement (%)', 'Pourcentage prélevé sur le prix TTC.'],
  ['feeFix', 'Frais fixes par commande', 'Frais de transaction fixes, ou frais d’expédition Amazon (FBA).'],
  ['other', 'Autres frais par commande', 'Emballage, retours, échantillons… Hors TVA si vous la récupérez, TTC sinon.'],
  ['cpa', 'Publicité par vente', 'Budget pub divisé par le nombre de ventes obtenues (CPA).'],
  ['vat', 'TVA (%)', 'France : 20 % si vous facturez la TVA, 0 en franchise en base (micro-entreprise). États-Unis : 0, la taxe de vente s’ajoute au prix affiché.'],
  ['qty', 'Ventes par mois', 'Pour estimer le bénéfice mensuel.'],
];

const CUR = { FR: 'EUR', US: 'USD' };
const money = (x, m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: CUR[m] || 'EUR' }).format(x);
const pctS = (x) => `${x < 0 ? '−' : ''}${dec1(Math.abs(x))}\u00a0%`;
const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Nombre saisi → valeur, ou null si illisible (le champ est alors signalé).
 * « 1 299,99 », « 1.299,99 », « 1,299.99 » ; avec un seul séparateur, il marque les milliers seulement
 * s'il est suivi de groupes de 3 chiffres dans l'usage du marché (« 1.000 » en FR, « 1,000 » aux US).
 */
export function parseNum(raw, market) {
  let t = String(raw ?? '').replace(/[\s\u00a0\u202f€$]/g, '');
  if (!t) return null;
  const c = t.lastIndexOf(',');
  const d = t.lastIndexOf('.');
  if (c >= 0 && d >= 0) t = c > d ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (c >= 0) t = market === 'US' && /^\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  else if (market !== 'US' && /^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(t)) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}

/** Calcul pur (testable) : tous les montants dans la devise du marché. */
export function compute(i) {
  const price = n(i.price);
  const vat = n(i.vat);
  const feeRate = n(i.feePct) / 100;
  const ht = price / (1 + vat / 100);
  const fees = price * feeRate + n(i.feeFix);
  const beforeAds = ht - n(i.cost) - n(i.ship) - fees - n(i.other);
  const profit = beforeAds - n(i.cpa);
  const fixed = n(i.cost) + n(i.ship) + n(i.feeFix) + n(i.other) + n(i.cpa);
  const denom = (1 - TARGET / 100) / (1 + vat / 100) - feeRate;
  return {
    ht, fees, beforeAds, profit,
    margin: ht > 0 ? (profit / ht) * 100 : null,
    coef: n(i.cost) > 0 ? price / n(i.cost) : null,
    maxCpa: beforeAds,
    roas: beforeAds > 0 ? price / beforeAds : null,
    monthly: profit * n(i.qty),
    target: denom > 0 ? fixed / denom : null,
  };
}

export function verdict(r) {
  if (r.profit <= 0) return { cls: 'is-loss', ic: 'i-warn', text: 'Non rentable à ce prix' };
  if (r.margin < 15) return { cls: 'is-thin', ic: 'i-partial', text: 'Rentable, mais marge fine' };
  return { cls: 'is-good', ic: 'i-ok', text: 'Rentable' };
}

/** Fiche Shopify au format d'import CSV officiel, en brouillon, sans image ni marque d'un tiers. */
export function shopifyCSV({ title, price, cost }) {
  const t = String(title || 'Nouveau produit').slice(0, 255);
  const handle = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'nouveau-produit';
  const cols = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Tags', 'Published', 'Option1 Name', 'Option1 Value',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Requires Shipping',
    'Variant Taxable', 'Cost per item', 'Status'];
  const row = [handle, t, '', '', 'releve', 'FALSE', 'Title', 'Default Title', 'deny', 'manual',
    n(price).toFixed(2), 'TRUE', 'TRUE', n(cost) > 0 ? n(cost).toFixed(2) : '', 'draft']; // taxe : réglages de la boutique
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return `${cols.map(q).join(',')}\r\n${row.map(q).join(',')}\r\n`;
}

function readSaved(m, ch) {
  let s = {};
  try { s = JSON.parse(ls.get(KEY) || '{}') || {}; } catch { s = {}; }
  const v = s[`${m}:${ch}`];
  return v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === 'number' && Number.isFinite(x) && x >= 0)) : {};
}
function save(m, ch, vals) {
  let s = {};
  try { s = JSON.parse(ls.get(KEY) || '{}') || {}; } catch { s = {}; }
  s[`${m}:${ch}`] = Object.fromEntries(['feePct', 'feeFix', 'ship', 'other', 'vat'].filter((k) => vals[k] != null).map((k) => [k, vals[k]]));
  ls.set(KEY, JSON.stringify(s));
}
const defaults = (m, ch) => ({ ...PRESETS[ch][m], other: 0, vat: VAT[m], ...readSaved(m, ch) });

/** Produit de Relevé (Amazon) à partir de ?m=&c=&id=, sinon titre et prix passés par l'extension. */
async function findProduct(params, m) {
  const { c, id } = params;
  const typed = parseNum(String(params.p || '').slice(0, 20), 'US'); // l'extension envoie « 1249.99 »
  const base = { title: typeof params.t === 'string' ? params.t.slice(0, 200) : '', price: typed > 0 ? typed : null };
  if (!c || !id) return base.title || base.price ? base : null;
  const [latest, hist] = await Promise.all([getLatest().catch(() => null), getHistory(m, c).catch(() => ({}))]);
  const list = latest && (latest.amazon || []).find((l) => l.market === m && l.category === c);
  const it = (list && (list.items || []).find((x) => x.id === id)) || null;
  const h = hist[id] || null;
  if (!it && !h) return base.title || base.price ? base : null;
  return {
    title: (it && it.title) || (h && h.title) || base.title,
    image: (it && it.image) || (h && h.image),
    url: (it && it.url) || (h && h.url),
    price: base.price || (it && it.price > 0 ? it.price : null),
    rank: it ? it.rank : null,
    href: productHash(m, c, id),
  };
}

const field = ([k, label, help], m, v) => {
  const cur = ['feePct', 'vat', 'qty'].includes(k) ? '' : (m === 'US' ? ' ($)' : ' (€)');
  return html`<div class="pf-field"><label class="field-label" for="pf-${k}">${label}${cur}</label>
<input class="field num" id="pf-${k}" name="${k}" type="text" inputmode="decimal" autocomplete="off" value="${v == null ? '' : String(v).replace('.', ',')}" aria-describedby="pf-${k}-h">
<p class="field-help" id="pf-${k}-h">${fr(help)}</p></div>`;
};

export async function profit({ m, params }) {
  const market = isMarket(params.m) ? params.m : m;
  const ch = params.canal === 'amazon' ? 'amazon' : 'shopify';
  const prod = await findProduct(params, market);
  const vals = { ...defaults(market, ch), price: prod && prod.price, cost: null, cpa: 0, qty: 100 };

  const head = prod
    ? html`<div class="pf-prod">${thumb(prod.image, 64, 'P')}<div><p class="pf-prod-title"${market === 'US' ? html` lang="en"` : ''}>${prod.title || 'Produit'}</p><p class="muted small">${
      prod.rank ? html`n° ${prod.rank} des meilleures ventes Amazon ${market} aujourd'hui · ` : ''}${
      prod.href ? html`<a href="${prod.href}">Voir dans Relevé</a>` : ''}${prod.href && safeURL(prod.url) ? ' · ' : ''}${
      safeURL(prod.url) ? extLink(prod.url, 'Page source') : ''}</p></div></div>`
    : html`<p class="c-note is-info">${icon('i-info')}<span>Ouvrez un produit dans <a href="#/classements">Classements</a>, puis « Calculer la rentabilité » : son prix sera repris ici. Vous pouvez aussi tout saisir à la main.</span></p>`;

  return {
    title: 'Rentabilité',
    html: html`<div class="container page profit"><header class="page-head"><h1 tabindex="-1">Est-ce rentable ?</h1>
<p class="muted">Un produit grimpe dans les classements : vérifiez ce qu'il vous rapporterait par vente, avant d'acheter du stock ou de la publicité.</p></header>
${head}
<div class="pf-grid"><form class="pf-form" novalidate aria-label="Coûts et prix">
${renderSegmented({ name: 'canal', legend: 'Où vendez-vous ?', value: ch, options: CHANNELS })}
<p class="field-help pf-preset">Frais pré-remplis à titre indicatif pour ${market === 'US' ? 'les États-Unis' : 'la France'} : remplacez-les par vos tarifs réels, ils seront retenus sur cet appareil.</p>
<div class="pf-fields">${FIELDS.map((f) => field(f, market, vals[f[0]]))}</div>
<button type="button" class="pf-mini" data-pf-jump hidden></button>
</form>
<section class="pf-out" aria-labelledby="pf-out-h"><h2 id="pf-out-h" class="h3" tabindex="-1">Résultat</h2><div id="pf-result"></div><p class="sr-only" aria-live="polite" id="pf-live"></p></section></div>
</div>`,
    after(root) {
      const form = root.querySelector('.pf-form');
      const out = root.querySelector('#pf-result');
      let canal = ch;
      const read = () => {
        const v = {};
        form.querySelectorAll('input.field').forEach((i) => {
          v[i.name] = parseNum(i.value, market);
          i.setAttribute('aria-invalid', String(i.value.trim() !== '' && v[i.name] === null));
        });
        return v;
      };
      const mini = root.querySelector('[data-pf-jump]');
      const liveEl = root.querySelector('#pf-live');
      let liveT = 0;
      const announce = (t) => { clearTimeout(liveT); liveT = setTimeout(() => { liveEl.textContent = t; }, 700); };
      mini.addEventListener('click', () => {
        const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        root.querySelector('.pf-out').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
        root.querySelector('#pf-out-h').focus({ preventScroll: true });
      });
      const paint = () => {
        const v = read();
        const wasHidden = mini.hidden;
        mini.hidden = true;
        if (!(v.price > 0) || v.cost === null) {
          out.innerHTML = String(html`<p class="muted">${!(v.price > 0) ? 'Entrez le prix de vente' : "Entrez le coût d'achat"} pour voir la marge.</p>`);
          announce('');
          return;
        }
        const r = compute(v);
        const vd = verdict(r);
        const $ = (x) => money(x, market);
        const signed = (x) => (x < -0.005 ? `−${$(-x)}` : $(Math.max(0, x)));
        const summary = fr(`${vd.text}. Bénéfice par vente : ${signed(r.profit)}${r.margin === null ? '' : ` · marge ${pctS(r.margin)}`}`);
        mini.hidden = false;
        mini.className = `pf-mini ${vd.cls}`;
        mini.innerHTML = String(html`${fr(`Bénéfice par vente : ${signed(r.profit)}${r.margin === null ? '' : ` · marge ${pctS(r.margin)}`}`)}<span aria-hidden="true"> ↓</span><span class="sr-only"> (aller au résultat)</span>`);
        announce(summary);
        // La barre qui apparaît ne doit pas recouvrir le champ en cours de saisie.
        if (wasHidden && form.contains(document.activeElement)) document.activeElement.scrollIntoView({ block: 'nearest' });
        out.innerHTML = String(html`<p class="pf-verdict ${vd.cls}">${icon(vd.ic)}${vd.text}</p>
<div class="kpis"><div class="kpi"><p class="kpi-label">Bénéfice par vente</p><p class="kpi-value num">${signed(r.profit)}</p></div>
<div class="kpi"><p class="kpi-label">Marge nette</p><p class="kpi-value num">${r.margin === null ? '—' : pctS(r.margin)}</p><p class="kpi-extra">du prix hors taxe</p></div>
<div class="kpi"><p class="kpi-label">Pub max. par vente</p><p class="kpi-value num">${r.maxCpa > 0 ? $(r.maxCpa) : '—'}</p><p class="kpi-extra">au-delà, chaque vente perd de l'argent</p></div>
<div class="kpi"><p class="kpi-label">ROAS minimum</p><p class="kpi-value num">${r.roas ? dec1(r.roas) : '—'}</p><p class="kpi-extra">chiffre d'affaires ÷ dépense pub</p></div></div>
<dl class="pf-detail">
<div><dt>Prix hors taxe</dt><dd class="num">${$(r.ht)}</dd></div>
<div><dt>Frais de la plateforme</dt><dd class="num">${$(r.fees)}</dd></div>
<div><dt>Coefficient (prix ÷ coût)</dt><dd class="num">${r.coef ? `× ${dec1(r.coef)}` : '—'}</dd></div>
<div><dt>Bénéfice sur ${num(v.qty || 0)} ventes par mois</dt><dd class="num">${signed(r.monthly)}</dd></div>
<div><dt>Prix conseillé pour ${TARGET} % de marge</dt><dd class="num">${r.target == null ? 'impossible avec ces frais' : r.target > 0 ? $(r.target) : 'atteinte à tout prix'}</dd></div>
</dl>
<button type="button" class="btn" data-pf-csv>${icon('i-store')}Préparer la fiche pour Shopify (CSV)</button>
<p class="field-help">Un brouillon à importer dans Shopify › Produits › Importer : titre, prix et coût. Remplacez le titre et ajoutez vos propres photos : les visuels et les marques d'autres vendeurs ne sont pas réutilisables.</p>`);
      };
      form.addEventListener('input', () => { paint(); save(market, canal, read()); });
      form.addEventListener('submit', (e) => e.preventDefault());
      form.addEventListener('change', (e) => {
        if (e.target.name !== 'canal') return;
        canal = e.target.value;
        const d = defaults(market, canal);
        ['feePct', 'feeFix', 'ship', 'other', 'vat'].forEach((k) => { form.elements[k].value = d[k] == null ? '' : String(d[k]).replace('.', ','); });
        paint();
      });
      out.addEventListener('click', (e) => {
        if (!e.target.closest('[data-pf-csv]')) return;
        const v = read();
        const blob = new Blob([`\ufeff${shopifyCSV({ title: prod && prod.title, price: v.price, cost: v.cost })}`], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'releve-shopify-produit.csv';
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
      paint();
    },
  };
}
