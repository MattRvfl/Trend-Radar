// Scène 4 (temps 25,4 → 34,5) : « Amazon, Shopify, Google Trends. Dix-sept catégories, France et États-Unis. »
// Trois sources (vrais logos), puis les 17 vraies catégories Amazon en couronne, puis les deux marchés.
import { DATA } from '../../../src/data.js';
import { tl, B, cue, h, icon, enter, sceneSpan, punch, everyFrame } from '../core.js';
import { CAT_ICON } from '../ui.js';

const SRC = [
  { k: 'amazon', ic: 'amazon', name: 'Amazon', sub: 'Meilleures ventes, top 30 par catégorie', at: 25.65, col: '#F0A23B' },
  { k: 'shopify', ic: 'shopify', name: 'Shopify', sub: '16 boutiques, meilleures ventes en direct', at: 26.45, col: '#8CC265' },
  { k: 'google', ic: 'site-pv-google', name: 'Google Trends', sub: 'Recherches en forte hausse', at: 27.85, col: '#8BA0F2' },
];

export function sceneSources(stage, amb) {
  const cats = DATA.categories;
  const R = 366, CX = 540, CY = 760;
  const S = h(`<section class="scene s4">
    <div class="s4-tiles">${SRC.map((s) => `<div class="s4-tile ${s.k}" style="--c:${s.col}">
      <div class="s4-logo">${icon(s.ic)}</div>
      <div class="s4-tx"><div class="s4-name">${s.name}</div><div class="s4-sub">${s.sub}</div></div></div>`).join('')}</div>
    <div class="s4-ring">${cats.map((c, i) => {
      const a = -Math.PI / 2 + i / cats.length * Math.PI * 2;
      return `<div class="s4-cat" style="left:${(CX + Math.cos(a) * R).toFixed(1)}px;top:${(CY + Math.sin(a) * R).toFixed(1)}px">${icon(CAT_ICON[c.key])}</div>`;
    }).join('')}</div>
    <div class="s4-mid">
      <div class="s4-17 num">0</div>
      <div class="s4-cl">catégories</div>
    </div>
    <div class="s4-flags">
      <div class="s4-flag fr">${icon('flag-fr')}<span>France</span></div>
      <div class="s4-flag us">${icon('flag-us')}<span>États-Unis</span></div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 25.4, 34.6);

  // ---- Trois sources, chacune sur son mot.
  const tiles = [...S.querySelectorAll('.s4-tile')];
  tiles.forEach((t, i) => {
    const at = SRC[i].at;
    enter(t, { x: 1150, rotation: 6, opacity: 1 }, { x: 0, rotation: 0, duration: B(0.42), ease: 'expo.out' }, B(at) - B(0.12));
    const lg = t.querySelector('.s4-logo');
    tl.set(lg, { scale: 0.5 }, 0);
    tl.to(lg, { scale: 1, duration: 0.5, ease: 'back.out(2.6)' }, B(at));
    punch(t, at + 0.02, { s: 1.035, dur: 0.3 });
    cue(at - 0.12, 'whoosh', { dur: B(0.42), from: 0.8, to: 0, soft: true });
    cue(at, 'logo_hit', { i, pan: 0 });
    tl.to(amb[SRC[i].k], { opacity: 0.45, duration: 0.15 }, B(at));
    tl.to(amb[SRC[i].k], { opacity: 0.0, duration: B(1.4) }, B(at) + 0.3);
  });
  // Les tuiles s'éclipsent vers le haut, place à la couronne.
  tl.to(tiles, { y: -700, opacity: 0, duration: B(0.55), ease: 'power3.in', stagger: 0.04 }, B(29.2));
  cue(29.3, 'whoosh', { dur: B(0.6), from: 0, to: 0, up: true, soft: true });

  // ---- 17 catégories en couronne, le compteur suit.
  const icons = [...S.querySelectorAll('.s4-cat')];
  const T0 = 29.85, DT = 0.09;
  icons.forEach((c, i) => {
    enter(c, { scale: 0, opacity: 0, rotation: -40 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.42, ease: 'back.out(2.2)' }, B(T0 + i * DT));
    if (i % 2 === 0) cue(T0 + i * DT, 'tick_hi', { n: i, pan: Math.cos(-Math.PI / 2 + i / 17 * 6.283) * 0.6 });
  });
  const n17 = S.querySelector('.s4-17'), mid = S.querySelector('.s4-mid'), cl = S.querySelector('.s4-cl');
  enter(mid, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, B(T0));
  everyFrame((t) => {
    if (t < B(T0) - 0.1 || t > B(34.7)) return;
    const k = Math.floor((t - B(T0)) / B(DT)) + 1;
    n17.textContent = String(Math.max(0, Math.min(17, k)));
  });
  tl.set(cl, { opacity: 0, y: 14 }, 0);
  tl.to(cl, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, B(30.45));
  punch(n17, T0 + 16 * DT, { s: 1.12, dur: 0.4 });
  const ring = S.querySelector('.s4-ring');
  tl.set(ring, { rotation: -12, transformOrigin: `${CX}px ${CY}px` }, 0);
  tl.to(ring, { rotation: 8, duration: B(4.7), ease: 'none' }, B(T0));
  icons.forEach((c) => { tl.set(c, { rotation: 0 }, 0); });
  amb.set('accent', 29.85, 0.3);

  // ---- « France et États-Unis » : le compteur monte, deux drapeaux entrent au centre.
  tl.to(mid, { y: -150, scale: 0.62, duration: B(0.5), ease: 'expo.out' }, B(32.0));
  const fl = [...S.querySelectorAll('.s4-flag')];
  [[fl[0], 32.24], [fl[1], 32.95]].forEach(([f, at], i) => {
    enter(f, { opacity: 0, scale: 0.3, y: 40, rotation: i ? 10 : -10 }, { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.5, ease: 'back.out(2.2)' }, B(at));
    cue(at, 'pop', { pan: i ? 0.35 : -0.35 });
  });
  // Sortie : tout est aspiré vers le haut (passage rapide aux mouvements du jour).
  tl.to([ring, mid, S.querySelector('.s4-flags')], { y: '-=900', opacity: 0, duration: B(0.6), ease: 'power3.in', stagger: 0.03 }, B(34.0));
  tl.to(amb.accent, { opacity: 0, duration: B(0.6) }, B(34.0));
  cue(34.05, 'whoosh', { dur: B(0.6), from: 0, to: 0, up: true });
}
