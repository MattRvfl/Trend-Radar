// Petits éléments partagés : icône du sprite, lien externe, vignette produit.
import { html, raw, safeURL } from '../escape.js';

/** Icône du sprite inline de index.html (id interne, jamais une donnée). */
export const icon = (id, cls = '') =>
  raw(`<svg class="ic ${cls}" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`);

/** Lien externe : https uniquement, nouvel onglet, rel noopener noreferrer, ↗ + texte sr-only. */
export function extLink(url, text = '', sr = '', cls = '') {
  const u = safeURL(url);
  if (!u) return text ? html`<span>${text}</span>` : '';
  return html`<a class="ext ${cls}" href="${u}" target="_blank" rel="noopener noreferrer">${text}${icon('i-ext', 'ic-ext')}<span class="sr-only">${sr ? ` ${sr}` : ''} (nouvel onglet)</span></a>`;
}

/** Vignette : fond blanc, dimensions fixes, lazy, no-referrer ; tuile-initiale si l'URL est invalide. */
export function thumb(url, size, initial = '', { eager = false, cls = '' } = {}) {
  const u = safeURL(url);
  const ini = String(initial || '?').charAt(0).toUpperCase();
  if (!u) return html`<span class="thumb ${cls}"><span class="thumb-fb" title="Image indisponible" aria-hidden="true">${ini}</span></span>`;
  return html`<span class="thumb ${cls}"><img src="${u}" alt="" width="${size}" height="${size}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer"${eager ? raw(' fetchpriority="high"') : ''} data-initial="${ini}"></span>`;
}
