// États vide, chargement, erreur, source indisponible, notes (§7.9, §11.3).
import { html, raw, fr } from '../escape.js';
import { dShort } from '../format.js';
import { icon, extLink } from './ui.js';

/** Typographie FR sur les textes (les fragments déjà construits passent tels quels). */
const t = (v) => (typeof v === 'string' ? fr(v) : v);

export const renderEmpty = ({ title, text, action = '', ic = 'i-info', cls = '' }) =>
  html`<div class="c-state ${cls}">${icon(ic, 'state-ic')}<p class="state-title">${t(title)}</p><p class="state-text">${t(text)}</p>${action}</div>`;

export const renderError = (what = 'Le fichier des classements') => renderEmpty({
  ic: 'i-warn',
  cls: 'is-error',
  title: 'Impossible de charger les données',
  text: `${what} n'a pas répondu. Vérifiez votre connexion, puis réessayez.`,
  action: html`<button type="button" class="btn" data-action="retry">Réessayer</button>`,
});

/** Copie §11.3 « Encore {n} jours de patience ». */
export const renderPatience = (need, have) => renderEmpty({
  title: `Encore ${need - have} ${need - have > 1 ? 'jours' : 'jour'} de patience`,
  text: `Cette liste a besoin d'au moins ${need} jours de relevés. Nous en avons ${have}.`,
});

export const renderNoComparison = () => renderEmpty({
  title: 'Les variations arrivent demain',
  text: "Il faut deux relevés pour comparer. Le premier date d'aujourd'hui.",
});

/**
 * Modules qui attendent de l'historique : une ligne chacun au lieu d'une grande boîte vide.
 * rows : [{ names: ['Entrées du jour', …], text }].
 */
export const renderPending = (rows) => html`<ul class="c-pending">${rows.map((r) => html`<li>${icon('i-info')}<span><span class="pending-name">${
  t(r.names.join(' · '))}</span> — <span class="pending-text">${t(r.text)}</span></span></li>`)}</ul>`;

/** Source indisponible : carte barre gauche danger, message humanisé, détail technique repliable. */
export function renderUnavailable({ name, message, last, errors = [], url, linkLabel, compact = false, permanent = false, checked }) {
  const when = permanent
    ? (checked ? `Vérifié le ${dShort(checked)}` : '')
    : `Nouvel essai demain matin. ${last ? `Dernier relevé réussi : ${dShort(last)}` : "Aucun relevé réussi pour l'instant."}`;
  return html`<div class="c-unavail${compact ? ' is-compact' : ''}${permanent ? ' is-permanent' : ''}" role="status">${icon('i-ban', 'state-ic')}<div>
<p class="state-title">${permanent ? `${name} n'est plus relevé.` : `${name} n'a pas pu être relevé ce matin.`}</p>
${message ? html`<p>${t(message)}</p>` : ''}
${when ? html`<p>${fr(when)}</p>` : ''}
${errors.length && !compact ? html`<details><summary>Détail technique</summary><pre>${errors.join('\n')}</pre></details>` : ''}
${url ? html`<p>${extLink(url, linkLabel || 'Ouvrir la source', '', compact ? '' : 'btn')}</p>` : ''}</div></div>`;
}

export const renderNote = (kind, content) =>
  html`<p class="c-note is-${kind}">${icon(kind === 'warn' ? 'i-warn' : 'i-info')}<span>${t(content)}</span></p>`;

/** Skeleton à géométrie identique : n lignes de liste. */
export function renderSkeleton(n = 10, label = 'Chargement des classements…') {
  const row = '<li class="c-row sk-row"><span class="sk sk-num"></span><span class="sk sk-thumb"></span><span class="sk-lines"><span class="sk"></span><span class="sk sk-60"></span></span><span class="sk sk-num bp-sm"></span></li>';
  return html`<div class="container page" aria-busy="true"><span class="sr-only" role="status">${label}</span><div class="sk sk-h1"></div><ol class="c-rank-list sk-list" aria-hidden="true">${raw(row.repeat(n))}</ol></div>`;
}
