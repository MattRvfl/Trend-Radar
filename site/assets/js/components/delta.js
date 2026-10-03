// Badge de variation de rang (§7.3) : icône + signe/nombre + couleur, texte accessible en sr-only.
import { html } from '../escape.js';
import { no, num, plural } from '../format.js';
import { icon } from './ui.js';

const badge = (kind, ic, shown, label, prefix) => html`<span class="c-delta is-${kind}" data-tip="${label}">${
  prefix ? html`<span class="d-pre" aria-hidden="true">${prefix}</span>` : ''}${ic ? icon(ic) : ''}<span aria-hidden="true">${shown}</span><span class="sr-only">${label}</span></span>`;

/** item : { rank, change, new, change_7d } de latest.json. week = variante 7 jours. */
export function renderDelta(it, { week = false } = {}) {
  const ch = week ? it.change_7d : it.change;
  const since = week ? 'depuis 7 jours' : 'depuis hier';
  const pre = week ? '7 j' : '';
  if (!week && it.new === true) return badge('new', 'i-new', 'Nouveau', "Nouveau dans le top 30 aujourd'hui");
  if (typeof ch !== 'number') {
    return html`<span class="c-delta is-none" data-tip="${week ? 'Pas de comparaison possible sur 7 jours' : 'Pas de comparaison possible (premier relevé)'}"><span aria-hidden="true">—</span><span class="sr-only">${week ? 'Pas de comparaison possible sur 7 jours' : 'Pas de comparaison possible (premier relevé)'}</span></span>`;
  }
  if (ch === 0) return badge('flat', '', '=', week ? "Même rang qu'il y a 7 jours" : "Même rang qu'hier", pre);
  const n = Math.abs(ch);
  const before = it.rank + ch;
  const words = `${n} ${plural(n, 'place', 'places')} ${since} (${no(before)} → ${no(it.rank)})`;
  return ch > 0
    ? badge('up', 'i-up', num(n), `Gagne ${words}`, pre)
    : badge('down', 'i-down', num(n), `Perd ${words}`, pre);
}

/** Série (streak) : texte simple, sans couleur. */
export function renderStreak(streak, suffix = '') {
  if (typeof streak !== 'number' || streak < 1) return html`<span class="muted">—</span>`;
  const tip = `Dans le top 30 depuis ${streak} ${plural(streak, 'jour', 'jours')} d'affilée`;
  return html`<span class="num streak" data-tip="${tip}"><span aria-hidden="true">${num(streak)}\u00a0j${suffix}</span><span class="sr-only">${tip}</span></span>`;
}
