// Ligne de classement (§7.1) : <li> dans <ol class="c-rank-list">, colonnes fixes, rang en colonne dédiée.
import { html, raw, safeURL } from '../escape.js';
import { icon } from './ui.js';

export const PAGE = 25;

/**
 * cols : [{ k, label, cls, bp, tip, cell(item, i) }] ; bp = 'sm' | 'md' | 'lg' (colonne visible à partir de 600 / 900 / 1200 px).
 * items : objets portant `_rank`. limit : nombre de lignes visibles avant « Afficher 25 de plus ».
 */
export function renderList({ variant, cols, items, label, limit = 0, head = true, open = '' }) {
  const bp = (c) => (c.bp ? ` bp-${c.bp}` : '');
  const header = head
    ? html`<div class="c-rank-head v-${variant}">${cols.map((c) => html`<span class="cell ${c.cls || ''}${bp(c)}">${
      c.label ? html`<span aria-hidden="true">${c.label}</span>` : ''}${c.tip ? html`<button type="button" class="tip-btn" data-tip="${c.tip}">${icon('i-info')}<span class="sr-only">${c.label} : ${c.tip}</span></button>` : ''}</span>`)}</div>`
    : '';
  const rows = items.map((it, i) => html`<li class="c-row v-${variant}${it._href && it._href === open ? ' is-open' : ''}" value="${it._rank}"${limit && i >= limit ? raw(' hidden') : ''}>${
    cols.map((c) => html`<span class="cell ${c.cls || ''}${bp(c)}">${c.sr ? html`<span class="sr-only">${c.sr} : </span>` : ''}${c.cell(it, i)}</span>`)}</li>`);
  const more = limit && items.length > limit
    ? html`<button type="button" class="btn-ghost more" data-action="more">Afficher 25 de plus</button>` : '';
  return html`${header}<ol class="c-rank-list v-${variant}${items.length > PAGE ? ' long' : ''}" aria-label="${label}">${rows}</ol>${more}`;
}

/** Cellule produit : titre (lien panneau ou lien externe), sous-ligne, méta mobile. */
export function productCell({ title, href, ext, sub, meta, lang }) {
  const t = title || 'Produit sans titre';
  const lg = lang ? raw(` lang="${lang}"`) : '';
  const u = safeURL(ext);
  let link;
  if (href) link = html`<a class="row-link" href="${href}" title="${t}"${lg}>${t}</a>`;
  else if (u) link = html`<a class="row-link" href="${u}" target="_blank" rel="noopener noreferrer" title="${t}"${lg}>${t}<span class="sr-only"> (nouvel onglet)</span></a>`;
  else link = html`<span class="row-title" title="${t}"${lg}>${t}</span>`;
  return html`<span class="title">${link}</span>${sub ? html`<span class="sub">${sub}</span>` : ''}${meta ? html`<span class="m-meta">${meta}</span>` : ''}`;
}

/** Lien ↗ vers la page source du produit (au-dessus du lien de ligne). */
export function extCell(url, label) {
  const u = safeURL(url);
  if (!u) return '';
  return html`<a class="row-ext" href="${u}" target="_blank" rel="noopener noreferrer" aria-label="${label} (nouvel onglet)">${icon('i-ext')}</a>`;
}

export const rankCell = (r) => html`<span class="num rank">${r}</span>`;
