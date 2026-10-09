// Sous-titres incrustés, mot à mot, calés sur la voix off (minutage ElevenLabs Scribe, src/vo.js).
// Chaque mot apparaît à l'instant où il est prononcé ; les mots clés gardent leur couleur.
// Les nombres dits en toutes lettres s'affichent en chiffres (lecture plus rapide, son coupé compris).
import { VO } from './vo.js';
import { tl, h, NNBSP, NBSP } from './core.js';

// Pages : nombre de mots de la voix par page (1 ou 2 lignes), dans l'ordre du texte.
const PAGES = [3, 4, 3, 4, 4, 3, 3, 3, 3, 2, 3, 4, 2, 2, 2, 3, 4, 2, 2, 3, 3, 4, 2, 4, 4, 4, 3, 5, 4, 3, 1, 2, 3];
// Affichage et couleur de certains mots (clé = mot exact de la transcription).
const SHOW = {
  cinq: ['5', 'acc'], 'vingt-cinquième': ['25<sup>e</sup>', 'acc'], deuxième: ['2<sup>e</sup>', 'up'], 'Dix-sept': ['17', 'acc'],
  'Amazon.': ['Amazon.', 'amz'], Amazon: ['Amazon', 'amz'], 'Amazon,': ['Amazon,', 'amz'], 'Shopify,': ['Shopify,', 'shp'],
  Google: ['Google', 'ggl'], 'Trends.': ['Trends.', 'ggl'], problème: ['problème', 'down'], 'historique.': ['historique.', 'down'],
  aucun: ['aucun', 'down'], Relevé: ['Relevé', 'acc'], 'Relevé.': ['Relevé.', 'acc'], 'monte,': ['monte,', 'up'],
  'chute,': ['chute,', 'down'], 'débarque.': ['débarque.', 'new'], Medicube: ['Medicube', 'new'], 7: ['7', 'new'],
  10: ['10', ''], 8: ['8', 'acc'], 'octobre,': ['octobre,', 'acc'], 'alerte.': ['alerte.', 'acc'], 'prédiction,': ['prédiction,', 'strike'],
  "d'estimation": ["d'estimation", 'strike'], vrais: ['vrais', 'up'], 'classements,': ['classements,', 'up'],
  'source.': ['source.', 'acc'], 'gratuit.': ['gratuit.', 'up'], rafle: ['rafle', 'new'], tout: ['tout', 'new'],
};
const COLORS = { acc: 'var(--acc)', up: 'var(--up)', down: 'var(--down)', new: 'var(--new)', amz: 'var(--amz)', shp: 'var(--shp)', ggl: 'var(--ggl)', strike: 'var(--strike)' };
const STRIKE = new Set([82, 84, 85, 86]);   // « prédiction, » et « d'estimation de ventes » (indices dans VO)
const BIG = new Set(['cinq', 'vingt-cinquième', 'deuxième', 'Dix-sept', '7', '10', '8']);
const LEAD = 0.04;      // le mot s'affiche 40 ms avant son attaque (l'œil lit en avance sur l'oreille)

export function captions(stage, { hideBetween = [], light = [] } = {}) {
  const box = h('<div class="caps" data-theme="dark"></div>');
  stage.append(box);
  // Sur les passages en thème clair, les sous-titres passent en encre sombre (couleurs du thème clair).
  for (const [a, b] of light) {
    tl.set(box, { attr: { 'data-theme': 'light' } }, a);
    tl.set(box, { attr: { 'data-theme': 'dark' } }, b);
  }
  // Fusionne la ponctuation isolée (« ? », « : ») avec le mot précédent, espace fine insécable comprise.
  const words = [];
  for (const w of VO) {
    if (/^[?:!;]$/.test(w.w) && words.length) {
      const p = words[words.length - 1];
      p.html += (w.w === ':' ? NBSP : NNBSP) + w.w; p.e = w.e; p.n++;
      continue;
    }
    const i = VO.indexOf(w);
    let [html, cls] = SHOW[w.w] || [w.w, ''];
    if (STRIKE.has(i)) cls = 'strike';
    words.push({ ...w, html, cls, n: 1, big: BIG.has(w.w) });
  }
  // Découpe en pages (PAGES compte les mots de la voix, ponctuation isolée comprise).
  let k = 0;
  const pages = PAGES.map((cnt) => {
    const ws = [];
    let c = 0;
    while (c < cnt && k < words.length) { ws.push(words[k]); c += words[k].n; k++; }
    return ws;
  });
  if (k !== words.length) throw new Error(`sous-titres : ${words.length - k} mots non paginés`);

  pages.forEach((ws, i) => {
    const pg = h('<div class="cap-page"></div>');
    box.append(pg);
    const t0 = Math.max(0, ws[0].s - LEAD);   // jamais de position négative (GSAP décalerait toute la timeline)
    const next = pages[i + 1];
    const last = ws[ws.length - 1];
    const tEnd = next ? Math.min(next[0].s - LEAD, last.e + 0.7) : last.e + 1.2;
    if (t0 > 0) { tl.set(pg, { opacity: 0 }, 0); tl.set(pg, { opacity: 1 }, t0); } else pg.style.opacity = 1;
    tl.to(pg, { opacity: 0, scale: 0.96, duration: 0.08, ease: 'power2.in' }, tEnd - 0.08);
    for (const w of ws) {
      const el = h(`<span class="cap-w">${w.html}</span>`);
      if (w.cls) el.style.color = COLORS[w.cls];
      if (w.cls === 'strike') el.classList.add('cap-strike');
      pg.append(el);
      const ts = Math.max(0, w.s - LEAD);
      if (ts > 0) {
        tl.set(el, { opacity: 0, scale: 0.7, y: 18 }, 0);
        tl.to(el, { opacity: 1, scale: 1, y: 0, duration: 0.16, ease: 'back.out(2.6)' }, ts);
      }
      if (w.big) {
        tl.set(el, { transformOrigin: '50% 70%' }, 0);
        tl.fromTo(el, { scale: 1.45 }, { scale: 1, duration: 0.3, ease: 'expo.out', immediateRender: false }, ts + 0.001);
      }
      if (w.cls === 'strike') {
        const s = h('<i class="cap-x"></i>');
        el.append(s);
        tl.set(s, { scaleX: 0 }, 0);
        tl.to(s, { scaleX: 1, duration: 0.22, ease: 'power2.inOut' }, w.e - 0.12);
      }
    }
  });
  for (const [a, b] of hideBetween) {
    tl.to(box, { opacity: 0, duration: 0.12 }, a);
    tl.to(box, { opacity: 1, duration: 0.12 }, b);
  }
  return box;
}
