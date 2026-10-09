// Scène 1 (temps 0 → 16) : mur 3D de vrais classements Amazon.
// Chaque bloc passe du classement de la veille (7 oct.) à celui du jour (8 oct.) : les mouvements sont réels.
/* global gsap */
import { DATA } from '../data.js';
import { tl, B, cue, h, splitWords, splitChars, revealWords, hideWords, sceneSpan, fr, rng } from '../lib/core.js';
import { delta, thumb, flag, esc, price } from '../lib/ui.js';

const ROW = 64, HEAD = 64, COLW = 760, GAP = 44, PER = 7;

function movement(list) {
  return list.slice(0, PER).reduce((s, it) => s + (it.new ? 12 : Math.abs(it.change || 0)), 0);
}

export function scene1(stage) {
  const S = h(`<section class="scene s1"><div class="grid-bg"></div><div class="wall-cam"><div class="wall"></div></div>
    <div class="fog"></div><div class="s1-shade"></div>
    <div class="s1-copy">
      <div class="display s1-l1">${fr('Chaque matin,')}</div>
      <div class="display s1-l2">les classements</div>
      <div class="display s1-l3"><span class="acc">bougent.</span></div>
    </div>
    <div class="s1-black"></div></section>`);
  stage.append(S);
  sceneSpan(S, 0, 16.02);

  // ---- Choix des blocs : les listes qui bougent le plus, dont Électroménager FR (le héros : Bosch ▲ 18).
  const byList = {};
  for (const it of DATA.wall) (byList[`${it.market}-${it.category}`] ||= []).push(it);
  const keys = Object.keys(byList).filter((k) => k !== 'FR-electromenager')
    .sort((a, b) => movement(byList[b]) - movement(byList[a])).slice(0, 15);
  keys.splice(5, 0, 'FR-electromenager');         // colonne 1, bloc 1 : près du centre du cadre
  const wall = S.querySelector('.wall');
  const cols = [0, 1, 2, 3].map((c) => {
    const col = h(`<div class="wcol" style="left:${c * (COLW + GAP)}px"></div>`); wall.append(col); return col;
  });

  const blocks = [];
  keys.forEach((k, i) => {
    const c = Math.floor(i / 4), list = byList[k].slice(0, PER);
    const [m] = k.split('-');
    const bl = h(`<div class="wblock">
      <div class="wb-head"><span class="wb-cat">${esc(list[0].cat)}</span>${flag(m)}<span class="wb-cmp">comparé au 7 oct.</span></div>
      <div class="wb-body"><div class="wb-ranks">${list.map((it, j) => `<span class="num">${j + 1}</span>`).join('')}</div><div class="wb-items"></div></div>
    </div>`);
    cols[c].append(bl);
    const itemsEl = bl.querySelector('.wb-items');
    // Veille (7 oct.) → jour (8 oct.) : vrais classements. Les sortants glissent vers le bas,
    // les entrants (ou les remontées de plus loin) arrivent d'en dessous.
    const before = (DATA.yesterday[k] || []).slice(0, PER);
    const todayIds = new Set(list.map((it) => it.id));
    const leavers = before.filter((it) => !todayIds.has(it.id));
    const yRank = Object.fromEntries(before.map((it) => [it.id, it.rank]));
    const els = [];
    list.forEach((it, j) => {
      const e = h(`<div class="wb-item${k === 'FR-electromenager' && it.rank === 6 ? ' hero' : ''}">
        <span class="wb-dl">${delta(it)}</span>${thumb(it.category, 44)}
        <span class="wb-t">${esc(it.title)}</span><span class="wb-p num">${price(it.price, it.market)}</span></div>`);
      itemsEl.append(e);
      const yr = yRank[it.id];
      const fromY = yr ? (yr - 1) * ROW : (PER + 0.4 + (els.filter((x) => x.fromBelow).length) * 0.9) * ROW;
      tl.set(e, { y: fromY }, 0);
      tl.set(e.querySelector('.wb-dl'), { autoAlpha: 0, scale: 0.6 }, 0);
      els.push({ e, to: j * ROW, fromBelow: !yr, moved: Math.abs(fromY - j * ROW) > 1 });
    });
    leavers.forEach((it, n) => {
      const e = h(`<div class="wb-item"><span class="wb-dl"></span>${thumb(it.category, 44)}
        <span class="wb-t">${esc(it.title)}</span><span class="wb-p num">${price(it.price, it.market)}</span></div>`);
      itemsEl.append(e);
      tl.set(e, { y: (it.rank - 1) * ROW }, 0);
      els.push({ e, to: (PER + 0.5 + n * 0.9) * ROW, leaver: true, moved: true });
    });
    blocks.push({ k, els, el: bl });
  });

  // ---- Caméra : mur incliné qui dérive, puis plongée sur la ligne héros.
  const cam = S.querySelector('.wall-cam');
  const heroBlock = blocks.find((b) => b.k === 'FR-electromenager');
  const col1 = 1, blockIdx = keys.indexOf('FR-electromenager') % 4;
  const hx = col1 * (COLW + GAP) + COLW / 2;
  const hy = blockIdx * (HEAD + PER * ROW + GAP) + HEAD + 5 * ROW + ROW / 2;
  gsap.set(wall, { left: 960 - hx, top: 540 - hy, transformOrigin: `${hx}px ${hy}px` });
  tl.set(wall, { rotationX: 50, rotationZ: -17, x: 420, y: 260, z: -380, scale: 1 }, 0);
  tl.to(wall, { x: 300, y: -40, z: -240, rotationZ: -14, duration: B(12), ease: 'none' }, 0);
  tl.to(wall, { x: 0, y: 0, z: 0, rotationX: 0, rotationZ: 0, scale: 2.35, duration: B(3.75), ease: 'expo.inOut' }, B(12));
  tl.set(cam, { filter: 'blur(14px)' }, 0);
  tl.to(cam, { filter: 'blur(0px)', duration: B(3), ease: 'power2.out' }, B(0.5));

  tl.to(S.querySelector('.s1-black'), { opacity: 0, duration: B(2.5), ease: 'power1.inOut' }, 0);
  tl.to(S.querySelector('.fog'), { opacity: 0, duration: B(2.5), ease: 'power2.inOut' }, B(12.5));
  tl.to(S.querySelector('.grid-bg'), { y: -300, duration: B(16), ease: 'none' }, 0);

  // ---- Réordonnancement réel, un bloc par croche (le héros à 10).
  const beats = [8, 8.5, 9, 9.5, 10.5, 11, 11.5, 12, 8.25, 9.25, 10.25, 11.25, 8.75, 9.75, 11.75, 12.25];
  blocks.forEach((b, i) => {
    const at = b.k === 'FR-electromenager' ? 10 : beats[i % beats.length];
    for (const it of b.els) {
      tl.to(it.e, { y: it.to, duration: B(1.1), ease: 'power3.inOut' }, B(at));
      tl.to(it.e.querySelector('.wb-dl'), { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)' }, B(at + 0.95));
    }
    if (b.els.some((x) => x.moved)) cue(at, 'shuffle', { pan: (keys.indexOf(b.k) / 4 | 0) / 3 * 1.4 - 0.7 });
  });
  const heroEl = heroBlock.els.find((x) => x.e.classList.contains('hero')).e;
  tl.to(heroEl, { backgroundColor: '#1A2540', boxShadow: 'inset 4px 0 0 #82A7F8', duration: 0.4 }, B(12.5));

  // ---- Texte
  const l1 = splitWords(S.querySelector('.s1-l1'));
  const l2 = splitWords(S.querySelector('.s1-l2'));
  const l3 = splitChars(S.querySelector('.s1-l3 .acc'));
  revealWords(l1, 3, { stagger: 0.08, dur: 0.9 });
  revealWords(l2, 5, { stagger: 0.08, dur: 0.9 });
  tl.set(l3, { yPercent: 110, opacity: 0 }, 0);
  tl.to(l3, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.025 }, B(8));
  // Les lettres de « bougent. » changent de place, comme les lignes.
  const jr = rng(3);
  for (let k = 0; k < 6; k++) {
    const offs = l3.map((_, i) => (Math.floor(jr() * 3) - 1) * 18 * (i % 2 ? 1 : -1));
    tl.to(l3, { y: (i) => offs[i], duration: B(0.25), ease: 'power2.out' }, B(9 + k * 0.5));
    tl.to(l3, { y: 0, duration: B(0.25), ease: 'power2.inOut' }, B(9.25 + k * 0.5));
  }
  hideWords([...l1, ...l2], 12, { stagger: 0.03 });
  tl.to(l3, { yPercent: -110, opacity: 0, duration: 0.35, ease: 'power3.in', stagger: 0.015 }, B(12.15));
  tl.to(S.querySelector('.s1-shade'), { opacity: 0, duration: B(2), ease: 'power2.inOut' }, B(12));

  cue(3, 'text', { pan: -0.4 }); cue(5, 'text', { pan: -0.4 }); cue(8, 'text_hit', { pan: -0.4 });
  cue(12, 'dive', { dur: B(3.75) });
  cue(15.5, 'whoosh', { dur: 0.5, from: 0, to: 0 });
}
