// Contrôle segmenté (§7.4) : fieldset + radios natifs (flèches natives, aucune ARIA à recoder).
import { html, raw } from '../escape.js';

/**
 * options : [{ value, label, sr? }] (sr = libellé accessible qui remplace le libellé visible).
 * param : paramètre d'URL mis à jour au changement (vide = géré à part, ex. marché).
 */
export function renderSegmented({ name, legend, options, value, param = '', cls = '', extra = '' }) {
  return html`<fieldset class="c-segmented ${cls}"><legend class="sr-only">${legend}</legend>${options.map((o) => {
    const id = `${name}-${o.value}`;
    return html`<input type="radio" id="${id}" name="${name}" value="${o.value}" data-param="${param}"${o.value === value ? raw(' checked') : ''}><label for="${id}">${
      o.sr ? html`<span aria-hidden="true">${o.label}</span><span class="sr-only">${o.sr}</span>` : o.label}</label>`;
  })}${extra}</fieldset>`;
}
