// Reproduction du site Relevé (thème sombre) pour la visite du produit : en-tête, vues, panneau produit.
// Mises en page d'après design/DESIGN.md §6-§7 et le rendu réel du site, avec les vraies données.
import { DATA } from '../data.js';
import { icon, fr, price } from './core.js';
import { delta, thumb, esc, CAT_ICON } from './ui.js';

export const BW = 1600, BH = 900, CHROME = 44;

// Mini-courbe 14 jours (§8.2) : domaine fixe [1, 30] inversé, bande top 10, dernier point en accent.
export function sparkline(ranks, w = 72, hgt = 22) {
  const n = ranks.length, y = (r) => 1 + (r - 1) / 29 * (hgt - 2), x = (i) => 2 + i * (w - 4) / (n - 1);
  const segs = []; let cur = [];
  ranks.forEach((r, i) => { if (r == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push(`${x(i).toFixed(1)},${y(r).toFixed(1)}`); });
  if (cur.length) segs.push(cur);
  const li = ranks.length - 1, last = ranks[li];
  return `<svg class="spark" viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}">
    <rect class="sp-band" x="0" y="1" width="${w}" height="${(y(10) - 1).toFixed(1)}"/>
    ${segs.filter((s) => s.length > 1).map((s) => `<polyline class="sp-l" points="${s.join(' ')}"/>`).join('')}
    ${last != null ? `<circle class="sp-d" cx="${x(li).toFixed(1)}" cy="${y(last).toFixed(1)}" r="2.6"/>` : ''}</svg>`;
}

export function header() {
  return `<header class="sh">
    <div class="sh-logo">${icon('site-logo-mark')}<b>Relevé</b></div>
    <nav class="sh-tabs">${[['today', "Aujourd'hui"], ['rank', 'Classements'], ['stores', 'Boutiques'], ['buzz', 'Buzz'], ['articles', 'Articles'], ['method', 'Méthode']]
      .map(([k, l]) => `<span class="tab" data-tab="${k}">${l}</span>`).join('')}<i class="tab-ul"></i></nav>
    <div class="sh-r"><span class="seg mk"><i class="seg-p"></i><b data-m="FR">FR</b><b data-m="US">US</b></span>
      <span class="ib theme-btn">${icon('site-i-theme')}</span><span class="login">${icon('site-i-user')}Se connecter</span></div>
  </header>
  <div class="sbar"><span>Sources du 8 oct.</span>
    <span class="st">${icon('site-i-partial', 'w')}<i class="dot amazon"></i>Amazon <em>14:10</em> partiel</span><span class="sep">·</span>
    <span class="st">${icon('site-i-ok', 'ok')}<i class="dot shopify"></i>Shopify <em>14:19</em></span><span class="sep">·</span>
    <span class="st">${icon('site-i-ban', 'mu')}<i class="dot tiktok"></i>TikTok non disponible</span><span class="sep">·</span>
    <span class="st">${icon('site-i-ok', 'ok')}<i class="dot google"></i>Google <em>14:19</em></span><span class="info">${icon('site-i-info')}</span></div>`;
}

const card = (it) => `<article class="card"><div class="over">${esc(it.cat)}</div><div class="cimg">${icon(CAT_ICON[it.category])}</div>
  <div class="cb">${delta(it)}</div><div class="ct">${esc(it.title)}</div>
  <div class="cl num">n° ${it.rank} · ${price(it.price, it.market)}${it.rating ? ` · ★ ${String(it.rating).replace('.', ',')}` : ''}</div></article>`;

const srcLine = (s, txt) => `<div class="src"><i class="dot ${s}"></i>${txt}</div>`;

export function rowDay(it, { open = false } = {}) {
  return `<div class="r${open ? ' open' : ''}"><span class="rk num">${it.rank}</span><span class="rv">${delta(it)}</span>${thumb(it.category, 44)}
    <span class="rt"><span class="t2">${esc(it.title)}</span></span>
    <span class="rs num">${it.streak ? `${it.streak} j` : '—'}</span><span class="rp num">${price(it.price, it.market)}</span>
    <span class="rn num">${it.rating ? `${String(it.rating).replace('.', ',')} (${new Intl.NumberFormat('fr-FR').format(it.reviews || 0)})` : '—'}</span>
    <span class="rsp">${sparkline(it.spark || [])}</span><span class="rx">${icon('site-i-ext')}</span></div>`;
}
const HEAD_DAY = '<div class="rh"><span class="rk">Rang</span><span class="rv">Var. 24 h</span><span class="th"></span><span class="rt">Produit</span><span class="rs">Série</span><span class="rp">Prix</span><span class="rn">Note (avis)</span><span class="rsp">14 jours</span><span class="rx"></span></div>';

export function rowScore(it, i, market, max) {
  return `<div class="r"><span class="rk num">${i + 1}</span>${thumb('jouets', 44)}<span class="rt"><span class="t2">${esc(it.title)}</span></span>
    <span class="rsc"><b class="num">${it.points}</b><i class="bar"><i style="--f:${(it.points / max).toFixed(3)}"></i></i></span>
    <span class="rpr num">${it.days}/${DATA.r7_meta.days_covered} j</span><span class="rb num">n° ${it.best}</span><span class="rp num">${price(it.price, market)}</span><span class="rx">${icon('site-i-ext')}</span></div>`;
}
const HEAD_SCORE = '<div class="rh"><span class="rk">Rang</span><span class="th"></span><span class="rt">Produit</span><span class="rsc">Score</span><span class="rpr">Présence</span><span class="rb">Meilleur</span><span class="rp">Prix</span><span class="rx"></span></div>';

export function viewToday() {
  const news = DATA.news.slice(0, 4);
  const ups = DATA.ups.slice(0, 6);
  const buzz = DATA.gtrends.FR.slice(0, 6);
  return `<div class="view v-today"><div class="scroller">
    <h1>Relevé du jeudi 8 octobre</h1>
    <p class="meta num">${DATA.counts.fr_products} produits · ${DATA.counts.fr_categories} catégories · France · comparé au 7 oct.</p>
    <div class="note">${icon('site-i-info')}<span>${fr("Un classement n'est pas un volume de ventes. Le n° 1 est le produit le plus vendu de sa catégorie au moment du relevé, sans dire combien.")} <u>En savoir +</u></span></div>
    <div class="tgrid"><div class="tmain">
      <div class="mh"><h2>Entrées du jour</h2><span class="more">Tout voir (81) ›</span></div>
      <div class="cards">${news.map(card).join('')}</div>
      ${srcLine('amazon', 'Amazon.fr Meilleures ventes · relevé le 8 oct. à 14:10')}
      <div class="mh mh2"><h2>Plus fortes hausses depuis hier</h2><span class="more">Tout voir ›</span></div>
      <div class="list ups">${HEAD_DAY}${ups.map((it) => rowDay(it)).join('')}</div>
    </div>
    <aside class="taside"><div class="mh"><h3>Buzz Google · France</h3><span class="more">Voir ›</span></div>
      ${buzz.map((b, i) => `<div class="bz"><span class="num bk">${i + 1}</span><span class="bt">${esc(fr(`« ${b.title} »`))}</span><span class="num bv">${b.traffic.replace(/(\d)(\d{3})\+/, '$1 $2+')} recherches</span></div>`).join('')}
      ${srcLine('google', 'Google Trends · relevé le 8 oct. à 14:19')}</aside></div>
  </div></div>`;
}

export function viewRank() {
  const sante = DATA.lists['FR-sante'].slice(0, 8);
  const jouets = DATA.lists['FR-jouets'].slice(0, 8);
  const r7fr = DATA.r7['FR-jouets'], r7us = DATA.r7['US-jouets'];
  const max = 30 * DATA.r7_meta.days_covered;
  return `<div class="view v-rank">
    <h1>Classements</h1><p class="sub">Les produits les plus présents en tête des Meilleures ventes Amazon.</p>
    <div class="filters"><span class="seg per"><i class="seg-p"></i>${['Jour', '7 j', '30 j', 'Mois', 'Année'].map((p) => `<b>${p}</b>`).join('')}</span>
      <span class="lbl">Catégorie</span><span class="sel"><span class="sel-v" data-v="sante">Hygiène et Santé</span><span class="sel-v" data-v="jouets">Jeux et Jouets</span>${icon('site-i-chev')}</span></div>
    <div class="bodies">
      <div class="body b-sante"><div class="per-l">Jour · 8 oct. · comparé au 7 oct.</div><div class="list">${HEAD_DAY}${sante.map((it) => rowDay(it, { open: it.rank === 2 })).join('')}</div></div>
      <div class="body b-jday"><div class="per-l">Jour · 8 oct. · comparé au 7 oct.</div><div class="list">${HEAD_DAY}${jouets.map((it) => rowDay(it)).join('')}</div></div>
      <div class="body b-j7"><div class="per-l cov7">7 derniers jours · 3 oct. → 8 oct. <span class="covg">${Array.from({ length: 7 }, (_, i) => `<i class="${i ? 'on' : ''}"></i>`).join('')}</span> 6 jours relevés sur 7</div>
        <div class="list">${HEAD_SCORE}${r7fr.map((it, i) => rowScore(it, i, 'FR', max)).join('')}</div></div>
      <div class="body b-j7us"><div class="per-l cov7">7 derniers jours · 3 oct. → 8 oct. <span class="covg">${Array.from({ length: 7 }, (_, i) => `<i class="${i ? 'on' : ''}"></i>`).join('')}</span> 6 jours relevés sur 7</div>
        <div class="list">${HEAD_SCORE}${r7us.map((it, i) => rowScore(it, i, 'US', max)).join('')}</div></div>
    </div></div>`;
}

export function viewStores() {
  const pick = ['Stanley', 'Fenty Beauty', 'Kith'].map((n) => DATA.stores.find((s) => s.store === n));
  return `<div class="view v-stores"><h1>Boutiques</h1>
    <p class="sub">${fr('Les meilleures ventes « depuis toujours » de 12 marques Shopify (États-Unis).')}</p>
    <div class="note">${icon('site-i-info')}<span>${fr("Shopify trie sur l'historique complet des ventes : ce sont des produits phares, pas des nouveautés.")}</span></div>
    <div class="stores">${pick.map((s) => `<div class="store"><div class="sth"><b>${esc(s.store)}</b> · ${esc(s.cat)}</div>
      ${s.items.slice(0, 5).map((it) => `<div class="sr"><span class="num sk">${it.rank}</span>${thumb(s.category, 40)}<span class="stt"><span class="t1">${esc(it.title)}</span>${it.type ? `<span class="t3">${esc(it.type)}</span>` : ''}</span><span class="num sp">${price(it.price, 'US')}</span></div>`).join('')}
      <div class="src"><i class="dot shopify"></i><u>${esc(s.host || '')}</u> ↗ · relevé à 14:19</div></div>`).join('')}</div></div>`;
}

export function viewBuzz() {
  const col = (m) => DATA.gtrends[m].slice(0, 6).map((b, i) => `<div class="bzr"><span class="num bk">${i + 1}</span>
    <span class="bzt"><b>${esc(fr(`« ${b.title} »`))}</b><span class="bzn">${esc(b.news || '')}</span></span>
    <span class="num bv">${b.traffic.replace(/(\d)(\d{3})\+/, '$1 $2+')} rech.</span></div>`).join('');
  return `<div class="view v-buzz"><h1>Buzz</h1>
    <p class="sub">Les recherches Google qui s'envolent aujourd'hui, tous sujets confondus (pas seulement des produits).</p>
    <div class="bzcols"><div class="bzc"><div class="bzh">${icon('flag-fr')}France</div>${col('FR')}${srcLine('google', 'Google Trends, Tendances du moment · 14:19')}</div>
      <div class="bzc"><div class="bzh">${icon('flag-us')}États-Unis</div>${col('US')}${srcLine('google', 'Google Trends · 14:19')}</div></div></div>`;
}

// Panneau produit (§7.12) : Philips OneBlade 360, vraie courbe n° 25 → n° 2.
export const CH = { w: 448, h: 200, l: 40, r: 44, t: 10, b: 26 };
export function panel() {
  const c = DATA.curve, ranks = DATA.days.map((d) => c.ranks[d] ?? null);
  const pw = CH.w - CH.l - CH.r, ph = CH.h - CH.t - CH.b - 14;
  const X = (i) => CH.l + i * pw / (ranks.length - 1), Y = (r) => CH.t + (r - 1) / 29 * ph;
  const pts = ranks.map((r, i) => [X(i), Y(r)]);
  const it = DATA.lists['FR-sante'].find((x) => x.title.includes('OneBlade 360 Authentic'));
  const grid = [1, 10, 20, 30].map((r) => `<line class="cg" x1="${CH.l}" x2="${CH.w - CH.r}" y1="${Y(r)}" y2="${Y(r)}"/><text class="cl" x="${CH.l - 6}" y="${Y(r) + 3.5}">n° ${r}</text>`).join('');
  return `<div class="panel">
    <div class="ph"><i class="dot amazon"></i><span>Amazon.fr · ${esc(c.cat)}</span>${icon('site-i-close')}</div>
    <div class="pid">${thumb('sante', 96)}<div class="pit"><div class="pt">${esc(c.title)}</div><div class="pm">${esc(c.cat)} · FR</div></div></div>
    <div class="pbtn">Voir sur Amazon.fr ↗</div>
    <div class="kpis"><div class="k"><span class="kl">Rang aujourd'hui</span><span class="kv num">n° 2 ${delta(it)}</span></div>
      <div class="k"><span class="kl">Meilleur</span><span class="kv num">n° 2</span><span class="ks">le 8 oct.</span></div>
      <div class="k"><span class="kl">Dans le top 30</span><span class="kv num">6 j</span><span class="ks">d'affilée</span></div>
      <div class="k"><span class="kl">Prix</span><span class="kv num">${price(it.price, 'FR')}</span></div></div>
    <div class="pch"><b>Rang jour par jour</b><span class="seg sm"><b>7 j</b><b>30 j</b><b class="on">Tout</b></span></div>
    <svg class="rchart" viewBox="0 0 ${CH.w} ${CH.h}" width="${CH.w}" height="${CH.h}">
      <rect class="cb" x="${CH.l}" y="${Y(1) - 4}" width="${pw}" height="${Y(10) - Y(1) + 8}"/>
      <text class="cbl" x="${CH.w - CH.r + 6}" y="${Y(10) + 3.5}">top 10</text>
      ${grid}
      <line class="ch-hors" x1="${CH.l}" x2="${CH.w - CH.r}" y1="${Y(30) + 12}" y2="${Y(30) + 12}"/><text class="cl" x="${CH.l - 6}" y="${Y(30) + 15}">hors</text>
      <polyline class="cline" points="${pts.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ')}"/>
      ${pts.map((p, i) => `<circle class="cpt${i === pts.length - 1 ? ' last' : ''}" cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="${i === pts.length - 1 ? 4 : 3}"/>`).join('')}
      ${pts.map((p, i) => `<text class="cann" x="${p[0].toFixed(2)}" y="${(p[1] + (i === 0 ? 15 : -9)).toFixed(2)}">n° ${ranks[i]}</text>`).join('')}
      <text class="clast" x="${(pts[pts.length - 1][0] + 8).toFixed(2)}" y="${(pts[pts.length - 1][1] + 4).toFixed(2)}">n° 2</text>
      <text class="cx" x="${CH.l}" y="${CH.h - 4}">3 oct.</text><text class="cx" x="${CH.w - CH.r}" y="${CH.h - 4}" text-anchor="end">8 oct.</text>
    </svg>
    <div class="plg"><span>╱╱ jour non relevé</span><span>○ absent du top 30</span></div>
  </div>`;
}
