// Scène 3 (temps 32 → 40) : le logo se construit sur la signature sonore.
// Mélodie = polyligne du logo : sommets aux temps 32, 33, 33.75, 35 (écarts 4, 3, 5 doubles-croches).
import { tl, B, cue, h, icon, splitWords, splitChars, revealWords, sceneSpan, fr, everyFrame, rng, clamp } from '../lib/core.js';

export const LOGO_HITS = [0, 1, 1.75, 3];          // en temps, depuis le début de la signature
const PTS = [[4, 14.5], [8, 10], [11, 12], [16, 5.5]];

// Pictogramme officiel (site/assets/icons/icon.svg), couleurs du thème sombre.
export function logoSVG(cls = '') {
  return `<svg class="logo-svg ${cls}" viewBox="0 0 20 20" overflow="visible">
    <rect class="lm-sq" width="20" height="20" rx="4.5"/>
    <g transform="translate(10 10) scale(0.82) translate(-10.8 -9.2)">
      <polyline class="lm-line" points="${PTS.map((p) => p.join(',')).join(' ')}" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      ${PTS.map((p, i) => `<circle class="lm-v lm-v${i}" cx="${p[0]}" cy="${p[1]}" r="1.35"/>`).join('')}
      <circle class="lm-ring" cx="16" cy="5.5" r="2.1"/>
      <circle class="lm-dot" cx="16" cy="5.5" r="2.1" stroke-width="0.8"/>
    </g></svg>`;
}

// Animation de construction du logo (réutilisée pour le final).
export function buildLogo(svg, at, { square = true } = {}) {
  const line = svg.querySelector('.lm-line');
  const vs = [...svg.querySelectorAll('.lm-v')], dot = svg.querySelector('.lm-dot'), ring = svg.querySelector('.lm-ring');
  const seg = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const cum = [0, seg[0] / total, (seg[0] + seg[1]) / total, 1].map((x) => `${(x * 100).toFixed(2)}%`);
  if (square) {
    tl.set(svg, { scale: 0.3, opacity: 0, transformOrigin: '50% 50%' }, 0);
    tl.to(svg, { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, B(at));
  }
  tl.set(line, { drawSVG: '0% 0%' }, 0);
  tl.set(vs, { scale: 0, transformOrigin: '50% 50%' }, 0);
  tl.set([dot, ring], { scale: 0, transformOrigin: '50% 50%', opacity: 1 }, 0);
  LOGO_HITS.forEach((hb, i) => {
    tl.to(vs[i], { scale: 1.6, duration: 0.12, ease: 'power2.out' }, B(at + hb));
    tl.to(vs[i], { scale: 0, duration: 0.45, ease: 'power3.out' }, B(at + hb) + 0.12);
    if (i < 3) tl.to(line, { drawSVG: `0% ${cum[i + 1]}`, duration: B(LOGO_HITS[i + 1] - hb), ease: 'power3.in' }, B(at + hb));
  });
  tl.to(dot, { scale: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.45)' }, B(at + 3));
  tl.fromTo(ring, { scale: 1, opacity: 0.9 }, { scale: 4.5, opacity: 0, duration: 1.1, ease: 'expo.out' }, B(at + 3));
}

export function scene3(stage) {
  const S = h(`<section class="scene s3">
    <div class="s3-glow"></div>
    <svg class="s3-rings" viewBox="0 0 1920 1080" width="1920" height="1080">
      ${[0, 1, 2, 3].map((i) => `<circle class="rg rg${i}" cx="960" cy="470" r="150"/>`).join('')}
    </svg>
    <canvas class="s3-parts" width="1920" height="1080"></canvas>
    <div class="s3-lock">
      <div class="s3-mark">${logoSVG()}</div>
      <div class="s3-word"><span class="m"><span class="w-in">Relev</span></span><span class="w-e"><span class="m"><span class="e0">e</span></span><span class="e1">é</span></span></div>
    </div>
    <div class="s3-tag lede">${fr('Les classements du commerce en ligne, relevés chaque matin.')}</div>
    <div class="s3-geo"><span class="g g1">${icon('flag-fr')}<b>France</b></span><span class="sep">·</span><span class="g g2">${icon('flag-us')}<b>États-Unis</b></span></div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 32, 40);

  const svg = S.querySelector('.logo-svg');
  buildLogo(svg, 32);
  const mark = S.querySelector('.s3-mark');
  tl.set(mark, { x: 0, scale: 1 }, 0);
  // Impact : halo + ondes de mesure.
  const glow = S.querySelector('.s3-glow');
  tl.set(glow, { opacity: 0, scale: 0.5 }, 0);
  tl.to(glow, { opacity: 1, scale: 1.15, duration: 0.25, ease: 'power2.out' }, B(32));
  tl.to(glow, { opacity: 0.35, scale: 1, duration: 1.6, ease: 'power2.out' }, B(32) + 0.25);
  tl.to(glow, { opacity: 0.8, scale: 1.1, duration: 0.2 }, B(35));
  tl.to(glow, { opacity: 0.3, duration: 1.2 }, B(35) + 0.2);
  [...S.querySelectorAll('.rg')].forEach((c, i) => {
    const at = i < 2 ? 32 + i * 0.15 : 35 + (i - 2) * 0.15;
    tl.set(c, { attr: { r: 150 }, opacity: 0 }, 0);
    tl.fromTo(c, { attr: { r: 150 }, opacity: 0.8 }, { attr: { r: 150 + 900 }, opacity: 0, duration: 1.6, ease: 'expo.out' }, B(at));
  });
  cue(32, 'impact', { size: 'xl' });
  LOGO_HITS.forEach((hb, i) => cue(32 + hb, 'logo_vertex', { i }));

  // Particules : des « points de relevé » expulsés au moment de l'impact (déterministes).
  const cv = S.querySelector('.s3-parts'), ctx = cv.getContext('2d');
  const r = rng(32), parts = Array.from({ length: 140 }, () => ({
    a: r() * Math.PI * 2, v: 260 + r() * 900, s: 1.2 + r() * 2.6, acc: r() < 0.22, d: r() * 0.25, life: 1.2 + r() * 1.6,
  }));
  everyFrame((t) => {
    const tt = t - B(32);
    if (tt < 0 || tt > 4.5) { if (cv.dataset.on) { ctx.clearRect(0, 0, 1920, 1080); delete cv.dataset.on; } return; }
    cv.dataset.on = 1; ctx.clearRect(0, 0, 1920, 1080);
    for (const p of parts) {
      const k = tt - p.d; if (k <= 0) continue;
      const life = clamp(k / p.life);
      const dist = p.v * (1 - Math.exp(-k * 1.9)) / 1.9;
      const x = 960 + Math.cos(p.a) * (170 + dist), y = 470 + Math.sin(p.a) * (170 + dist) * 0.92;
      ctx.globalAlpha = (1 - life) * (p.acc ? 0.95 : 0.6);
      ctx.fillStyle = p.acc ? '#82A7F8' : '#A8A8B0';
      ctx.beginPath(); ctx.arc(x, y, p.s * (1 - life * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // Mot-marque : le logo glisse, « Relev » sort du masque, l'accent tombe sur le « e » (sur un tic).
  tl.to(mark, { x: -336, scale: 0.6, duration: B(1), ease: 'expo.inOut' }, B(36));
  const wIn = splitChars(S.querySelector('.w-in'));
  const e0 = S.querySelector('.e0'), e1 = S.querySelector('.e1');
  tl.set([...wIn, e0], { yPercent: 115 }, 0);
  tl.to([...wIn, e0], { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.035 }, B(36.35));
  tl.set(e1, { y: -150, opacity: 0, rotation: -25 }, 0);
  tl.to(e1, { y: 0, opacity: 1, rotation: 0, duration: B(0.5), ease: 'power4.in' }, B(36.5));
  tl.to(S.querySelector('.w-e'), { y: 6, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.out' }, B(37));
  cue(36, 'whoosh', { dur: 0.5, from: 0.2, to: -0.3 });
  cue(37, 'accent_tick');

  const tagW = splitWords(S.querySelector('.s3-tag'));
  revealWords(tagW, 38, { stagger: 0.035, dur: 0.7 });
  const g = [...S.querySelectorAll('.s3-geo .g, .s3-geo .sep')];
  tl.set(g, { opacity: 0, y: 24 }, 0);
  tl.to(g, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.12 }, B(39));
  cue(39, 'pop', { pan: -0.2 }); cue(39.25, 'pop', { pan: 0.2 });
  // Sortie vers la scène suivante : tout monte et s'efface.
  tl.to([S.querySelector('.s3-lock'), S.querySelector('.s3-tag'), S.querySelector('.s3-geo')], { y: -60, opacity: 0, duration: B(0.5), ease: 'power3.in', stagger: 0.03 }, B(39.6));
  tl.to(glow, { opacity: 0, duration: B(0.5) }, B(39.5));
}
