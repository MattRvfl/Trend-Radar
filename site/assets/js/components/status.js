// Bandeau des sources (§7.11) : icône + mot + heure, jamais la couleur seule.
// Statuts : ok, partial, error (échec du relevé du jour), unavailable (source retirée, état permanent).
import { html } from '../escape.js';
import { dShort, time, num, plural } from '../format.js';
import { SOURCES } from './source.js';
import { icon } from './ui.js';

const WORD = { ok: 'OK', partial: 'Partiel', error: 'Indisponible', unavailable: 'Non disponible' };
const ICON = { ok: 'i-ok', partial: 'i-partial', error: 'i-error', unavailable: 'i-ban' };

/** État de chaque source : une source absente de meta.sources est « Indisponible » (erreur). */
export function sourceStates(meta) {
  return Object.keys(SOURCES).map((k) => {
    const s = (meta && meta.sources && meta.sources[k]) || null;
    const raw = s && s.status;
    const st = ['ok', 'partial', 'unavailable'].includes(raw) ? raw : 'error';
    return { k, name: SOURCES[k], st, s };
  });
}

/** Sources actives = toutes sauf celles retirées (unavailable) : elles ne comptent pas comme « en retard ». */
export const activeStates = (meta) => sourceStates(meta).filter((x) => x.st !== 'unavailable');

function stateText(st, s) {
  if (st === 'ok') return html` <span class="num">${time(s.collected_at)}</span><span class="sr-only"> OK</span>`;
  if (st === 'partial') return html` <span class="num">${time(s.collected_at)}</span> <span>partiel</span>`;
  if (st === 'unavailable') return html` <span>non disponible</span>`;
  return html` <span>indisponible</span>`;
}

export function renderStatusBar(meta) {
  const items = sourceStates(meta).map(({ k, name, st, s }) => {
    const tip = st === 'unavailable' && s.reason ? s.reason : '';
    return html`<li class="st st-${st}"${tip ? html` data-tip="${tip}"` : ''}>${icon(ICON[st])}<span class="dot dot-${k}" aria-hidden="true"></span>${name}${stateText(st, s)}</li>`;
  });
  return html`<div class="container c-status-in"><p>Sources du ${dShort(meta.last_day)}</p><ul>${items}</ul><a class="st-info" href="#/methode" aria-label="Méthode et sources">${icon('i-info')}</a></div>`;
}

export function renderStatusButton(meta) {
  const states = activeStates(meta);
  const ok = states.filter((x) => x.st === 'ok').length;
  return html`<button type="button" class="c-status-btn" data-action="sources" aria-haspopup="dialog"><span class="pill ${ok === states.length ? 'is-ok' : 'is-warn'}" aria-hidden="true"></span>${ok} sources sur ${states.length} à jour ${icon('i-chev')}</button>`;
}

function sheetDetail(st, s) {
  if (st === 'unavailable') return `Vérifié le ${dShort(s.checked)}`;
  if (s && s.collected_at) return `${time(s.collected_at)} · ${num(s.lists)} ${plural(s.lists || 0, 'liste', 'listes')}`;
  return 'Aucun relevé ce matin';
}

export function renderSourcesSheet(meta) {
  const rows = sourceStates(meta).map(({ k, name, st, s }) => html`<li class="sheet-row st-${st}"><span class="dot dot-${k}" aria-hidden="true"></span><strong>${name}</strong><span class="st">${icon(ICON[st])}${WORD[st]}</span><span class="num muted">${sheetDetail(st, s)}</span>${
    st === 'unavailable' && s.reason ? html`<span class="sheet-reason">${s.reason}</span>` : ''}</li>`);
  return html`<div class="sheet-head"><h2 id="sheet-title" tabindex="-1">Sources du ${dShort(meta.last_day)}</h2><button type="button" class="icon-btn" data-action="close-sheet" aria-label="Fermer">${icon('i-close')}</button></div><ul class="sheet-list">${rows}</ul><p><a href="#/methode" data-action="close-sheet">Méthode et sources</a></p>`;
}
