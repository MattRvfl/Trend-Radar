// Vue Buzz (§6.7) : recherches Google qui s'envolent, une liste par marché. Pas d'image.
import { html } from '../escape.js';
import { traffic, relTime } from '../format.js';
import { renderSegmented } from '../components/segmented.js';
import { renderSource } from '../components/source.js';
import { renderUnavailable } from '../components/states.js';
import { extLink, icon } from '../components/ui.js';

export function buzzList(items, { compact = false, lang = '' } = {}) {
  return html`<ol class="buzz-list${compact ? ' compact' : ''}">${items.map((it) => {
    const when = relTime(it.published);
    const news = it.news_title ? extLink(it.news_url, it.news_title, '', 'news') : '';
    return html`<li value="${it.rank}"><span class="num rank">${it.rank}</span><span class="buzz-body"><span class="buzz-term"${lang ? html` lang="${lang}"` : ''}>« ${it.title || '—'} »</span><span class="buzz-vol num">${traffic(it.traffic_label)}</span>${
      !compact && (when || news) ? html`<span class="buzz-meta">${when || ''}${when && news ? ' · ' : ''}${news}</span>` : ''}</span></li>`;
  })}</ol>`;
}

export async function buzz(ctx) {
  const { meta, latest, m } = ctx;
  const gs = (meta.sources && meta.sources.gtrends) || {};
  const order = m === 'US' ? ['US', 'FR'] : ['FR', 'US'];
  const cols = order.map((mk) => {
    const l = (latest.gtrends || []).find((x) => x.market === mk);
    const name = (meta.markets && meta.markets[mk]) || mk;
    const body = l && (l.items || []).length
      ? buzzList(l.items, { lang: mk === 'US' ? 'en' : '' })
      : renderUnavailable({ name: 'Google Trends', last: gs.last_success, errors: gs.errors || [] });
    return html`<section class="module buzz-col" data-mk="${mk}"${mk === order[0] ? '' : html` data-alt`}><h2 class="h3">${name}</h2>${body}${
      renderSource({ src: 'gtrends', name: 'Google Trends, Tendances du moment', at: gs.collected_at, url: l && l.source_url })}</section>`;
  });
  return {
    title: 'Buzz',
    html: html`<div class="container page"><div class="page-head"><h1 tabindex="-1">Buzz</h1><p class="lede">Les recherches Google qui s'envolent aujourd'hui, tous sujets confondus.</p>
<p class="c-note is-info">${icon('i-info')}<span>Toutes les recherches qui s'envolent (actualité, sport, produits…). Volume approximatif fourni par Google.</span></p></div>
<div class="buzz-switch">${renderSegmented({
      name: 'buzz-m', legend: 'Pays affiché', value: order[0],
      options: order.map((mk) => ({ value: mk, label: (meta.markets && meta.markets[mk]) || mk })),
    })}</div>
<div class="buzz-grid" data-show="${order[0]}">${cols}</div></div>`,
  };
}
