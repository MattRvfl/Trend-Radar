// Articles hebdo : liste (#/articles) et article (#/articles/<AAAA-Wss>), filtré par le marché global.
import { html, fr, safeURL } from '../escape.js';
import { build } from '../router.js';
import { getArticleIndex, getArticle, getMeta, isArticleId } from '../data.js';
import { dFull, dLong, dShort, no, num, price, dec1, plural, parisDay, traffic } from '../format.js';
import { renderEmpty, renderError, renderNote } from '../components/states.js';
import { renderSource, periodWhen, amazonName } from '../components/source.js';
import { icon, thumb } from '../components/ui.js';
import { SHORT_WARNING } from '../components/panel.js';

const MARKET_NAMES = { FR: 'France', US: 'États-Unis' };
const noYear = (iso) => dFull(iso).replace(/\s\d{4}$/, '');

/** « 7 relevés du 28 septembre au 4 octobre 2026 » ; « 1 relevé, le 3 octobre 2026 ». */
export function periodText(p) {
  if (!p || !p.from || !p.to) return '';
  const n = typeof p.days === 'number' ? p.days : null;
  const count = n === null ? 'Relevés' : `${num(n)} ${plural(n, 'relevé', 'relevés')}`;
  if (p.from === p.to) return `${count}, le ${dFull(p.to)}`;
  const from = p.from.slice(0, 4) === p.to.slice(0, 4) ? noYear(p.from) : dFull(p.from);
  return `${count} du ${from} au ${dFull(p.to)}`;
}
/** « lundi 5 octobre » (+ année si autre que l'année en cours) à partir d'un horodatage ISO. */
export function publishedText(ts) {
  const d = new Date(ts || NaN);
  return Number.isNaN(d.getTime()) ? '' : dLong(parisDay(d));
}
const weekNo = (id) => Number(id.split('-W')[1]);

/** Encart d'inscription (bas de liste et d'article). */
const ctaBlock = () => html`<aside class="nl-cta" aria-labelledby="nl-cta-title"><div><h2 class="h3" id="nl-cta-title">Recevez l'article chaque lundi</h2>
<p>Gratuit, sans publicité, désinscription en un clic. Membre fondateur : inscrivez-vous maintenant, un an offert le jour où Relevé deviendra payant.</p></div>
<a class="btn-primary" href="#/connexion">S'inscrire</a></aside>`;

// ---- Liste ----
async function list() {
  let idx;
  try { idx = await getArticleIndex(); } catch (e) {
    console.error(e);
    return { title: 'Articles', html: html`<div class="container page narrow"><div class="page-head"><h1 tabindex="-1">Articles</h1></div>${renderError('La liste des articles')}</div>` };
  }
  const body = idx.length
    ? html`<ol class="art-list">${idx.map((a, i) => html`<li><article class="art-card${i === 0 ? ' is-lead' : ''}">
<p class="kicker">${i === 0 ? 'Dernier article · ' : ''}Semaine ${weekNo(a.id)}${a.published ? ` · publié le ${publishedText(a.published)}` : ''}</p>
<h2><a href="#/articles/${a.id}">${fr(a.title || `Semaine ${weekNo(a.id)}`)}</a></h2>
${a.period ? html`<p class="art-period num">${periodText(a.period)}</p>` : ''}
${a.summary ? html`<p class="art-sum">${fr(a.summary)}</p>` : ''}</article></li>`)}</ol>`
    : renderEmpty({
      title: 'Pas encore d’article',
      text: 'Le premier article paraîtra dès que nous aurons 5 jours de relevés. Il sera publié ici, et envoyé le lundi aux inscrits.',
      action: html`<a class="btn" href="#/connexion">Être prévenu</a>`,
    });
  return {
    title: 'Articles',
    html: html`<div class="container page narrow articles"><div class="page-head"><h1 tabindex="-1">Articles</h1>
<p class="lede">Chaque semaine, ce qui a bougé dans les classements : montées, nouveaux venus, indéboulonnables. Écrit à partir des seuls relevés réels.</p></div>
${body}${idx.length ? ctaBlock() : ''}</div>`,
  };
}

// ---- Article ----
function sectionSource(s, period) {
  const when = period ? periodWhen(period.from, period.to) : '';
  if (s.type === 'buzz') return renderSource({ src: 'gtrends', name: 'Google Trends, Tendances du moment', when });
  if (s.type === 'shopify') return renderSource({ src: 'shopify', name: 'Boutiques Shopify, meilleures ventes', when });
  return renderSource({ src: 'amazon', name: `${amazonName(s.market)} Meilleures ventes`, when });
}

const tag = (text, sr) => html`<span class="c-tag"${sr ? html` data-tip="${sr}"` : ''}><span aria-hidden="true">${fr(text)}</span><span class="sr-only">${fr(sr || text)}</span></span>`;

/** Méta selon le type de section (§7.3 : icône + signe + texte, jamais la couleur seule). */
function itemMeta(type, it) {
  const r = (v) => (typeof v === 'number' ? v : null);
  if (type === 'climbers' && r(it.change)) {
    const words = `${it.change} ${plural(it.change, 'place', 'places')}`;
    const sr = `Gagne ${words} : ${no(it.rank_before)} → ${no(it.rank_now)}`;
    return html`<span class="c-delta is-up" data-tip="${sr}">${icon('i-up')}<span aria-hidden="true">+${words}</span><span class="sr-only">${sr}</span></span><span class="num" aria-hidden="true">${no(it.rank_before)} → ${no(it.rank_now)}</span>`;
  }
  if (type === 'newcomers') {
    const best = r(it.best_rank) && r(it.rank_now) && it.best_rank < it.rank_now ? ` · meilleur ${no(it.best_rank)} cette semaine` : '';
    return html`<span class="c-delta is-new">${icon('i-new')}<span aria-hidden="true">Nouveau</span><span class="sr-only">Nouveau dans le top 30</span></span><span class="num">${no(it.rank_now)} ce matin${best}</span>`;
  }
  if (type === 'leaders') {
    const d = r(it.days) || 0;
    return tag(`N° 1 · ${d} j`, `N° 1 de sa catégorie chacun des ${d} ${plural(d, 'jour relevé', 'jours relevés')}`);
  }
  if (type === 'rush') {
    const b = String(it.brand || '');
    const name = b.charAt(0).toUpperCase() + b.slice(1);
    return tag(`${name} : ${it.share} des ${it.of} premières places`);
  }
  if (type === 'shopify') return tag(`${it.store || 'Boutique'} · ${no(it.rank_now)}`, `${no(it.rank_now)} des meilleures ventes de la boutique ${it.store || ''}`);
  return '';
}

function productItem(s, it, cats) {
  const t = it.title || 'Produit sans titre';
  const cat = (cats && cats[it.category]) || '';
  const lang = s.market === 'US' ? html` lang="en"` : '';
  const shop = s.type === 'shopify' ? (it.store || 'la boutique') : amazonName(s.market);
  const rating = typeof it.rating === 'number'
    ? ` · ★ ${dec1(it.rating)}${typeof it.reviews === 'number' ? ` (${num(it.reviews)} avis)` : ''}` : '';
  const u = safeURL(it.url);
  const title = u
    ? html`<a class="ai-link" href="${u}" target="_blank" rel="noopener noreferrer"${lang}>${t}${icon('i-ext', 'ic-ext')}<span class="sr-only"> (voir sur ${shop}, nouvel onglet)</span></a>`
    : html`<span${lang}>${t}</span>`;
  return html`<li class="ai">${thumb(it.image, 72, cat || t, { cls: 'ai-img' })}<div class="ai-body">
<p class="ai-meta">${itemMeta(s.type, it)}</p><h3 class="ai-title" title="${t}">${title}</h3>
<p class="ai-sub num">${[cat, price(it.price, s.market)].filter((x) => x && x !== '—').join(' · ')}${rating}</p></div></li>`;
}

const buzzItem = (s, it) => html`<li class="ai-buzz"><span class="buzz-term"${s.market === 'US' ? html` lang="en"` : ''}>« ${it.title || '—'} »</span>
<span class="buzz-vol num">${traffic(it.traffic_label)}</span>${it.day ? html`<span class="buzz-meta">pic le ${dShort(it.day)}</span>` : ''}</li>`;

async function article(ctx, id) {
  const { m } = ctx;
  const back = html`<a class="back-link" href="#/articles">${icon('i-back')}Tous les articles</a>`;
  const shell = (inner) => html`<div class="container page narrow">${back}${inner}</div>`;
  if (!isArticleId(id)) {
    return { title: 'Article introuvable', html: shell(html`<h1 tabindex="-1" class="sr-only">Article introuvable</h1>${renderEmpty({ title: 'Article introuvable', text: "Cette adresse ne correspond à aucun article. Il a peut-être été renommé." })}`) };
  }
  const [res, meta, idx] = await Promise.all([
    getArticle(id).then((a) => ({ a }), (e) => ({ e })),
    ctx.meta ? Promise.resolve(ctx.meta) : getMeta().catch(() => null),
    getArticleIndex().catch(() => []),
  ]);
  if (res.e || !res.a || !Array.isArray(res.a.sections)) {
    const missing = res.e && /HTTP 404/.test(res.e.message);
    if (!missing && res.e) console.error(res.e);
    return {
      title: 'Article introuvable',
      html: shell(html`<h1 tabindex="-1" class="sr-only">Article</h1>${missing
        ? renderEmpty({ title: 'Article introuvable', text: "Cet article n'existe pas ou n'est pas encore publié." })
        : renderError("L'article")}`),
    };
  }
  const a = res.a;
  const cats = meta && meta.categories;
  const other = m === 'US' ? 'FR' : 'US';
  const secs = a.sections.filter((s) => s && s.market === m && Array.isArray(s.items) && s.items.length);
  const hasOther = a.sections.some((s) => s && s.market === other && Array.isArray(s.items) && s.items.length);
  const switchLink = hasOther ? html` · <a href="${build('articles', { m: other }, id)}">Lire l'édition ${MARKET_NAMES[other]}</a>` : '';

  const editorial = typeof a.editorial === 'string' && a.editorial.trim()
    ? html`<section class="art-edito" aria-label="Édito">${a.editorial.trim().split(/\n\s*\n/).map((p) => html`<p>${fr(p.replace(/\s*\n\s*/g, ' '))}</p>`)}</section>` : '';

  const toc = secs.length > 2
    ? html`<nav class="art-toc" aria-label="Dans cet article"><p class="kicker">Dans cet article</p><ol>${secs.map((s, i) => html`<li><button type="button" class="link-btn" data-jump="sec-${i}">${fr(s.title || '')}</button></li>`)}</ol></nav>` : '';

  const body = secs.length
    ? secs.map((s, i) => html`<section class="art-sec" aria-labelledby="sec-${i}"><h2 id="sec-${i}" tabindex="-1">${fr(s.title || '')}</h2>
${s.intro ? html`<p class="art-intro">${fr(s.intro)}</p>` : ''}
<ol class="ai-list${s.type === 'buzz' ? ' is-buzz' : ''}">${s.items.map((it) => (s.type === 'buzz' ? buzzItem(s, it) : productItem(s, it, cats)))}</ol>
${sectionSource(s, a.period)}</section>`)
    : renderEmpty({ title: 'Rien pour ce marché', text: `Cet article ne contient pas de section pour ${MARKET_NAMES[m]}.`, action: hasOther ? html`<a class="btn" href="${build('articles', { m: other }, id)}">Lire l'édition ${MARKET_NAMES[other]}</a>` : '' });

  const pos = idx.findIndex((x) => x.id === id);
  const older = pos >= 0 ? idx[pos + 1] : null;
  const newer = pos > 0 ? idx[pos - 1] : null;
  const pager = older || newer
    ? html`<nav class="art-pager" aria-label="Autres articles">${older ? html`<a class="prev" href="#/articles/${older.id}"><span class="kicker">Article précédent</span>${fr(older.title || older.id)}</a>` : html`<span></span>`}${
      newer ? html`<a class="next" href="#/articles/${newer.id}"><span class="kicker">Article suivant</span>${fr(newer.title || newer.id)}</a>` : ''}</nav>` : '';

  const published = publishedText(a.published);
  return {
    title: a.title || 'Article',
    html: shell(html`<article class="art">
<header class="art-head"><p class="kicker">Article hebdo · Semaine ${weekNo(id)}</p><h1 tabindex="-1">${fr(a.title || `Semaine ${weekNo(id)}`)}</h1>
<p class="art-byline num">${published ? `Publié le ${published} · ` : ''}${periodText(a.period)}</p>
<p class="art-byline">Édition ${MARKET_NAMES[m]}${switchLink}</p>
${renderNote('info', SHORT_WARNING)}</header>
${editorial}${toc}${body}</article>
${ctaBlock()}${pager}`),
    after: (root) => {
      root.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
        const h = root.querySelector(`#${b.dataset.jump}`);
        if (!h) return;
        h.scrollIntoView({ block: 'start' });
        h.focus({ preventScroll: true });
      }));
    },
  };
}

export function articles(ctx) {
  return ctx.r.sub ? article(ctx, ctx.r.sub) : list(ctx);
}
