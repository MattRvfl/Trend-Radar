// Composants de l'interface Relevé, reproduits d'après design/DESIGN.md §7 pour le film.
import { icon, price, fr } from './core.js';

// Icône Lucide par catégorie Amazon (les visuels produits ne sont pas téléchargés : on montre la catégorie).
export const CAT_ICON = {
  'high-tech': 'smartphone', informatique: 'laptop', 'cuisine-maison': 'cooking-pot', electromenager: 'washing-machine',
  beaute: 'spray-can', sante: 'heart-pulse', mode: 'shirt', sport: 'dumbbell', jouets: 'puzzle',
  'jeux-video': 'gamepad-2', bebe: 'baby', animaux: 'paw-print', bricolage: 'hammer', jardin: 'sprout',
  auto: 'car', bureau: 'paperclip', epicerie: 'shopping-basket',
};

export const thumb = (category, size = 48) =>
  `<span class="thumb" style="width:${size}px;height:${size}px">${icon(CAT_ICON[category] || 'store')}</span>`;

export function delta(it, s = 1, extra = '') {
  const st = `style="--s:${s}"`;
  if (it.new) return `<span class="c-delta is-new ${extra}" ${st}>${icon('site-i-new')}<span>Nouveau</span></span>`;
  if (it.change == null) return `<span class="c-delta is-flat ${extra}" ${st}>—</span>`;
  if (it.change > 0) return `<span class="c-delta is-up ${extra}" ${st}>${icon('site-i-up')}<span>${it.change}</span></span>`;
  if (it.change < 0) return `<span class="c-delta is-down ${extra}" ${st}>${icon('site-i-down')}<span>${-it.change}</span></span>`;
  return `<span class="c-delta is-flat ${extra}" ${st}>=</span>`;
}

export const flag = (m) => icon(m === 'US' ? 'flag-us' : 'flag-fr');

// Ligne de classement (§7.1) : rang · variation · vignette · titre (+ catégorie) · prix
export function row(it, { open = false, sub = true, two = false } = {}) {
  return `<div class="c-row${open ? ' is-open' : ''}">
    <span class="rank num">${it.rank}</span>
    <span class="dl">${delta(it)}</span>
    ${thumb(it.category)}
    <span class="prod"><span class="t${two ? ' t2' : ''}">${esc(it.title)}</span>${sub ? `<span class="sub">${esc(it.cat)}</span>` : ''}</span>
    <span class="pr num">${price(it.price, it.market)}</span>
  </div>`;
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
export { fr, price };
