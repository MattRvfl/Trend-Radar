// Routes hash (compatibles GitHub Pages en sous-chemin) : #/vue[/sous-partie]?param=valeur
export const VIEWS = ['aujourdhui', 'classements', 'boutiques', 'tiktok', 'buzz', 'methode'];

const dec = (s) => {
  try { return decodeURIComponent(s); } catch { return ''; }
};

export function parse(hash) {
  const h = String(hash || '').replace(/^#/, '') || '/';
  const q = h.indexOf('?');
  const path = q < 0 ? h : h.slice(0, q);
  const params = Object.fromEntries(new URLSearchParams(q < 0 ? '' : h.slice(q + 1)));
  const parts = path.split('/').filter(Boolean).map(dec);
  if (parts[0] === 'produit') {
    return { view: 'produit', market: parts[1], category: parts[2], id: parts[3], params };
  }
  const view = VIEWS.includes(parts[0]) ? parts[0] : 'aujourdhui';
  return { view, sub: parts[1] || null, params };
}

export function build(view, params = {}, sub = null) {
  const base = view === 'aujourdhui' ? '#/' : `#/${view}${sub ? `/${encodeURIComponent(sub)}` : ''}`;
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ''),
  ).toString();
  return qs ? `${base}?${qs}` : base;
}

export const productHash = (m, c, id, params) =>
  `#/produit/${encodeURIComponent(m)}/${encodeURIComponent(c)}/${encodeURIComponent(id)}${
    params ? `?${new URLSearchParams(params)}` : ''}`;

/** Période de l'URL (jour, 7j, 30j, AAAA-MM, AAAA) → clé de fichier rankings (7d, 30d…). */
export const periodKey = (p) => ({ '7j': '7d', '30j': '30d' }[p] || p);
export const periodParam = (k) => ({ '7d': '7j', '30d': '30j' }[k] || k);
