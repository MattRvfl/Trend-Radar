// Sélecteur de période (§7.5) : Jour | 7 j | 30 j | Mois ▾ | Année ▾ (clés réelles de rankings/index.json).
import { html, raw } from '../escape.js';
import { monthShortLabel } from '../format.js';
import { renderSegmented } from './segmented.js';
import { periodLabel } from './coverage.js';
import { periodKey, periodParam } from '../router.js';

function menu(id, label, keys, current, param) {
  const on = keys.includes(current);
  return html`<button type="button" class="seg-btn${on ? ' is-on' : ''}" popovertarget="${id}" aria-haspopup="true">${
    on ? (current.length === 4 ? current : monthShortLabel(current)) : label} ▾</button><div popover id="${id}" class="c-menu"><ul>${
    keys.map((k) => html`<li><button type="button" data-param="${param}" data-value="${k}"${k === current ? raw(' aria-current="true"') : ''}>${periodLabel(k)}${k === current ? ' ✓' : ''}</button></li>`)
  }</ul></div>`;
}

/** value : paramètre d'URL (jour, 7j, 30j, AAAA-MM, AAAA). */
export function renderPeriod({ value, index, withDay = true, name = 'periode', param = 'p' }) {
  const keys = Object.keys(index || {});
  const months = keys.filter((k) => /^\d{4}-\d{2}$/.test(k)).sort().reverse();
  const years = keys.filter((k) => /^\d{4}$/.test(k)).sort().reverse();
  const cur = periodKey(value);
  const options = [];
  if (withDay) options.push({ value: 'jour', label: 'Jour' });
  if (index && index['7d']) options.push({ value: '7j', label: '7 j', sr: '7 derniers jours' });
  if (index && index['30d']) options.push({ value: '30j', label: '30 j', sr: '30 derniers jours' });
  const extra = [];
  if (months.length === 1) {
    options.push({ value: months[0], label: cur === months[0] ? monthShortLabel(months[0]) : 'Mois', sr: periodLabel(months[0]) });
  } else if (months.length > 1) extra.push(menu(`${name}-mois`, 'Mois', months, cur, param));
  if (years.length === 1) {
    options.push({ value: years[0], label: cur === years[0] ? years[0] : 'Année', sr: periodLabel(years[0]) });
  } else if (years.length > 1) extra.push(menu(`${name}-annee`, 'Année', years, cur, param));
  return renderSegmented({
    name, legend: 'Période', options, value: periodParam(cur), param, cls: 'c-period', extra,
  });
}
