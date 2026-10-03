// Vue Classements (§6.3, §10) : Jour → latest.amazon ; autres périodes → rankings/<clé>.json.
import { html, fr } from '../escape.js';
import { getIndex, getRanking, getHistory } from '../data.js';
import { build, productHash, periodKey, periodParam } from '../router.js';
import { dShort, dec1, num, no, price, plural, list as fmtList, dayDate, dayRange, DASH } from '../format.js';
import { renderList, productCell, extCell, rankCell } from '../components/row.js';
import { renderDelta, renderStreak } from '../components/delta.js';
import { renderScore } from '../components/score.js';
import { renderPeriod } from '../components/period.js';
import { renderCoverage, periodLabel } from '../components/coverage.js';
import { renderSource, periodWhen, amazonName } from '../components/source.js';
import { renderEmpty, renderError, renderNote, renderNoComparison, renderUnavailable } from '../components/states.js';
import { thumb } from '../components/ui.js';
import { sparkSVG } from '../charts/sparkline.js';

export const SCORE_TIP = fr("Chaque jour, un produit gagne 31 − son rang (30 points pour le n° 1, 1 point pour le n° 30). Le score additionne ces points sur la période : il récompense à la fois le rang et la durée.");
export const catLabel = (meta, c) => (meta.categories && meta.categories[c]) || c;

/** Produits Amazon du jour pour un marché, enrichis de la catégorie, du rang et du lien panneau. */
export function dayItems(latest, m) {
  return (latest.amazon || []).filter((l) => l.market === m).flatMap((l) => (l.items || []).map((it) => ({
    ...it, _c: l.category, _rank: it.rank, _href: productHash(m, l.category, it.id),
  })));
}

/** Catégories attendues absentes du relevé (source partielle). */
export function missingNote(meta, latest, m) {
  const have = new Set((latest.amazon || []).filter((l) => l.market === m && (l.items || []).length).map((l) => l.category));
  const all = Object.keys(meta.categories || {});
  const miss = all.filter((c) => !have.has(c));
  if (!miss.length || miss.length === all.length) return '';
  return renderNote('warn', `Relevé partiel : ${all.length - miss.length} catégories sur ${all.length}. Manquent : ${fmtList(miss.map((c) => catLabel(meta, c)))}.`);
}

const thumbCol = (meta) => ({ k: 'img', cls: 'w-thumb', cell: (it) => thumb(it.image, 48, catLabel(meta, it._c || it.category)) });

/** Colonnes de la période Jour. opts : { cat: colonne catégorie, week: colonne 7 J, streak, spark, note }. */
export function dayCols(ctx, { cat = false, catCol = true, week = true, streak = true, spark = true, note = true } = {}) {
  const { meta, m } = ctx;
  const lang = m === 'US' ? 'en' : '';
  // Colonnes qui ne peuvent encore rien contenir (tout l'historique manque) : masquées plutôt
  // que remplies de « — » ; la note « Les variations arrivent demain » dit pourquoi.
  const days = meta.days_collected || 0;
  const cmp = Boolean(ctx.latest && ctx.latest.compared_to);
  if (days < 8) week = false;
  if (days < 2) spark = false;
  const cols = [{ k: 'rank', label: 'Rang', cls: 'w-rank', cell: (it) => rankCell(it.rank) }];
  if (cmp) cols.push({ k: 'var', label: 'Var. 24 h', cls: 'w-delta', bp: 'sm', cell: (it) => renderDelta(it) });
  cols.push(
    thumbCol(meta),
    {
      k: 'prod', label: 'Produit', cls: 'w-prod',
      cell: (it) => productCell({
        title: it.title, href: it._href, lang,
        sub: cat ? html`<span class="${catCol ? 'tab-only' : 'no-mobile'}">${catLabel(meta, it._c)}</span>` : '',
        meta: html`${cmp ? html`${renderDelta(it)} · ` : ''}${cat ? `${catLabel(meta, it._c)} · ` : ''}<span class="num">${price(it.price, m)}</span>`,
      }),
    },
  );
  if (cat && catCol) cols.push({ k: 'cat', label: 'Catégorie', cls: 'w-cat', bp: 'md', cell: (it) => catLabel(meta, it._c) });
  if (week) cols.push({ k: 'w', label: '7 j', cls: 'w-delta', bp: 'md', cell: (it) => renderDelta(it, { week: true }) });
  if (streak) cols.push({ k: 's', label: 'Série', cls: 'w-num', bp: 'md', cell: (it) => renderStreak(it.streak) });
  cols.push({ k: 'price', label: 'Prix', sr: 'Prix', cls: 'w-price num', bp: 'sm', cell: (it) => price(it.price, m) });
  if (note) {
    cols.push({
      k: 'note', label: 'Note (avis)', sr: 'Note', cls: 'w-note num', bp: 'lg',
      cell: (it) => (typeof it.rating === 'number' ? `${dec1(it.rating)} (${num(it.reviews)})` : DASH),
    });
  }
  if (spark) {
    cols.push({
      k: 'spark', label: '14 jours', cls: 'w-spark', bp: 'sm',
      cell: (it) => html`<span class="spark-slot" data-m="${m}" data-c="${it._c}" data-id="${it.id}"></span>`,
    });
  }
  cols.push({ k: 'ext', cls: 'w-ext', bp: 'sm', cell: (it) => extCell(it.url, `Voir sur ${amazonName(m)}`) });
  return cols;
}

function periodCols(ctx, max, withCat) {
  const { meta, m } = ctx;
  const lang = m === 'US' ? 'en' : '';
  const cols = [
    { k: 'rank', label: 'Rang', cls: 'w-rank', cell: (it) => rankCell(it._rank) },
    thumbCol(meta),
    {
      k: 'prod', label: 'Produit', cls: 'w-prod',
      cell: (it) => productCell({
        title: it.title, href: it._href, lang,
        sub: withCat ? html`<span class="tab-only">${catLabel(meta, it._c)}</span>` : '',
        meta: html`${withCat ? `${catLabel(meta, it._c)} · ` : ''}<span class="num">${price(it.price, m)}</span><span class="m-score">${renderScore(it.points, max)} · <span class="num">${it.days}/${ctx.covered} j</span></span>`,
      }),
    },
  ];
  if (withCat) cols.push({ k: 'cat', label: 'Catégorie', cls: 'w-cat', bp: 'md', cell: (it) => catLabel(meta, it._c) });
  cols.push(
    { k: 'score', label: 'Score', cls: 'w-score', bp: 'sm', tip: SCORE_TIP, cell: (it) => renderScore(it.points, max) },
    { k: 'pres', label: 'Présence', sr: 'Présence', cls: 'w-num num', bp: 'sm', cell: (it) => `${it.days}/${ctx.covered}\u00a0j` },
    { k: 'best', label: 'Meilleur', sr: 'Meilleur rang', cls: 'w-num num', bp: 'md', cell: (it) => no(it.best_rank) },
    { k: 'avg', label: 'Moyen', sr: 'Rang moyen', cls: 'w-num num', bp: 'lg', cell: (it) => dec1(it.avg_rank) },
    { k: 'price', label: 'Prix', sr: 'Prix', cls: 'w-price num', bp: 'sm', cell: (it) => price(it.price, m) },
    { k: 'note', label: 'Note', sr: 'Note', cls: 'w-num num', bp: 'lg', cell: (it) => (typeof it.rating === 'number' ? dec1(it.rating) : DASH) },
    { k: 'ext', cls: 'w-ext', bp: 'sm', cell: (it) => extCell(it.url, `Voir sur ${amazonName(m)}`) },
  );
  return cols;
}

/** Remplit les sparklines visibles (chargement à la demande des historiques). */
export function mountSparks(root, meta) {
  const slots = root.querySelectorAll('.spark-slot');
  if (!slots.length || !meta.last_day) return;
  const end = dayDate(meta.last_day);
  end.setUTCDate(end.getUTCDate() - 13);
  const days = dayRange(end.toISOString().slice(0, 10), meta.last_day);
  const fill = (el) => getHistory(el.dataset.m, el.dataset.c)
    .then((h) => { el.innerHTML = sparkSVG(h[el.dataset.id] && h[el.dataset.id].ranks, days); })
    .catch(() => { el.textContent = DASH; });
  if (!('IntersectionObserver' in window)) { slots.forEach(fill); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); }
  }), { rootMargin: '200px' });
  slots.forEach((s) => io.observe(s));
}

function amazonUnavailable(meta) {
  const s = (meta.sources && meta.sources.amazon) || {};
  return renderUnavailable({ name: 'Amazon', last: s.last_success, errors: s.errors || [] });
}

function dayBody(ctx, c, f) {
  const { meta, latest, m, params } = ctx;
  const shop = amazonName(m);
  const at = meta.sources && meta.sources.amazon && meta.sources.amazon.collected_at;
  const lists = (latest.amazon || []).filter((l) => l.market === m);
  if (!lists.length) return { body: amazonUnavailable(meta), count: 0 };
  const head = html`<p class="list-meta">Jour · ${dShort(latest.date)} · ${latest.compared_to ? `comparé au ${dShort(latest.compared_to)}` : 'premier relevé, pas encore de comparaison'}</p>`;
  const noCmp = latest.compared_to ? '' : renderNote('info', "Les variations arrivent demain. Il faut deux relevés pour comparer. Le premier date d'aujourd'hui.");
  let body;
  let count = 0;
  let srcName = `${shop} Meilleures ventes, top 30 × ${lists.length} catégories`;
  let srcUrl = null;
  if (f) {
    const chip = html`<p class="chips"><a class="chip" href="${build('classements', { ...params, f: null })}" aria-label="Retirer le filtre ${f === 'nouveaux' ? 'Nouveaux uniquement' : 'Hausses uniquement'}">${f === 'nouveaux' ? 'Nouveaux uniquement' : 'Hausses uniquement'} ✕</a></p>`;
    let items = dayItems(latest, m).filter((it) => c === 'toutes' || it._c === c);
    if (f === 'nouveaux') items = items.filter((it) => it.new === true).sort((a, b) => a.rank - b.rank);
    else items = items.filter((it) => it.change > 0).sort((a, b) => b.change - a.change || a.rank - b.rank);
    count = items.length;
    body = html`${chip}${!latest.compared_to ? renderNoComparison() : items.length
      ? renderList({ variant: 'day', cols: dayCols(ctx, { cat: true, week: false, streak: false, note: false }), items, limit: 25, label: 'Produits filtrés', open: ctx.open })
      : renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit ne correspond à ce filtre aujourd’hui.' })}`;
  } else if (c === 'toutes') {
    body = Object.keys(meta.categories).map((key) => {
      const l = lists.find((x) => x.category === key);
      if (!l || !(l.items || []).length) return '';
      const items = l.items.slice(0, 5).map((it) => ({ ...it, _c: key, _rank: it.rank, _href: productHash(m, key, it.id) }));
      count += items.length;
      return html`<section class="cat-block"><div class="block-head"><h2 class="h3">${catLabel(meta, key)}</h2><a class="btn-ghost" href="${build('classements', { m, p: 'jour', c: key })}">Voir les 30 ›</a></div>${
        renderList({ variant: 'day', cols: dayCols(ctx, { note: false, week: false }), items, label: `${catLabel(meta, key)}, 5 premiers`, head: false, open: ctx.open })}</section>`;
    });
  } else {
    const l = lists.find((x) => x.category === c);
    const items = ((l && l.items) || []).map((it) => ({ ...it, _c: c, _rank: it.rank, _href: productHash(m, c, it.id) }));
    count = items.length;
    srcName = `${shop} Meilleures ventes, ${catLabel(meta, c)}`;
    srcUrl = l && l.source_url;
    body = items.length
      ? renderList({ variant: 'day', cols: dayCols(ctx), items, label: `${catLabel(meta, c)}, top 30 du jour`, open: ctx.open })
      : renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit ne correspond à cette catégorie sur cette période. Essayez « Toutes les catégories ».' });
  }
  return {
    count,
    body: html`${head}${missingNote(meta, latest, m)}${noCmp}${body}${renderSource({ src: 'amazon', name: srcName, at, compared: latest.compared_to, next: true, url: srcUrl })}`,
  };
}

async function periodBody(ctx, key, info, c) {
  const { meta, m } = ctx;
  if (!info) return { count: 0, body: renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit ne correspond à cette catégorie sur cette période. Essayez « Toutes les catégories ».' }) };
  let R;
  try { R = await getRanking(key); } catch { return { count: 0, body: renderError() }; }
  const covered = info.days_covered;
  const max = 30 * covered;
  const A = (R.amazon && R.amazon[m]) || {};
  const raw = c === 'toutes' ? A.overall || [] : (A.by_category && A.by_category[c]) || [];
  const items = raw.map((it, i) => {
    const cat = it.category || c;
    return { ...it, _c: cat, _rank: i + 1, _href: productHash(m, cat, it.id) };
  });
  const pctx = { ...ctx, covered };
  const list = items.length
    ? renderList({ variant: 'period', cols: periodCols(pctx, max, c === 'toutes'), items, limit: c === 'toutes' ? 25 : 0, label: `${periodLabel(key)}, ${c === 'toutes' ? 'toutes catégories' : catLabel(meta, c)}`, open: ctx.open })
    : renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit ne correspond à cette catégorie sur cette période. Essayez « Toutes les catégories ».' });
  return {
    count: items.length,
    body: html`${renderCoverage(key, info)}<p class="list-meta">Score = somme des points du jour (31 − rang) sur la période. <a href="#/methode/score">Comment ça marche ?</a></p>${
      c !== 'toutes' ? html`<p class="list-meta">Les 10 premiers de la catégorie sur la période.</p>` : ''}${list}${
      renderSource({ src: 'amazon', name: `${amazonName(m)} Meilleures ventes, top 30 × ${Object.keys(meta.categories).length} catégories`, when: periodWhen(info.from, info.to), next: true })}`,
  };
}

export async function rankings(ctx) {
  const { meta, params, m } = ctx;
  let idx = null;
  try { idx = await getIndex(); } catch { idx = null; }
  const p = params.p || 'jour';
  const key = periodKey(p);
  const c = params.c && meta.categories && meta.categories[params.c] ? params.c : 'toutes';
  const f = p === 'jour' && ['nouveaux', 'hausses'].includes(params.f) ? params.f : null;
  const cats = Object.entries(meta.categories || {});
  const filters = html`<div class="filters"><div class="container filters-in">${renderPeriod({ value: periodParam(key), index: idx || {} })}<div class="f-cat"><label for="f-cat" class="f-label">Catégorie</label><span class="c-select"><select id="f-cat" data-param="c"><option value="toutes">Toutes les catégories</option>${
    cats.map(([k, v]) => html`<option value="${k}"${k === c ? html` selected` : ''}>${v}</option>`)}</select></span></div></div></div>`;
  const res = p === 'jour' ? dayBody(ctx, c, f) : idx ? await periodBody(ctx, key, idx[key], c) : { count: 0, body: renderError('L’index des périodes') };
  const label = p === 'jour' ? 'jour' : periodLabel(key);
  return {
    title: 'Classements',
    announce: `${res.count} ${plural(res.count, 'produit', 'produits')}, ${label}, ${c === 'toutes' ? 'toutes catégories' : catLabel(meta, c)}`,
    html: html`<div class="container page-head"><h1 tabindex="-1">Classements</h1><p class="lede">Les produits les plus présents en tête des Meilleures ventes Amazon.</p></div>${filters}<div class="container page" data-market="${m}">${res.body}</div>`,
    after: (root) => mountSparks(root, meta),
  };
}
