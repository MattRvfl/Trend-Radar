// Sparkline 72×20 (§8.2) : domaine Y fixe [1, 30] inversé, bande top 10, absences = interruption.
const W = 72;
const H = 20;
const y = (r) => 1 + ((r - 1) / 29) * (H - 2);

/** ranks : { 'AAAA-MM-JJ': rang } ; days : les 14 derniers jours (AAAA-MM-JJ). Retourne une chaîne SVG sûre (nombres seuls). */
export function sparkSVG(ranks, days) {
  const n = days.length;
  const x = (i) => (n < 2 ? W / 2 : 1 + (i * (W - 2)) / (n - 1));
  const pts = days.map((d, i) => (ranks && typeof ranks[d] === 'number' ? [x(i), y(ranks[d])] : null));
  if (pts.filter(Boolean).length < 2) return '<span class="spark-none" aria-hidden="true">—</span>';
  const segs = [];
  let cur = [];
  pts.forEach((p) => {
    if (p) cur.push(p);
    else { if (cur.length) segs.push(cur); cur = []; }
  });
  if (cur.length) segs.push(cur);
  const lines = segs.map((s) => (s.length > 1
    ? `<polyline points="${s.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}"/>`
    : `<circle class="sp-dot" cx="${s[0][0].toFixed(1)}" cy="${s[0][1].toFixed(1)}" r="0.9"/>`)).join('');
  const last = [...pts].reverse().find(Boolean);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`
    + `<rect class="sp-band" x="0" y="${y(1) - 1}" width="${W}" height="${(y(10) - y(1) + 1).toFixed(1)}"/>`
    + `<g class="sp-line">${lines}</g><circle class="sp-last" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.5"/></svg>`;
}
