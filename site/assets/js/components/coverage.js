// Indicateur de couverture d'une période (§7.7) : jauge grise, seul le message prend une teinte.
import { html, raw } from '../escape.js';
import { dShort, plural, parisDay, monthLabel } from '../format.js';
import { icon } from './ui.js';

/** Libellé long d'une clé de période (7d, 30d, AAAA-MM, AAAA) + « (en cours) » éventuel. */
export function periodLabel(key) {
  if (key === '7d') return '7 derniers jours';
  if (key === '30d') return '30 derniers jours';
  const today = parisDay();
  if (/^\d{4}-\d{2}$/.test(key)) return `${monthLabel(key)}${today.startsWith(key) ? ' (en cours)' : ''}`;
  if (/^\d{4}$/.test(key)) return `Année ${key}${today.startsWith(key) ? ' (en cours)' : ''}`;
  return key;
}

export function renderCoverage(key, info) {
  const c = info.days_covered || 0;
  const e = info.days_expected || 1;
  const ratio = c / e;
  let gauge;
  if (e <= 31) {
    const segs = Array.from({ length: e }, (_, i) => (i >= e - c ? '<i class="on"></i>' : '<i></i>')).join('');
    gauge = html`<span class="gauge ${e <= 14 ? 'lg' : 'sm'}" aria-hidden="true">${raw(segs)}</span>`;
  } else {
    gauge = html`<span class="gauge-bar" aria-hidden="true"><span style="--fill:${ratio.toFixed(3)}"></span></span><span class="num">${Math.round(ratio * 100)} %</span>`;
  }
  const days = `${c} ${plural(c, 'jour relevé', 'jours relevés')} sur ${e}`;
  let note = '';
  if (ratio < 0.5) {
    note = html`<p class="c-note is-warn">${icon('i-warn')}<span>Période incomplète : ce classement ne repose que sur ${c} ${plural(c, 'jour', 'jours')}. <a href="#/methode/donnees-incompletes">Pourquoi ?</a></span></p>`;
  } else if (ratio < 0.8) {
    note = html`<p class="cov-partial">Période partiellement couverte.</p>`;
  }
  return html`<div class="c-coverage"><p class="cov-line"><strong>${periodLabel(key)}</strong> · <span class="num">${dShort(info.from)} → ${dShort(info.to)}</span></p><p class="cov-line">${gauge}<span class="num">${days}</span></p>${note}</div>`;
}
