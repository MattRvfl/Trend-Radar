// Barre de score (§7.8) : échelle absolue, 100 % = n° 1 chaque jour relevé.
import { html } from '../escape.js';
import { no, num } from '../format.js';

export function renderScore(points, max) {
  if (typeof points !== 'number') return html`<span class="muted">—</span>`;
  const r = max > 0 ? Math.max(0, Math.min(1, points / max)) : 0;
  const label = `${num(points)} points sur ${num(max)} possibles (${no(1)} chaque jour relevé = ${num(max)})`;
  return html`<span class="c-score" data-tip="${label}"><span class="num" aria-hidden="true">${num(points)}</span><span class="bar" aria-hidden="true" style="--fill:${r.toFixed(3)}"></span><span class="sr-only">${label}</span></span>`;
}
