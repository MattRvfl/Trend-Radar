// Panneau produit (§7.12) : contenu du <dialog id="panel"> (identité, KPI, courbe, périodes, source).
import { html, fr } from '../escape.js';
import { no, price, dec1, num, dShort, plural, DASH } from '../format.js';
import { renderDelta } from './delta.js';
import { renderSegmented } from './segmented.js';
import { renderSource, amazonName } from './source.js';
import { renderEmpty } from './states.js';
import { icon, thumb, extLink } from './ui.js';

export const SHORT_WARNING = fr("Un classement n'est pas un volume de ventes. Le n° 1 est le produit le plus vendu de sa catégorie au moment du relevé, sans dire combien.");

const kpi = (label, value, extra = '') =>
  html`<div class="kpi"><p class="kpi-label">${label}</p><p class="kpi-value num">${value}</p>${extra ? html`<p class="kpi-extra">${extra}</p>` : ''}</div>`;

export function renderPanel(d) {
  const shop = amazonName(d.m);
  const t = d.title || 'Produit sans titre';
  const it = d.item;
  const rating = typeof d.rating === 'number'
    ? html`<span class="num">${dec1(d.rating)}</span> ★${typeof d.reviews === 'number' ? html` <span class="num">(${num(d.reviews)} ${plural(d.reviews, 'avis', 'avis')})</span>` : ''}`
    : DASH;
  const curve = d.hasCurve
    ? html`<div class="curve-head"><h3>Rang jour par jour</h3>${renderSegmented({
      name: 'plage', legend: 'Plage de la courbe', value: d.range, param: 'r',
      options: [{ value: '7j', label: '7 j', sr: '7 jours' }, { value: '30j', label: '30 j', sr: '30 jours' }, { value: 'tout', label: 'Tout', sr: "Tout l'historique" }],
    })}</div><div class="chart-host" id="chart-host"></div><p class="chart-legend"><span class="lg-hatch" aria-hidden="true"></span>jour non relevé <span class="lg-absent" aria-hidden="true"></span>absent du top 30</p><p class="sr-only" aria-live="polite" id="chart-live"></p><details class="chart-data"><summary>Voir les données</summary><div id="chart-table"></div></details>`
    : html`<h3>Rang jour par jour</h3>${renderEmpty({ title: 'Pas encore de courbe', text: 'La courbe apparaîtra après deux relevés de ce produit.' })}`;
  return html`<div class="panel-head"><button type="button" class="back-btn" data-action="close-panel">${icon('i-back')}Retour</button><p class="panel-src"><span class="dot dot-amazon" aria-hidden="true"></span>${shop} · ${d.catLabel}</p><button type="button" class="icon-btn" data-action="close-panel" aria-label="Fermer">${icon('i-close')}</button></div>
<div class="panel-body">
<div class="panel-id">${thumb(d.image, 120, d.catLabel, { cls: 'panel-img' })}<div><h2 id="panel-title" tabindex="-1"${d.m === 'US' ? html` lang="en"` : ''}>${t}</h2><p class="muted">${d.catLabel} · ${d.m}</p>${
  extLink(d.url, `Voir sur ${shop}`, '', 'btn-primary')}<a class="btn pf-link" href="#/rentabilite?m=${d.m}&c=${encodeURIComponent(d.c)}&id=${encodeURIComponent(d.id)}">Calculer la rentabilité</a></div></div>
<div class="kpis">
${kpi("Rang aujourd'hui", it ? html`${no(it.rank)}${it.new === true || typeof it.change === 'number' ? html` ${renderDelta(it)}` : ''}` : DASH,
    it ? (it.new === true || typeof it.change === 'number' ? '' : 'pas encore de comparaison') : "absent du top 30 aujourd'hui")}
${kpi('Meilleur', d.best ? no(d.best) : DASH, d.bestDay ? `le ${dShort(d.bestDay)}` : '')}
${kpi('Dans le top 30', it && it.streak ? `${it.streak}\u00a0j` : DASH, it && it.streak ? "d'affilée" : '')}
${kpi('Prix', price(d.price, d.m))}
</div>
<p class="rating">${rating}</p>
<section class="panel-curve" aria-label="Rang jour par jour">${curve}</section>
<section class="panel-periods"><h3>Dans les classements de période</h3>${
  d.periods.length ? html`<dl>${d.periods.map((p) => html`<div><dt>${p.label}</dt><dd class="num">${p.text}</dd></div>`)}</dl>`
    : html`<p class="muted">—</p>`}<p class="muted small">Rang parmi les 50 premiers produits, toutes catégories.</p></section>
${renderSource({ src: 'amazon', name: `${shop} Meilleures ventes, ${d.catLabel}`, at: d.sourceAt, url: d.sourceUrl })}
<p class="c-note is-info">${icon('i-info')}<span>${SHORT_WARNING}</span></p>
<div class="panel-nav"><button type="button" class="btn" data-action="prev"${d.prev ? '' : html` disabled`}>${icon('i-back')}Produit précédent</button><button type="button" class="btn" data-action="next"${d.next ? '' : html` disabled`}>Produit suivant${icon('i-chev')}</button></div>
</div>`;
}
