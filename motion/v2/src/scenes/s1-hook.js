// Scènes 1-2 (temps 0 → 20) : le crochet puis le problème.
// « En cinq jours, ce rasoir est passé de la 25e à la 2e place des meilleures ventes Amazon. »
// Vraies données : Philips OneBlade 360, Hygiène et Santé (FR), n° 25 → 18 → 12 → 11 → 3 → 2 du 3 au 8 octobre 2026.
// « Le problème ? Ce classement change toutes les heures… et Amazon n'affiche aucun historique. »
import { DATA2 } from '../data2.js';
import { tl, B, cue, h, icon, everyFrame, enter, sceneSpan, rng, clamp, shake, punch, fr } from '../core.js';
import { thumb, esc } from '../ui.js';

const DAYS = DATA2.days;
const RANKS = DAYS.map((d) => DATA2.hero.ranks[d]);              // [25, 18, 12, 11, 3, 2]
const STEP_AT = [4, 4.75, 5, 5.25, 5.5, 5.75];                    // le rang change sur des doubles-croches, « deuxième » sur 5,75
const TY = (r) => (16 + (r - 1) / 29 * 130).toFixed(1);   // frise : n° 1 en haut, n° 30 en bas
const dayLabel = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function sceneHook(stage, amb) {
  const hero = DATA2.hero;
  const S = h(`<section class="scene s1">
    <div class="s1-bg"><div class="s1-bgstrip"></div></div>
    <div class="cam s1-cam">
      <div class="s1-head pill">${icon('amazon')}<span>Meilleures ventes</span><span class="sep">·</span><span>Hygiène et Santé</span>${icon('flag-fr')}</div>
      <div class="s1-num">
        <span class="s1-no">n°</span>
        <span class="s1-mask"><span class="s1-strip">${RANKS.map((r) => `<span class="s1-v num">${r}</span>`).join('')}</span></span>
      </div>
      <div class="s1-q">?</div>
      <div class="s1-badge c-delta is-up" style="--s:3.9">${icon('site-i-up')}<span class="num">23</span></div>
      <div class="s1-card">
        ${thumb('sante', 112)}
        <div class="s1-ct"><div class="s1-title">${esc(hero.title)}</div><div class="s1-sub">${fr('Rasoir électrique · Amazon.fr')}</div></div>
      </div>
      <svg class="s1-tl" viewBox="0 0 840 210" width="840" height="210">
        <polyline class="s1-line" points="${RANKS.map((r, i) => `${30 + i * 156},${TY(r)}`).join(' ')}"/>
        ${RANKS.map((r, i) => `<circle class="s1-pt s1-pt${i}" cx="${30 + i * 156}" cy="${TY(r)}" r="12"/>`).join('')}
        ${DAYS.map((d, i) => `<text class="s1-dl s1-dl${i}" x="${30 + i * 156}" y="198">${dayLabel(d)}</text>`).join('')}
      </svg>
      <div class="s2-clock"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line class="hh" x1="12" y1="12" x2="12" y2="7.2"/><line class="mh" x1="12" y1="12" x2="12" y2="4.6"/></svg></div>
      <div class="s2-list"></div>
      <div class="s2-chart"></div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 0, 20.02);
  const cam = S.querySelector('.s1-cam');

  // ---------------------------------------------------------------- fond : vraies lignes du classement, qui défilent
  const strip = S.querySelector('.s1-bgstrip');
  const rowsBg = [...DATA2.sante['2026-10-08'], ...DATA2.sante['2026-10-03']];
  strip.innerHTML = rowsBg.map((x) => `<div class="s1-br"><b class="num">${x.rank}</b><span>${esc(x.t)}</span></div>`).join('');
  tl.set(strip, { y: -1700 }, 0);
  tl.to(strip, { y: -1560, duration: B(4.75), ease: 'none' }, 0);
  tl.to(strip, { y: 260, duration: B(1.0), ease: 'power2.inOut' }, B(4.75));
  tl.to(strip, { y: 420, duration: B(14), ease: 'none' }, B(5.75));
  const bg = S.querySelector('.s1-bg');
  tl.to(bg, { opacity: 0.0, duration: B(1) }, B(11.5));

  // ---------------------------------------------------------------- caméra : poussée lente, à-coups sur les temps
  tl.set(cam, { scale: 1, transformOrigin: '50% 40%' }, 0);
  tl.to(cam, { scale: 1.045, duration: B(4.6), ease: 'none' }, 0);
  tl.to(cam, { scale: 1.0, duration: B(1.1), ease: 'expo.out' }, B(4.65));
  tl.to(cam, { scale: 1.03, duration: B(4), ease: 'none' }, B(5.75));
  tl.to(cam, { scale: 1.0, duration: B(1.2), ease: 'power2.inOut' }, B(10.4));

  // ---------------------------------------------------------------- le rang géant, en rouleau (machine à sous)
  const num = S.querySelector('.s1-num'), no = S.querySelector('.s1-no'), mask = S.querySelector('.s1-mask');
  const sv = [...S.querySelectorAll('.s1-v')];
  S.style.display = 'block';
  const wNo = no.getBoundingClientRect().width, gap = 14;
  const wv = sv.map((e) => e.getBoundingClientRect().width);
  const left = (i) => 540 - (wNo + gap + wv[i]) / 2;
  tl.set(no, { x: left(0) }, 0);
  tl.set(mask, { x: left(0) + wNo + gap }, 0);
  const stripN = S.querySelector('.s1-strip');
  tl.set(stripN, { yPercent: 0 }, 0);
  for (let i = 1; i < RANKS.length; i++) {
    const at = B(STEP_AT[i]);
    const d = i === RANKS.length - 1 ? 0.16 : 0.1;
    tl.to(stripN, { yPercent: -100 * i / RANKS.length, duration: d, ease: 'power2.out' }, at - d * 0.55);
    tl.to(no, { x: left(i), duration: d, ease: 'power2.out' }, at - d * 0.55);
    tl.to(mask, { x: left(i) + wNo + gap, duration: d, ease: 'power2.out' }, at - d * 0.55);
    cue(STEP_AT[i], 'rank_step', { i, rank: RANKS[i], final: i === RANKS.length - 1 });
  }
  // pulsation sur les temps avant l'ascension, coup sur « vingt-cinquième », impact sur « deuxième »
  [0, 1, 2, 3].forEach((b) => punch(num, b, { s: 1.025, dur: 0.3 }));
  cue(0, 'impact');                                   // première image : un coup net (la boucle repart aussi d'ici)
  punch(num, 3.9, { s: 1.07, dur: 0.4 });
  punch(num, 5.75, { s: 1.16, dur: 0.55 });
  tl.set(sv, { color: '#EDEDEF' }, 0);
  tl.to(sv[sv.length - 1], { color: '#3CCB9B', duration: 0.12 }, B(5.75));
  tl.to(no, { color: '#3CCB9B', duration: 0.12 }, B(5.75));
  shake(cam, 5.75, { amp: 18, dur: 0.4, seed: 3 });
  cue(5.75, 'slam', { size: 'l' });
  const flash = h('<div class="flash"></div>');
  S.append(flash);
  tl.fromTo(flash, { opacity: 0.0 }, { opacity: 0.22, duration: 0.03, immediateRender: false }, B(5.75));
  tl.to(flash, { opacity: 0, duration: 0.25 }, B(5.75) + 0.03);

  const badge = S.querySelector('.s1-badge');
  enter(badge, { opacity: 0, scale: 0.3, rotation: -8 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.4)' }, B(6.05));
  cue(6.05, 'pop_up', { n: 5, pan: 0.3 });

  // ---------------------------------------------------------------- en-tête, carte produit, frise des 6 jours
  const head = S.querySelector('.s1-head');
  punch(head, 7.5, { s: 1.05, dur: 0.35 });
  const amz = head.querySelector('.brand');
  punch(amz, 8.96, { s: 1.45, dur: 0.5 });
  tl.set(amz, { color: '#EDEDEF' }, 0);
  tl.to(amz, { color: '#F0A23B', duration: 0.15 }, B(8.96));
  tl.to(amb.amazon, { opacity: 0.5, duration: 0.15 }, B(8.96));
  tl.to(amb.amazon, { opacity: 0.0, duration: B(2) }, B(9.4));
  cue(8.96, 'logo_pop', { pan: 0 });
  const card = S.querySelector('.s1-card');
  punch(card, 2.0, { s: 1.04, dur: 0.35 });
  cue(2.0, 'card', { soft: true });

  const line = S.querySelector('.s1-line');
  const pts = [...S.querySelectorAll('.s1-pt')], dls = [...S.querySelectorAll('.s1-dl')];
  tl.set(line, { drawSVG: '0% 0%' }, 0);
  const segs = RANKS.slice(1).map((r, i) => Math.hypot(156, (r - RANKS[i]) / 29 * 130));
  const tot = segs.reduce((a, b) => a + b, 0);
  let acc = 0;
  pts.forEach((p, i) => {
    if (i > 0) {   // le point du 3 octobre est là dès la première image
      tl.set(p, { scale: 0, transformOrigin: '50% 50%' }, 0);
      tl.to(p, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, B(STEP_AT[i]));
    }
    if (i > 0) {
      acc += segs[i - 1];
      tl.to(line, { drawSVG: `0% ${(acc / tot * 100).toFixed(2)}%`, duration: 0.09, ease: 'power1.out' }, B(STEP_AT[i]) - 0.09);
    }
  });
  // « En cinq jours » : les dates apparaissent une à une (le 3 est déjà là à la première image).
  dls.forEach((d, i) => {
    if (i === 0) return;
    tl.set(d, { opacity: 0, y: 10 }, 0);
    tl.to(d, { opacity: 0.55, y: 0, duration: 0.2, ease: 'power2.out' }, B(0.25 + i * 0.13));
    cue(0.25 + i * 0.13, 'tick_hi', { n: i, pan: -0.5 + i * 0.2, soft: true });
  });
  dls.forEach((d, i) => tl.to(d, { opacity: 1, fill: i === 5 ? '#3CCB9B' : '#EDEDEF', duration: 0.08 }, B(STEP_AT[i])));
  tl.set(pts[5], { fill: '#82A7F8' }, 0);
  tl.to(pts[5], { fill: '#3CCB9B', duration: 0.1 }, B(5.75));
  tl.to(line, { stroke: '#3CCB9B', duration: 0.2 }, B(5.75));

  amb.set('accent', 0, 0.35);
  tl.to(amb.up, { opacity: 0.55, duration: 0.12 }, B(5.75));
  tl.to(amb.accent, { opacity: 0.0, duration: 0.3 }, B(5.75));
  tl.to(amb.up, { opacity: 0.25, duration: B(3) }, B(6.2));

  // ================================================================ LE PROBLÈME (temps 10 → 20)
  const q = S.querySelector('.s1-q');
  tl.set(q, { opacity: 0 }, 0);
  const glitch = rng(10);
  const G = Array.from({ length: 12 }, () => [(glitch() - 0.5) * 70, (glitch() - 0.5) * 18, glitch()]);
  everyFrame((t) => {
    const k = t - B(10.06);
    if (k < 0 || k > 0.24) { if (num._g) { num.style.translate = ''; num.style.filter = ''; q.style.translate = ''; num._g = 0; } return; }
    const g = G[Math.floor(k / 0.02) % G.length];
    num.style.translate = `${g[0].toFixed(1)}px ${g[1].toFixed(1)}px`;
    q.style.translate = `${(-g[0] * 0.6).toFixed(1)}px 0px`;
    num.style.filter = g[2] > 0.5 ? 'drop-shadow(8px 0 0 #FF925A) drop-shadow(-8px 0 0 #82A7F8)' : 'none';
    num._g = 1;
  });
  tl.to(num, { opacity: 0, duration: 0.02 }, B(10.06) + 0.12);
  tl.to(q, { opacity: 1, duration: 0.02 }, B(10.06) + 0.12);
  punch(q, 10.38, { s: 1.12, dur: 0.45 });
  cue(10.06, 'glitch', { dur: 0.24 });
  tl.to([badge, card, S.querySelector('.s1-tl')], { opacity: 0.18, filter: 'grayscale(1)', duration: 0.15 }, B(10.06));
  tl.to(amb.up, { opacity: 0, duration: 0.2 }, B(10.06));
  tl.to(amb.down, { opacity: 0.45, duration: 0.2 }, B(10.06));
  tl.to(amb.down, { opacity: 0.2, duration: B(2) }, B(10.6));
  // Sortie : le « ? » remonte et s'efface, la carte et la frise descendent.
  tl.to(q, { y: -120, scale: 0.4, opacity: 0, duration: B(0.6), ease: 'power3.in' }, B(11.3));
  tl.to([badge, card, S.querySelector('.s1-tl')], { y: 80, opacity: 0, duration: B(0.5), ease: 'power3.in', stagger: 0.03 }, B(11.3));

  // ---- « Ce classement change toutes les heures… » : la vraie liste (top 6) se réordonne, jour après jour.
  const clock = S.querySelector('.s2-clock');
  enter(clock, { opacity: 0, scale: 0.4, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, B(11.85));
  const hh = clock.querySelector('.hh'), mh = clock.querySelector('.mh');
  everyFrame((t) => {
    const k = Math.max(0, t - B(11.85));
    const turns = k < B(3.6) ? k / BEAT_S() * 1.0 : 3.6 + (1 - Math.exp(-(k - B(3.6)) * 3)) * 0.3;
    mh.setAttribute('transform', `rotate(${(turns * 360) % 360} 12 12)`);
    hh.setAttribute('transform', `rotate(${(turns * 30 + 120) % 360} 12 12)`);
  });
  tl.to(clock, { opacity: 0, y: -40, duration: B(0.5), ease: 'power3.in' }, B(15.35));

  const list = S.querySelector('.s2-list');
  const ids = [];
  const states = DAYS.map((d) => DATA2.sante[d].slice(0, 6));
  states.flat().forEach((x) => { if (!ids.includes(x.id)) ids.push(x.id); });
  const info = Object.fromEntries(states.flat().map((x) => [x.id, x]));
  list.innerHTML = `<div class="s2-ranks">${[1, 2, 3, 4, 5, 6].map((n) => `<b class="num">${n}</b>`).join('')}</div>`
    + ids.map((id) => `<div class="s2-row${id === hero.id ? ' is-hero' : ''}" data-id="${id}">${thumb('sante', 70)}<span class="t">${esc(id === hero.id ? hero.title : info[id].t)}</span></div>`).join('');
  const rows = Object.fromEntries([...list.querySelectorAll('.s2-row')].map((e) => [e.dataset.id, e]));
  const RH = 104;
  const pos = (k, id) => states[k].findIndex((x) => x.id === id);
  const SH = [12, 12.5, 13, 13.5, 14, 14.5];       // jour k affiché à partir de SH[k]
  ids.forEach((id) => {
    const r = rows[id];
    const p0 = pos(0, id);
    tl.set(r, { y: (p0 < 0 ? 6 : p0) * RH, x: p0 < 0 ? 140 : 0, opacity: 0 }, 0);
    if (p0 >= 0) tl.to(r, { opacity: 1, x: 0, duration: 0.35, ease: 'expo.out' }, B(11.9 + p0 * 0.06));
    for (let k = 1; k < states.length; k++) {
      const a = pos(k - 1, id), b = pos(k, id);
      const at = B(SH[k]) - 0.09;
      if (a >= 0 && b >= 0 && a !== b) tl.to(r, { y: b * RH, duration: 0.2, ease: 'power3.inOut' }, at);
      if (a >= 0 && b < 0) tl.to(r, { x: -160, opacity: 0, duration: 0.18, ease: 'power2.in' }, at);
      if (a < 0 && b >= 0) { tl.set(r, { y: b * RH, x: 160 }, at); tl.to(r, { x: 0, opacity: 1, duration: 0.22, ease: 'power3.out' }, at + 0.03); }
    }
  });
  const rk = list.querySelector('.s2-ranks');
  enter(rk, { opacity: 0 }, { opacity: 1, duration: 0.3 }, B(11.9));
  SH.slice(1).forEach((b, i) => cue(b, 'shuffle', { n: i, pan: (i % 2 ? 0.3 : -0.3) }));
  cue(11.9, 'list_in', { n: 6 });
  tl.to(list, { x: -1100, duration: B(0.45), ease: 'power3.in' }, B(15.15));
  cue(15.15, 'whoosh', { dur: B(0.45), from: 0.2, to: -0.9, soft: true });

  // ---- « …et Amazon n'affiche aucun historique. » : la courbe revient, puis s'efface. Il ne reste qu'aujourd'hui.
  const CW = 900, CH = 520, X0 = 70, XS = 152, Y0 = 50, YR = 360;
  const cx = (i) => X0 + i * XS, cy = (r) => Y0 + (r - 1) / 29 * YR;
  const chart = S.querySelector('.s2-chart');
  chart.innerHTML = `<svg viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}">
      ${[1, 10, 20, 30].map((r) => `<line class="g" x1="${X0 - 30}" x2="${CW - 20}" y1="${cy(r)}" y2="${cy(r)}"/><text class="gl" x="${X0 - 40}" y="${cy(r) + 8}">n° ${r}</text>`).join('')}
      <polyline class="cl" points="${RANKS.map((r, i) => `${cx(i)},${cy(r)}`).join(' ')}"/>
      ${RANKS.map((r, i) => `<circle class="cp cp${i}" cx="${cx(i)}" cy="${cy(r)}" r="13"/>`).join('')}
      ${DAYS.map((d, i) => `<text class="cd cd${i}" x="${cx(i)}" y="${CH - 40}">${dayLabel(d)}</text>`).join('')}
    </svg><div class="s2-eraser">${icon('eraser')}</div>`;
  const cl = chart.querySelector('.cl'), cps = [...chart.querySelectorAll('.cp')], cds = [...chart.querySelectorAll('.cd')];
  const gl = [...chart.querySelectorAll('.g, .gl')];
  enter(chart, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(15.6));
  tl.set(cl, { drawSVG: '0% 0%' }, 0);
  tl.to(cl, { drawSVG: '0% 100%', duration: B(0.9), ease: 'power2.inOut' }, B(15.8));
  cps.forEach((p, i) => {
    tl.set(p, { scale: 0, transformOrigin: '50% 50%' }, 0);
    tl.to(p, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, B(15.8 + i * 0.17));
    cue(15.8 + i * 0.17, 'point', { i, rank: RANKS[i] });
  });
  cds.forEach((d, i) => enter(d, { opacity: 0 }, { opacity: 1, duration: 0.25 }, B(15.85 + i * 0.17)));
  // Gomme : de gauche à droite, jusqu'à la veille.
  const er = chart.querySelector('.s2-eraser');
  const ERA = 17.45, ERZ = 18.75;
  const ex = (i) => cx(i) - 30, ey = (i) => cy(RANKS[i]) - 84;
  enter(er, { opacity: 0, x: ex(0) - 30, y: ey(0) - 30, rotation: -25 }, { opacity: 1, x: ex(0), y: ey(0), rotation: 0, duration: 0.2 }, B(ERA) - 0.2);
  for (let i = 1; i <= 4; i++) tl.to(er, { x: ex(i), y: ey(i), duration: B(ERZ - ERA) / 4, ease: 'none' }, B(ERA) + B(ERZ - ERA) * (i - 1) / 4);
  tl.to(er, { opacity: 0, x: ex(4) + 60, duration: 0.25 }, B(ERZ));
  tl.set(cl, { drawSVG: '0% 100%' }, B(16.71));
  tl.to(cl, { drawSVG: '100% 100%', duration: B(ERZ - ERA), ease: 'power1.inOut' }, B(ERA));
  for (let i = 0; i < 5; i++) {
    const at = ERA + (ERZ - ERA) * (i + 0.5) / 5.4;
    tl.to([cps[i], cds[i]], { opacity: 0, scale: 0.4, duration: 0.18, ease: 'power2.in' }, B(at));
  }
  cue(ERA, 'erase', { dur: B(ERZ - ERA) });
  tl.to(gl, { opacity: 0.25, duration: B(1) }, B(ERA));
  // Il ne reste qu'un point : on plonge dedans (il deviendra le point du logo).
  const last = cps[5];
  tl.to(last, { attr: { r: 16 }, duration: 0.3, ease: 'back.out(3)' }, B(18.3));
  tl.to(last, { fill: '#82A7F8', duration: 0.2 }, B(18.3));
  tl.to(cds[5], { fill: '#EDEDEF', duration: 0.2 }, B(18.3));
  // Position du dernier point à l'écran (pour la plongée) : graphique placé en left 90, top 560.
  const px = 90 + cx(5), py = 560 + cy(RANKS[5]);
  tl.set(cam, { transformOrigin: `${px}px ${py}px` }, B(19.0));
  tl.to(cam, { scale: 5, x: 540 - px, y: 760 - py, duration: B(1.0), ease: 'power3.in' }, B(19.0));
  tl.to([S.querySelector('.s1-head'), cds[5], ...gl], { opacity: 0, duration: B(0.6) }, B(19.1));
  tl.to(amb.down, { opacity: 0, duration: B(1) }, B(19));
  tl.to(amb.accent, { opacity: 0.4, duration: B(1) }, B(19));
  cue(19.0, 'dive', { dur: B(1.0) });
}

const BEAT_S = () => B(1);
