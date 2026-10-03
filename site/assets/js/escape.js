// Échappement HTML, validation d'URL et gabarit `html` qui échappe tout ce qui est interpolé.
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

/** URL absolue en https uniquement, sinon null (le lien ou l'image n'est alors pas rendu). */
export function safeURL(u) {
  if (typeof u !== 'string' || !u) return null;
  try {
    const x = new URL(u);
    return x.protocol === 'https:' ? x.href : null;
  } catch {
    return null;
  }
}

/** Typographie française : insécable avant « : », fine insécable avant ; ! ? et dans les guillemets. */
export const fr = (s) => String(s)
  .replace(/ ([:;!?»])/g, (m, c) => (c === ':' ? '\u00a0' : '\u202f') + c)
  .replace(/« /g, '«\u202f')
  .replace(/([nN])° /g, '$1°\u00a0');

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
/** Marque une chaîne comme HTML déjà sûr (uniquement pour du HTML produit par `html`). */
export const raw = (s) => (s instanceof Raw ? s : new Raw(String(s)));

function val(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(val).join('');
  return escapeHTML(v);
}

/** Gabarit : les parties statiques reçoivent la typographie FR, les valeurs sont échappées. */
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += fr(s);
    if (i < vals.length) out += val(vals[i]);
  });
  return new Raw(out);
}
