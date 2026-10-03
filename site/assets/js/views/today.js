// Vue Aujourd'hui (§6.2, §10) : « Qu'est-ce qui bouge ce matin ? »
import { html } from '../escape.js';
import { build } from '../router.js';
import { dLong, dShort, num, no, price, dec1, plural } from '../format.js';
import { renderList } from '../components/row.js';
import { renderCard } from '../components/card.js';
import { renderDelta, renderStreak } from '../components/delta.js';
import { renderSource, amazonName } from '../components/source.js';
import { renderEmpty, renderPending, renderUnavailable } from '../components/states.js';
import { SHORT_WARNING } from '../components/panel.js';
import { icon } from '../components/ui.js';
import { dayItems, dayCols, catLabel, missingNote, mountSparks } from './rankings.js';
import { buzzList } from './buzz.js';

const mod = (title, more, body, source) => html`<section class="module"><div class="block-head"><h2>${title}</h2>${more || ''}</div>${body}${source || ''}</section>`;

export async function today(ctx) {
  const { meta, latest, m } = ctx;
  const all = dayItems(latest, m);
  const lists = (latest.amazon || []).filter((l) => l.market === m && (l.items || []).length);
  const shop = amazonName(m);
  const at = meta.sources && meta.sources.amazon && meta.sources.amazon.collected_at;
  const src = (name = `${shop} Meilleures ventes`) => renderSource({ src: 'amazon', name, at, compared: latest.compared_to });
  const days = meta.days_collected || 0;
  const cmp = Boolean(latest.compared_to);
  const market = (meta.markets && meta.markets[m]) || m;

  let main;
  if (!lists.length) {
    const s = (meta.sources && meta.sources.amazon) || {};
    main = renderUnavailable({ name: 'Amazon', last: s.last_success, errors: s.errors || [] });
  } else {
    // Les modules qui ont besoin d'historique ne s'affichent qu'une fois calculables ;
    // en attendant, une ligne chacun dans « À venir » (pas de grande boîte vide).
    const ready = [];
    const pending = [];
    const patience = (need) => `Encore ${need - days} ${need - days > 1 ? 'jours' : 'jour'} de patience : il faut ${need} relevés, nous en avons ${days}.`;
    const rating = (it) => (typeof it.rating === 'number' ? ` · ★ ${dec1(it.rating)}` : '');

    if (cmp) {
      // Entrées du jour
      const fresh = all.filter((it) => it.new === true).sort((a, b) => a.rank - b.rank);
      const entries = fresh.length
        ? html`<div class="card-grid">${fresh.slice(0, 8).map((it, i) => renderCard({
          title: it.title, image: it.image, href: it._href, over: catLabel(meta, it._c), badge: renderDelta(it), initial: catLabel(meta, it._c),
          line: `${no(it.rank)} · ${price(it.price, m)}${rating(it)}`,
          eager: i < 4, lang: m === 'US' ? 'en' : '',
        }))}</div>`
        : renderEmpty({ title: 'Aucun produit ici', text: 'Aucun nouveau produit dans les top 30 ce matin.' });
      const seeNew = fresh.length ? html`<a class="btn-ghost" href="${build('classements', { m, p: 'jour', c: 'toutes', f: 'nouveaux' })}">Tout voir (${num(fresh.length)}) ›</a>` : '';
      ready.push(mod('Entrées du jour', seeNew, entries, src()));

      // Plus fortes hausses depuis hier
      const ups = all.filter((it) => it.change > 0).sort((a, b) => b.change - a.change || a.rank - b.rank);
      const colsFlat = dayCols(ctx, { cat: true, catCol: false, week: false, streak: false, note: false });
      const upsBody = ups.length
        ? renderList({ variant: 'day', cols: colsFlat, items: ups.slice(0, 10), label: 'Plus fortes hausses depuis hier', open: ctx.open })
        : renderEmpty({ title: 'Aucun produit ici', text: 'Aucune hausse de rang depuis hier.' });
      const seeUps = ups.length > 10 ? html`<a class="btn-ghost" href="${build('classements', { m, p: 'jour', c: 'toutes', f: 'hausses' })}">Tout voir ›</a>` : '';
      ready.push(mod('Plus fortes hausses depuis hier', seeUps, upsBody, src()));
    } else {
      pending.push({ names: ['Entrées du jour', 'Plus fortes hausses depuis hier'], text: "Les variations arrivent demain : il faut deux relevés pour comparer, le premier date d'aujourd'hui." });
    }

    // Montées sur 7 jours (il faut le relevé d'il y a 7 jours : 8 jours collectés)
    if (days < 8) pending.push({ names: ['Montées sur 7 jours'], text: patience(8) });
    else {
      const w = all.filter((it) => it.change_7d > 0).sort((a, b) => b.change_7d - a.change_7d || a.rank - b.rank);
      ready.push(mod('Montées sur 7 jours', '', w.length
        ? renderList({ variant: 'day', cols: dayCols(ctx, { cat: true, catCol: false, week: true, streak: false, note: false }), items: w.slice(0, 10), label: 'Montées sur 7 jours', open: ctx.open })
        : renderEmpty({ title: 'Aucun produit ici', text: 'Aucune montée sur 7 jours.' }), src()));
    }

    // Toujours en tête
    if (days < 7) pending.push({ names: ["Toujours en tête (n° 1 à 3 depuis 7 jours d'affilée)"], text: patience(7) });
    else {
      const t = all.filter((it) => it.rank <= 3 && it.streak >= 7).sort((a, b) => b.streak - a.streak || a.rank - b.rank);
      ready.push(mod('Toujours en tête', html`<span class="muted small">n° 1 à 3 depuis 7 jours d'affilée ou plus</span>`, t.length
        ? renderList({ variant: 'day', cols: dayCols(ctx, { cat: true, catCol: false, week: false, streak: true, note: false }), items: t.slice(0, 10), label: 'Toujours en tête', open: ctx.open })
        : renderEmpty({ title: 'Aucun produit ici', text: 'Aucun produit n’est resté dans les 3 premiers 7 jours d’affilée.' }), src()));
    }

    // N° 1 par catégorie : toujours disponible, dès le premier relevé (en tête de page tant qu'il est seul).
    const first = !ready.length;
    const tops = Object.keys(meta.categories || {}).map((c) => all.find((it) => it._c === c && it.rank === 1)).filter(Boolean);
    const tiles = html`<div class="card-grid tiles">${tops.map((it, i) => renderCard({
      title: it.title, image: it.image, href: it._href, over: catLabel(meta, it._c), initial: catLabel(meta, it._c),
      badge: cmp && (it.new === true || typeof it.change === 'number') ? renderDelta(it)
        : it.streak >= 2 ? renderStreak(it.streak, ' dans le top 30') : '',
      line: `${price(it.price, m)}${rating(it)}`, eager: first && i < 4, lang: m === 'US' ? 'en' : '',
    }))}</div>`;
    const seeAll = html`<a class="btn-ghost" href="${build('classements', { m, p: 'jour', c: 'toutes' })}">Tout voir ›<span class="sr-only"> les classements du jour</span></a>`;
    ready.push(mod('N° 1 par catégorie', seeAll, html`${first ? html`<p class="list-meta">Le produit en tête des Meilleures ventes de chaque catégorie, ce matin.</p>` : ''}${tiles}`, src()));

    main = html`${missingNote(meta, latest, m)}
${ready}
${pending.length ? html`<section class="module" aria-labelledby="pending-title"><div class="block-head"><h2 class="h3" id="pending-title">À venir</h2></div>${renderPending(pending)}</section>` : ''}`;
  }

  // Colonne latérale : Buzz Google (TikTok n'est plus relevé : pas de module vide).
  const g = (latest.gtrends || []).find((l) => l.market === m);
  const gs = meta.sources && meta.sources.gtrends;
  const aside = html`<section class="module side"><div class="block-head"><h2 class="h3">Buzz Google · ${market}</h2><a class="btn-ghost" href="${build('buzz', { m })}">Voir ›</a></div>${
    g && (g.items || []).length ? buzzList(g.items.slice(0, 5), { compact: true })
      : renderUnavailable({ name: 'Google Trends', last: gs && gs.last_success, compact: true })}${
    renderSource({ src: 'gtrends', name: 'Google Trends', at: gs && gs.collected_at })}</section>`;

  const count = all.length;
  return {
    title: "Aujourd'hui",
    docTitle: 'Relevé · Ce qui grimpe dans les classements, ce matin',
    html: html`<div class="container page today">
<div class="page-head"><h1 tabindex="-1">Relevé du ${dLong(latest.date)}</h1>
<p class="lede num">${num(count)} ${plural(count, 'produit', 'produits')} · ${lists.length} catégories · ${market} · ${cmp ? `comparé au ${dShort(latest.compared_to)}` : 'premier relevé, pas encore de comparaison'}</p>
<p class="c-note is-info">${icon('i-info')}<span>${SHORT_WARNING} <a href="#/methode">En savoir +</a></span></p></div>
<div class="today-grid"><div class="today-main">${main}</div><aside class="today-side" aria-label="Autres sources">${aside}</aside></div></div>`,
    after: (root) => mountSparks(root, meta),
  };
}
