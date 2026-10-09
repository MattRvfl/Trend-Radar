// Scène 3 (temps 20 → 25,9) : le drop. « Alors chaque matin, Relevé l'enregistre pour toi. »
// Le point du jour (fin de la scène 2) explose ; six relevés reviennent, un par matin ; puis le logo se construit
// sur la signature sonore (polyligne du logo : rythme = abscisses, hauteurs = ordonnées).
import { DATA2 } from '../data2.js';
import { tl, B, cue, h, everyFrame, sceneSpan, rng, clamp, splitChars, punch } from '../core.js';

export const LOGO_HITS = [0, 1, 1.75, 3];          // en temps, depuis « Relevé »
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
export const wordSVG = () => `<span class="m"><span class="w-in">Relev</span></span><span class="w-e"><span class="m"><span class="e0">e</span></span><span class="e1">é</span></span>`;

// Construction du logo, calée sur la signature sonore.
export function buildLogo(svg, at) {
  const line = svg.querySelector('.lm-line');
  const vs = [...svg.querySelectorAll('.lm-v')], dot = svg.querySelector('.lm-dot'), ring = svg.querySelector('.lm-ring');
  const seg = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const cum = [0, seg[0] / total, (seg[0] + seg[1]) / total, 1].map((x) => `${(x * 100).toFixed(2)}%`);
  tl.set(svg, { scale: 0.3, opacity: 0, transformOrigin: '50% 50%' }, 0);
  tl.to(svg, { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, B(at));
  tl.set(line, { drawSVG: '0% 0%' }, 0);
  tl.set(vs, { scale: 0, transformOrigin: '50% 50%' }, 0);
  tl.set([dot, ring], { scale: 0, transformOrigin: '50% 50%', opacity: 1 }, 0);
  LOGO_HITS.forEach((hb, i) => {
    tl.to(vs[i], { scale: 1.6, duration: 0.12, ease: 'power2.out' }, B(at + hb));
    tl.to(vs[i], { scale: 0, duration: 0.45, ease: 'power3.out' }, B(at + hb) + 0.12);
    if (i < 3) tl.to(line, { drawSVG: `0% ${cum[i + 1]}`, duration: B(LOGO_HITS[i + 1] - hb), ease: 'power3.in' }, B(at + hb));
  });
  tl.to(dot, { scale: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.45)' }, B(at + 3));
  tl.fromTo(ring, { scale: 1, opacity: 0.9 }, { scale: 4.5, opacity: 0, duration: 1.1, ease: 'expo.out', immediateRender: false }, B(at + 3));
}

// Mot-marque : « Relev » sort du masque, l'accent tombe sur le « e » au temps `accentAt`.
export function buildWord(word, at, accentAt) {
  const wIn = splitChars(word.querySelector('.w-in'));
  const e0 = word.querySelector('.e0'), e1 = word.querySelector('.e1');
  tl.set([...wIn, e0], { yPercent: 115 }, 0);
  tl.to([...wIn, e0], { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.03 }, B(at));
  tl.set(e1, { y: -170, opacity: 0, rotation: -25 }, 0);
  tl.to(e1, { y: 0, opacity: 1, rotation: 0, duration: B(0.5), ease: 'power4.in' }, B(accentAt) - B(0.5));
  tl.to(word.querySelector('.w-e'), { y: 8, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.out' }, B(accentAt));
  cue(accentAt, 'accent_tick');
}

const DAYS = DATA2.days;
const RANKS = DAYS.map((d) => DATA2.hero.ranks[d]);
const dayLabel = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function sceneDrop(stage, amb) {
  const DX = (i) => 180 + i * 144, DY = (r) => 600 + (r - 1) / 29 * 330;
  const S = h(`<section class="scene s3">
    <div class="s3-glow"></div>
    <svg class="s3-fx" viewBox="0 0 1080 1920" width="1080" height="1920">
      ${[0, 1, 2, 3].map((i) => `<circle class="rg rg${i}" cx="540" cy="760" r="60"/>`).join('')}
      <circle class="s3-ball" cx="540" cy="760" r="80"/>
      <polyline class="s3-dl" points="${RANKS.map((r, i) => `${DX(i)},${DY(r)}`).join(' ')}"/>
      ${RANKS.map((r, i) => `<circle class="s3-dp" cx="${DX(i)}" cy="${DY(r)}" r="14"/>`).join('')}
      ${DAYS.map((d, i) => `<text class="s3-dt" x="${DX(i)}" y="1010">${dayLabel(d)}</text>`).join('')}
    </svg>
    <canvas class="s3-parts" width="1080" height="1920"></canvas>
    <div class="s3-lock">
      <div class="s3-mark">${logoSVG()}</div>
      <div class="s3-word">${wordSVG()}</div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 20, 25.95);

  // ---- b20 : le point explose (éclair, ondes, particules).
  const ball = S.querySelector('.s3-ball');
  tl.to(ball, { attr: { r: 0 }, duration: 0.35, ease: 'expo.out' }, B(20));
  const flash = h('<div class="flash"></div>');
  S.append(flash);
  tl.set(flash, { opacity: 0 }, 0);
  tl.set(flash, { opacity: 0.24 }, B(20));
  tl.to(flash, { opacity: 0, duration: 0.2, ease: 'power2.out' }, B(20) + 0.017);
  [...S.querySelectorAll('.rg')].forEach((c, i) => {
    tl.set(c, { opacity: 0 }, 0);
    tl.fromTo(c, { attr: { r: 60 }, opacity: 0.85 }, { attr: { r: 60 + 1100 }, opacity: 0, duration: 1.5 + i * 0.15, ease: 'expo.out', immediateRender: false }, B(20 + i * 0.12));
  });
  cue(20, 'drop');
  const glow = S.querySelector('.s3-glow');
  tl.set(glow, { opacity: 0, scale: 0.6 }, 0);
  tl.to(glow, { opacity: 1, scale: 1.1, duration: 0.25 }, B(20));
  tl.to(glow, { opacity: 0.35, scale: 1, duration: 1.4 }, B(20) + 0.25);
  amb.set('accent', 20, 0.5);
  tl.to(amb.accent, { opacity: 0.22, duration: B(3) }, B(20.3));

  const cv = S.querySelector('.s3-parts'), ctx = cv.getContext('2d');
  const r = rng(20), parts = Array.from({ length: 170 }, () => ({
    a: r() * Math.PI * 2, v: 300 + r() * 1100, s: 1.6 + r() * 3.4, acc: r() < 0.3, d: r() * 0.18, life: 1.0 + r() * 1.5,
  }));
  everyFrame((t) => {
    const tt = t - B(20);
    if (tt < 0 || tt > 3.2) { if (cv.dataset.on) { ctx.clearRect(0, 0, 1080, 1920); delete cv.dataset.on; } return; }
    cv.dataset.on = 1; ctx.clearRect(0, 0, 1080, 1920);
    for (const p of parts) {
      const k = tt - p.d; if (k <= 0) continue;
      const life = clamp(k / p.life);
      const dist = p.v * (1 - Math.exp(-k * 2.1)) / 2.1;
      const x = 540 + Math.cos(p.a) * (90 + dist), y = 760 + Math.sin(p.a) * (90 + dist);
      ctx.globalAlpha = (1 - life) * (p.acc ? 0.95 : 0.55);
      ctx.fillStyle = p.acc ? '#82A7F8' : '#A8A8B0';
      ctx.beginPath(); ctx.arc(x, y, p.s * (1 - life * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // ---- « chaque matin » : six relevés, un par matin (les vrais rangs du rasoir), sur des croches.
  const dl = S.querySelector('.s3-dl'), dps = [...S.querySelectorAll('.s3-dp')], dts = [...S.querySelectorAll('.s3-dt')];
  tl.set(dl, { drawSVG: '0% 0%' }, 0);
  const seg = RANKS.slice(1).map((rk, i) => Math.hypot(144, (rk - RANKS[i]) / 29 * 330));
  const tot = seg.reduce((a, b) => a + b, 0);
  let acc = 0;
  dps.forEach((p, i) => {
    const at = 20.25 + i * 0.25;
    tl.set([p, dts[i]], { opacity: 0 }, 0);
    tl.set(p, { scale: 0, transformOrigin: '50% 50%' }, 0);
    tl.to(p, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(3)' }, B(at));
    tl.to(dts[i], { opacity: 1, duration: 0.2 }, B(at));
    if (i > 0) { acc += seg[i - 1]; tl.to(dl, { drawSVG: `0% ${(acc / tot * 100).toFixed(2)}%`, duration: B(0.25), ease: 'power2.inOut' }, B(at - 0.25)); }
    cue(at, 'morning', { i, rank: RANKS[i] });
  });
  tl.to(dps[5], { fill: '#82A7F8', duration: 0.15 }, B(21.5));
  // Tout converge vers le centre du logo, qui se construit sur « Relevé ».
  const days = [dl, ...dps, ...dts];
  tl.to(days, { opacity: 0, duration: B(0.4), ease: 'power2.in' }, B(21.6));
  tl.to(S.querySelector('.s3-fx'), { scale: 0.25, transformOrigin: '540px 720px', duration: B(0.45), ease: 'power3.in' }, B(21.55));

  const svg = S.querySelector('.logo-svg');
  buildLogo(svg, 22);
  LOGO_HITS.forEach((hb, i) => cue(22 + hb, 'logo_vertex', { i }));
  tl.to(glow, { opacity: 0.8, scale: 1.1, duration: 0.2 }, B(22));
  tl.to(glow, { opacity: 0.4, duration: 1.2 }, B(22) + 0.2);
  tl.to(glow, { opacity: 0.9, scale: 1.15, duration: 0.15 }, B(25));
  tl.to(glow, { opacity: 0.3, duration: 0.6 }, B(25) + 0.15);
  buildWord(S.querySelector('.s3-word'), 22.55, 25);
  const lock = S.querySelector('.s3-lock');
  punch(lock, 25, { s: 1.06, dur: 0.45 });
  // Sortie : le bloc file vers le haut, place aux sources.
  tl.to(lock, { y: 120, scale: 0.7, opacity: 0, duration: B(0.32), ease: 'power3.in' }, B(25.3));
  tl.to(glow, { opacity: 0, duration: B(0.4) }, B(25.3));
}
