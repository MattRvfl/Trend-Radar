// Scène 8 (temps 111.5 → 132) : retour au sombre, constellation de vrais fragments de l'interface,
// logo sur la signature sonore, appel à l'action (adresse, compte gratuit, membre fondateur), extinction.
import { DATA } from '../data.js';
import { tl, B, cue, h, icon, splitWords, splitChars, revealWords, sceneSpan, fr, rng, enter } from '../lib/core.js';
import { logoSVG, buildLogo, LOGO_HITS } from './s3-logo.js';
import { delta, thumb, esc } from '../lib/ui.js';
import { sparkline } from '../lib/site.js';

export function scene8(stage) {
  const S = h(`<section class="scene s8">
    <div class="s8-glow"></div>
    <div class="s8-space"><div class="s8-cloud"></div></div><div class="s8-spot"></div>
    <div class="s8-lock">
      <div class="s8-mark">${logoSVG()}</div>
      <div class="s8-word"><span class="m"><span class="w-in">Relev</span></span><span class="w-e"><span class="m"><span class="e0">e</span></span><span class="e1">é</span></span></div>
    </div>
    <div class="s8-tag lede">${fr('Ce qui grimpe dans les classements, ce matin.')}</div>
    <div class="s8-cta">
      <div class="url-pill">${icon('globe')}<span>mattrvfl.github.io/Trend-Radar</span>${icon('arrow-up-right')}</div>
      <div class="acc-row"><span class="acc-t">${fr('Compte gratuit, sans mot de passe')}</span>
        <span class="prov">${['site-pv-google', 'site-pv-github', 'site-pv-azure', 'site-pv-discord', 'site-i-mail'].map((n) => `<i class="pv">${icon(n)}</i>`).join('')}</span></div>
      <div class="founder">${icon('site-i-star')}<span>${fr('Membre fondateur · 1 an offert')}</span></div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 111, END());

  // ---- Constellation : vrais badges, produits, sources, drapeaux, catégories.
  const cloud = S.querySelector('.s8-cloud');
  const frags = [];
  const r = rng(112);
  const ups = DATA.ups.slice(0, 6), downs = DATA.downs.slice(0, 3), news = DATA.news.slice(0, 4), n1 = DATA.number1.slice(0, 6);
  ups.forEach((it) => frags.push(`<div class="fg fb">${delta(it, 2)}</div>`));
  downs.forEach((it) => frags.push(`<div class="fg fb">${delta(it, 2)}</div>`));
  news.slice(0, 3).forEach((it) => frags.push(`<div class="fg fb">${delta(it, 2)}</div>`));
  [...ups.slice(0, 3), ...news.slice(0, 2), ...n1.slice(0, 3)].forEach((it) => frags.push(`<div class="fg fr">${thumb(it.category, 40)}<span class="frt"><b class="num">n° ${it.rank}</b> ${esc(it.short)}</span>${it.spark ? sparkline(it.spark) : ''}</div>`));
  ['amazon', 'shopify', 'google'].forEach((s) => frags.push(`<div class="fg fl">${icon(s === 'google' ? 'site-pv-google' : s)}</div>`));
  ['flag-fr', 'flag-us'].forEach((f) => frags.push(`<div class="fg ff">${icon(f)}</div>`));
  ['smartphone', 'puzzle', 'spray-can', 'shirt', 'heart-pulse', 'cooking-pot', 'gamepad-2', 'paw-print'].forEach((c) => frags.push(`<div class="fg fc">${icon(c)}</div>`));
  frags.push(`<div class="fg fs"><i class="dot amazon"></i>Amazon · 14:10</div>`, `<div class="fg fs"><i class="dot shopify"></i>Shopify · 14:19</div>`, `<div class="fg fs"><i class="dot google"></i>Google · 14:19</div>`);
  const els = frags.map((f) => { const e = h(f); cloud.append(e); return e; });
  // Positions : réparties autour du centre, sans jamais se projeter derrière le logo, le slogan ou l'appel à l'action.
  const P = 1100, box = { x0: -520, x1: 520, y0: -200, y1: 500 };
  const placed = [];
  els.forEach((e, i) => {
    let x = 0, y = 0, z = 0;
    for (let tries = 0; tries < 400; tries++) {
      const a = r() * Math.PI * 2, rr = 0.55 + r() * 0.6;
      x = Math.cos(a) * 1050 * rr; y = Math.sin(a) * 620 * rr; z = -150 - r() * 650;
      const k = P / (P - z), sx = x * k, sy = y * k;
      const inBox = sx > box.x0 - 60 && sx < box.x1 + 60 && sy > box.y0 - 40 && sy < box.y1 + 40;
      const onScreen = Math.abs(sx) < 930 && sy > -400 && sy < 620;
      const crowded = placed.some(([px, py]) => Math.hypot(px - sx, py - sy) < 150);
      if (!inBox && onScreen && !crowded) { placed.push([sx, sy]); break; }
    }
    tl.set(e, { x: 0, y: 0, z: -2600, opacity: 0, rotationY: 0, xPercent: -50, yPercent: -50 }, 0);
    tl.to(e, { x, y, z, opacity: 1, rotationY: (r() - 0.5) * 30, duration: B(2.2), ease: 'expo.out' }, B(112 + (i % 6) * 0.02));
    tl.to(e, { opacity: 0.28, duration: B(2) }, B(114));
  });
  tl.set(cloud, { rotationY: -8, rotationX: 4 }, 0);
  tl.to(cloud, { rotationY: 10, rotationX: -3, duration: B(18), ease: 'none' }, B(112));
  cue(112, 'impact', { size: 'xxl' });

  // ---- Logo + mot-marque (même construction que la scène 3).
  const svg = S.querySelector('.logo-svg');
  buildLogo(svg, 112);
  LOGO_HITS.forEach((hb, i) => cue(112 + hb, 'logo_vertex', { i, final: true }));
  const glow = S.querySelector('.s8-glow');
  tl.set(glow, { opacity: 0, scale: 0.6 }, 0);
  tl.to(glow, { opacity: 1, scale: 1.1, duration: 0.3 }, B(112));
  tl.to(glow, { opacity: 0.45, scale: 1, duration: 2 }, B(112) + 0.3);
  const mark = S.querySelector('.s8-mark');
  tl.to(mark, { x: -336, scale: 0.6, duration: B(1), ease: 'expo.inOut' }, B(116));
  const wIn = splitChars(S.querySelector('.s8-word .w-in'));
  const e0 = S.querySelector('.s8-word .e0'), e1 = S.querySelector('.s8-word .e1');
  tl.set([...wIn, e0], { yPercent: 115 }, 0);
  tl.to([...wIn, e0], { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.035 }, B(116.35));
  tl.set(e1, { y: -150, opacity: 0, rotation: -25 }, 0);
  tl.to(e1, { y: 0, opacity: 1, rotation: 0, duration: B(0.5), ease: 'power4.in' }, B(116.5));
  cue(116, 'whoosh', { dur: 0.5, from: 0.2, to: -0.3 });
  cue(117, 'accent_tick');
  const tagW = splitWords(S.querySelector('.s8-tag'));
  revealWords(tagW, 118, { stagger: 0.04, dur: 0.8 });

  // ---- Appel à l'action
  const pill = S.querySelector('.url-pill');
  enter(pill, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' }, B(120));
  cue(120, 'pop', { pan: 0 });
  const accT = S.querySelector('.acc-t');
  enter(accT, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(120.75));
  [...S.querySelectorAll('.pv')].forEach((p, i) => {
    enter(p, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.5)' }, B(121 + i * 0.25));
    cue(121 + i * 0.25, 'tick_hi', { pan: 0.1 + i * 0.12, n: i + 4 });
  });
  const fd = S.querySelector('.founder');
  enter(fd, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, B(122.5));
  enter(fd.querySelector('svg'), { rotation: -90, scale: 0 }, { rotation: 0, scale: 1, duration: 0.7, ease: 'back.out(2)' }, B(122.5));
  cue(122.5, 'pop_new', { pan: 0 });

  // ---- Écho de la signature sur le point d'accent, puis extinction.
  const dot = svg.querySelector('.lm-dot'), ring = svg.querySelector('.lm-ring');
  LOGO_HITS.forEach((hb, i) => {
    tl.to(dot, { scale: 1.35, duration: 0.08, ease: 'power2.out' }, B(124 + hb));
    tl.to(dot, { scale: 1, duration: 0.4, ease: 'power3.out' }, B(124 + hb) + 0.08);
  });
  tl.fromTo(ring, { scale: 1, opacity: 0.8 }, { scale: 4, opacity: 0, duration: 1.2, ease: 'expo.out' }, B(127));
  const fadeAll = [S.querySelector('.s8-cta'), S.querySelector('.s8-tag'), S.querySelector('.s8-word'), cloud, glow];
  tl.to(fadeAll, { opacity: 0, duration: B(1), ease: 'power2.inOut' }, B(128.5));
  const sq = svg.querySelector('.lm-sq'), ln = svg.querySelector('.lm-line');
  tl.to([sq, ln], { opacity: 0, duration: B(0.75), ease: 'power2.inOut' }, B(129.25));
  tl.to(dot, { scale: 0, duration: 0.18, ease: 'power3.in' }, B(130.25));
  cue(130.25, 'dot_off');
}

const END = () => 132.01;
