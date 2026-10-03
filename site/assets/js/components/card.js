// Carte produit (§7.2) : « Entrées du jour » et « N° 1 par catégorie ».
import { html, raw } from '../escape.js';
import { thumb } from './ui.js';

/** { title, image, href, over, badge, line, initial, eager, lang } */
export function renderCard({ title, image, href, over, badge, line, initial, eager = false, lang }) {
  const t = title || 'Produit sans titre';
  const lg = lang ? raw(` lang="${lang}"`) : '';
  return html`<article class="c-card${href ? '' : ' no-link'}"><p class="over">${over}</p>${thumb(image, 160, initial, { eager, cls: 'card-img' })}${
    badge ? html`<div class="card-badge">${badge}</div>` : ''}<h3 class="card-title">${
    href ? html`<a href="${href}" title="${t}"${lg}>${t}</a>` : html`<span title="${t}"${lg}>${t}</span>`}</h3><p class="card-line num">${line}</p></article>`;
}
