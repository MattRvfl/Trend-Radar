// Ligne de source (§7.10) : obligatoire en bas de chaque module.
import { html, fr } from '../escape.js';
import { dayTime, dShort } from '../format.js';
import { extLink } from './ui.js';

export const SOURCES = { amazon: 'Amazon', shopify: 'Shopify', tiktok: 'TikTok', gtrends: 'Google' };
export const amazonName = (m) => (m === 'US' ? 'Amazon.com' : 'Amazon.fr');

/**
 * src : clé de pastille ; name : « Amazon.fr Meilleures ventes » ; at : horodatage ISO de collecte ;
 * when : texte qui remplace « relevé le … » (périodes) ; compared : date ISO ; next : bool ; url : lien source.
 */
export function renderSource({ src, name, at, when, compared, next, url }) {
  const parts = [name];
  if (when) parts.push(when);
  else if (at) parts.push(`relevé le ${dayTime(at)}`);
  if (compared) parts.push(`comparé au ${dShort(compared)}`);
  if (next) parts.push('Prochain relevé : demain matin');
  return html`<p class="c-source"><span class="dot dot-${src}" aria-hidden="true"></span><span>${fr(parts.join(' · '))}</span>${
    url ? extLink(url, '', `Source : ${name}`) : ''}</p>`;
}

/** « relevés du 1er au 3 oct. » (ou « relevé le 3 oct. » si un seul jour). */
export function periodWhen(from, to) {
  if (!from) return '';
  if (from === to) return `relevé le ${dShort(to)}`;
  const a = from.slice(0, 7) === to.slice(0, 7) ? dShort(from).replace(/\s\S+$/, '') : dShort(from);
  return `relevés du ${a} au ${dShort(to)}`;
}
