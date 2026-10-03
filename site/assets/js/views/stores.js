// Vue Boutiques (§6.5) : meilleures ventes « depuis toujours » de boutiques Shopify.
import { html, fr } from '../escape.js';
import { getIndex, getRanking } from '../data.js';
import { periodKey, periodParam } from '../router.js';
import { price, no, plural, time } from '../format.js';
import { renderList, productCell, extCell, rankCell } from '../components/row.js';
import { renderSegmented } from '../components/segmented.js';
import { renderPeriod } from '../components/period.js';
import { renderCoverage, periodLabel } from '../components/coverage.js';
import { renderScore } from '../components/score.js';
import { renderSource, periodWhen } from '../components/source.js';
import { renderEmpty, renderError, renderUnavailable } from '../components/states.js';
import { thumb, extLink, icon } from '../components/ui.js';
import { catLabel } from './rankings.js';

const SHOPIFY_NOTE = fr("Shopify trie sur l'historique complet des ventes : ce sont des produits phares, pas des nouveautés.");

function storeCard(ctx, l) {
  const { meta, m } = ctx;
  const at = meta.sources && meta.sources.shopify && meta.sources.shopify.collected_at;
  const items = (l.items || []).map((it) => ({ ...it, _rank: it.rank }));
  const cols = [
    { k: 'rank', cls: 'w-rank', cell: (it) => rankCell(it.rank) },
    { k: 'img', cls: 'w-thumb', cell: (it) => thumb(it.image, 44, l.store) },
    { k: 'prod', cls: 'w-prod', cell: (it) => productCell({ title: it.title, ext: it.url, sub: it.type || '', lang: m === 'US' ? 'en' : '' }) },
    { k: 'price', cls: 'w-price num', sr: 'Prix', cell: (it) => price(it.price, m) },
  ];
  const body = items.length
    ? html`${renderList({ variant: 'store', cols, items, head: false, label: `${l.store}, meilleures ventes` })}${
      items.length > 3 ? html`<button type="button" class="btn-ghost more-store" data-action="expand" aria-expanded="false">Voir les ${items.length} ›</button>` : ''}`
    : renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit relevé pour cette boutique ce matin.' });
  return html`<section class="module store-card"><h2 class="h3">${l.store} · <span class="muted">${catLabel(meta, l.category)}</span></h2>${body}<p class="c-source"><span class="dot dot-shopify" aria-hidden="true"></span><span>${extLink(l.source_url, l.host)} · relevé à ${time(at)}</span></p></section>`;
}

async function cumul(ctx, idx, p, u) {
  const { meta, m } = ctx;
  const key = periodKey(p);
  const info = idx && idx[key];
  if (!info) return renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit ne correspond à ce filtre sur cette période.' });
  let R;
  try { R = await getRanking(key); } catch { return renderError(); }
  const covered = info.days_covered;
  const max = 12 * covered;
  const items = ((R.shopify && R.shopify[m]) || []).filter((it) => u === 'tous' || it.category === u).map((it, i) => ({ ...it, _rank: i + 1 }));
  const lang = m === 'US' ? 'en' : '';
  const cols = [
    { k: 'rank', label: 'Rang', cls: 'w-rank', cell: (it) => rankCell(it._rank) },
    { k: 'img', cls: 'w-thumb', cell: (it) => thumb(it.image, 48, it.store) },
    {
      k: 'prod', label: 'Produit', cls: 'w-prod',
      cell: (it) => productCell({
        title: it.title, ext: it.url, lang, sub: html`<span class="tab-only">${it.store}</span>`,
        meta: html`${it.store} · <span class="num">${price(it.price, m)}</span><span class="m-score">${renderScore(it.points, max)} · <span class="num">${it.days}/${covered} j</span></span>`,
      }),
    },
    { k: 'store', label: 'Boutique', cls: 'w-cat', bp: 'md', cell: (it) => it.store },
    { k: 'score', label: 'Score', cls: 'w-score', bp: 'sm', tip: fr('Chaque jour, un produit gagne 13 − son rang (12 points pour le n° 1 de la boutique). Le score additionne ces points sur la période.'), cell: (it) => renderScore(it.points, max) },
    { k: 'pres', label: 'Présence', sr: 'Présence', cls: 'w-num num', bp: 'sm', cell: (it) => `${it.days}/${covered}\u00a0j` },
    { k: 'best', label: 'Meilleur', sr: 'Meilleur rang', cls: 'w-num num', bp: 'md', cell: (it) => no(it.best_rank) },
    { k: 'price', label: 'Prix', sr: 'Prix', cls: 'w-price num', bp: 'sm', cell: (it) => price(it.price, m) },
    { k: 'ext', cls: 'w-ext', bp: 'sm', cell: (it) => extCell(it.url, 'Voir la boutique') },
  ];
  return html`${renderCoverage(key, info)}<p class="list-meta">Score Shopify = somme de (13 − rang) sur la période, liste de 12 par boutique. <a href="#/methode/score">Comment ça marche ?</a></p>${
    items.length ? renderList({ variant: 'period', cols, items, limit: 25, label: `${periodLabel(key)}, toutes boutiques` })
      : renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit ne correspond à cet univers sur cette période.' })}${
    renderSource({ src: 'shopify', name: 'Shopify, tri « meilleures ventes »', when: periodWhen(info.from, info.to), next: true })}`;
}

export async function stores(ctx) {
  const { meta, latest, m, params } = ctx;
  const lists = (latest.shopify || []).filter((l) => l.market === m);
  const vue = params.vue === 'cumul' ? 'cumul' : 'boutique';
  const univers = [...new Set(lists.map((l) => l.category))].filter(Boolean);
  const u = univers.includes(params.u) ? params.u : 'tous';
  const s = (meta.sources && meta.sources.shopify) || {};
  const market = (meta.markets && meta.markets[m]) || m;
  let idx = null;
  let body;
  let periodCtl = '';
  if (!lists.length) {
    body = renderUnavailable({ name: 'Shopify', last: s.last_success, errors: s.errors || [] });
  } else if (vue === 'boutique') {
    const shown = lists.filter((l) => u === 'tous' || l.category === u);
    body = html`<div class="store-grid">${shown.map((l) => storeCard(ctx, l))}</div>`;
  } else {
    try { idx = await getIndex(); } catch { idx = null; }
    const p = params.p && params.p !== 'jour' ? params.p : '7j';
    periodCtl = renderPeriod({ value: periodParam(periodKey(p)), index: idx || {}, withDay: false, name: 'periode-b' });
    body = idx ? await cumul(ctx, idx, p, u) : renderError('L’index des périodes');
  }
  const filters = html`<div class="filters static"><div class="filters-in">${renderSegmented({
    name: 'vue', legend: 'Affichage', value: vue, param: 'vue',
    options: [{ value: 'boutique', label: 'Par boutique' }, { value: 'cumul', label: 'Toutes boutiques' }],
  })}${periodCtl}<div class="f-cat"><label for="f-univ" class="f-label">Univers</label><span class="c-select"><select id="f-univ" data-param="u"><option value="tous">Tous</option>${
    univers.map((k) => html`<option value="${k}"${k === u ? html` selected` : ''}>${catLabel(meta, k)}</option>`)}</select></span></div></div></div>`;
  return {
    title: 'Boutiques',
    announce: `${vue === 'cumul' ? 'Toutes boutiques' : 'Par boutique'}, univers ${u === 'tous' ? 'tous' : catLabel(meta, u)}`,
    html: html`<div class="container page"><div class="page-head"><h1 tabindex="-1">Boutiques</h1><p class="lede">Les meilleures ventes « depuis toujours » de ${lists.length} ${plural(lists.length, 'marque', 'marques')} Shopify (${market}).</p>
<p class="c-note is-info">${icon('i-info')}<span>${SHOPIFY_NOTE}</span></p></div>${filters}${body}</div>`,
  };
}

