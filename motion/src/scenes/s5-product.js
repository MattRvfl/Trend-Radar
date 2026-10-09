// Scènes 5 et 6 (temps 56 → 96) : le vrai produit, dans un navigateur.
// 5 : plongée dans la courbe de rang du panneau produit (Philips OneBlade 360, n° 25 → n° 2), puis recul.
// 6 : visite guidée, un clic par mesure (Aujourd'hui, hausses, Classements 7 j, FR → US, Boutiques, Buzz,
//     alertes push sur téléphone, article du lundi, bouton de thème).
import { DATA } from '../data.js';
import { tl, B, cue, h, icon, sceneSpan, fr, enter } from '../lib/core.js';
import { header, viewToday, viewRank, viewStores, viewBuzz, panel } from '../lib/site.js';
import { delta } from '../lib/ui.js';

export const cams = {};      // positions de caméra nommées (calculées après mise en page)

export function scene5(stage) {
  const S = h(`<section class="scene s5">
    <div class="s5-bg"></div>
    <div class="cam"><div class="browser">
      <div class="chrome"><i class="tl" style="background:#FF5F57"></i><i class="tl" style="background:#FEBC2E"></i><i class="tl" style="background:#28C840"></i>
        <div class="url">${icon('lock')}mattrvfl.github.io/Trend-Radar</div></div>
      <div class="site">${header()}<div class="main">${viewToday()}${viewRank()}${viewStores()}${viewBuzz()}</div>
        <div class="overlay"></div>${panel()}</div>
    </div>
    <div class="cursor">${icon('mouse-pointer-2')}<i class="clk"></i></div></div>
    <div class="s5-shade"></div>
    <div class="s5-title"><div class="kicker">${fr('Rang jour par jour · Hygiène et Santé · France')}</div><div class="s5-name">Philips OneBlade 360</div></div>
    <div class="s5-kpi"><span class="num big">n° 25</span><span class="arr">→</span><span class="num big acc">n° 2</span>${delta({ change: 23 }, 2.6)}<span class="in">${fr('en 6 relevés')}</span></div>
    <div class="caps"></div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 55.6, 96.5);
  tl.set(S, { opacity: 0 }, 0);
  tl.to(S, { opacity: 1, duration: B(0.4), ease: 'power1.out' }, B(55.6));

  const cam = S.querySelector('.cam');
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };
  const focus = (cx, cy, s, sx = 960, sy = 540) => ({ scale: s, x: sx - s * cx, y: sy - s * cy });
  // Mise en page à l'échelle 1 : on mesure avant toute transformation.
  const views = Object.fromEntries(['today', 'rank', 'stores', 'buzz'].map((k) => [k, S.querySelector(`.v-${k}`)]));
  S.style.display = 'block';
  views.rank.style.visibility = 'visible';
  const chartR = rect(S.querySelector('.rchart'));
  cams.chart = focus(chartR.cx, chartR.cy, 3.25, 960, 585);
  cams.full = { scale: 1, x: 0, y: 0 };
  const tabs = Object.fromEntries([...S.querySelectorAll('.tab')].map((t) => [t.dataset.tab, rect(t)]));
  const closeR = rect(S.querySelector('.ph svg'));
  const mkR = Object.fromEntries([...S.querySelectorAll('.seg.mk b')].map((b) => [b.dataset.m, rect(b)]));
  const perR = [...S.querySelectorAll('.seg.per b')].map(rect);
  const themeR = rect(S.querySelector('.theme-btn'));
  const browserR = rect(S.querySelector('.browser'));
  const navX = rect(S.querySelector('.sh-tabs')).x;
  views.rank.style.visibility = '';
  S.style.display = '';
  Object.assign(cams, { tabs, closeR, mkR, perR, themeR, browserR, focus, rect });

  // ---- Onglet actif + soulignement
  const ul = S.querySelector('.tab-ul');
  const tabEls = Object.fromEntries([...S.querySelectorAll('.tab')].map((t) => [t.dataset.tab, t]));
  const setTab = (k, beat, instant = false) => {
    const r = tabs[k];
    tl.to(ul, { x: r.x - navX, width: r.w, duration: instant ? 0 : 0.35, ease: 'power3.inOut' }, B(beat));
    Object.entries(tabEls).forEach(([kk, el]) => tl.to(el, { color: kk === k ? '#EDEDEF' : '#A8A8B0', duration: instant ? 0 : 0.2 }, B(beat)));
  };
  const showView = (k, beat) => {
    Object.entries(views).forEach(([kk, v]) => {
      if (kk === k) { tl.set(v, { visibility: 'visible' }, B(beat)); tl.fromTo(v, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' }, B(beat)); }
      else tl.set(v, { visibility: 'hidden' }, B(beat));
    });
  };
  setTab('rank', 0, true);
  tl.set(views.rank, { visibility: 'visible' }, 0);
  const segP = S.querySelector('.seg.mk .seg-p');
  tl.set(segP, { x: 0, width: 44 }, 0);
  const perP = S.querySelector('.seg.per .seg-p');
  tl.set(perP, { x: 0 }, 0);
  const bodies = Object.fromEntries(['sante', 'jday', 'j7', 'j7us'].map((k) => [k, S.querySelector(`.b-${k}`)]));
  tl.set(bodies.sante, { display: 'block' }, 0);
  const selV = Object.fromEntries([...S.querySelectorAll('.sel-v')].map((e) => [e.dataset.v, e]));
  tl.set(selV.jouets, { opacity: 0 }, 0);

  // ---- Curseur (coordonnées de la caméra = coordonnées de la scène à l'échelle 1)
  const cursor = S.querySelector('.cursor'), clk = cursor.querySelector('.clk');
  tl.set(cursor, { x: 1500, y: 1000, opacity: 0 }, 0);
  const moveTo = (r, beat, dur = 0.6, dx = 0, dy = 0) => tl.to(cursor, { x: r.cx + dx, y: r.cy + dy, opacity: 1, duration: B(dur), ease: 'power3.inOut' }, B(beat));
  const click = (beat, pan = 0) => {
    tl.to(cursor, { scale: 0.82, duration: 0.07, ease: 'power2.out' }, B(beat));
    tl.to(cursor, { scale: 1, duration: 0.18, ease: 'power2.out' }, B(beat) + 0.07);
    tl.fromTo(clk, { scale: 0.2, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.45, ease: 'expo.out' }, B(beat));
    cue(beat, 'click', { pan });
  };
  Object.assign(cams, { moveTo, click, setTab, showView, cursor, views, bodies, segP, perP, selV });

  // ---- Caméra
  tl.set(cam, { ...cams.chart, transformOrigin: '0 0' }, 0);
  tl.to(cam, { scale: cams.chart.scale * 0.93, x: 960 - cams.chart.scale * 0.93 * chartR.cx, y: 585 - cams.chart.scale * 0.93 * chartR.cy, duration: B(4.5), ease: 'none' }, B(56));
  tl.to(cam, { ...cams.full, duration: B(1.6), ease: 'power4.inOut' }, B(60.5));
  cue(60.5, 'zoom_out', { dur: B(1.6) });

  // ---- Panneau : seules la courbe et sa bande restent visibles pendant la plongée.
  const pnl = S.querySelector('.panel');
  const pOther = ['.ph', '.pid', '.pbtn', '.kpis', '.pch', '.plg'].map((s) => pnl.querySelector(s));
  tl.set(pOther, { opacity: 0 }, 0);
  tl.to(pOther, { opacity: 1, duration: 0.6, stagger: 0.05 }, B(61));
  const ovl = S.querySelector('.overlay');
  tl.set(ovl, { opacity: 1, backgroundColor: 'rgba(0,0,0,0.88)' }, 0);
  tl.to(ovl, { backgroundColor: 'rgba(0,0,0,0.6)', duration: B(1.2) }, B(60.75));

  // ---- Courbe : grille, bande, puis un point par croche (vraies valeurs du 3 au 8 oct.).
  const svg = S.querySelector('.rchart');
  const grid = [...svg.querySelectorAll('.cg')], labels = [...svg.querySelectorAll('.cl, .cx, .cbl')];
  tl.set(grid, { drawSVG: '0%' }, 0);
  tl.to(grid, { drawSVG: '100%', duration: 0.6, ease: 'expo.out', stagger: 0.06 }, B(56));
  tl.set(labels, { opacity: 0 }, 0);
  tl.to(labels, { opacity: 1, duration: 0.4, stagger: 0.03 }, B(56.25));
  const band = svg.querySelector('.cb');
  tl.set(band, { scaleX: 0, transformOrigin: '0% 50%' }, 0);
  tl.to(band, { scaleX: 1, duration: 0.8, ease: 'expo.out' }, B(56.5));
  const line = svg.querySelector('.cline');
  const pts = [...svg.querySelectorAll('.cpt')], anns = [...svg.querySelectorAll('.cann')];
  const P = pts.map((c) => [+c.getAttribute('cx'), +c.getAttribute('cy')]);
  const segL = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1]));
  const tot = segL.reduce((a, b) => a + b, 0);
  let acc = 0;
  tl.set(line, { drawSVG: '0% 0%' }, 0);
  tl.set(pts, { scale: 0, transformOrigin: '50% 50%' }, 0);
  tl.set(anns, { opacity: 0, y: 4 }, 0);
  const ranks = DATA.days.map((d) => DATA.curve.ranks[d]);
  pts.forEach((p, i) => {
    const at = 57 + i * 0.5;
    tl.to(p, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, B(at));
    if (i < pts.length - 1) tl.to(anns[i], { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, B(at));
    if (i > 0) {
      acc += segL[i - 1];
      tl.to(line, { drawSVG: `0% ${(acc / tot * 100).toFixed(2)}%`, duration: B(0.5), ease: 'power2.inOut' }, B(at - 0.5));
    }
    cue(at, 'point', { rank: ranks[i], i });
  });
  tl.to(anns, { opacity: 0, duration: 0.3 }, B(60.4));
  const last = svg.querySelector('.clast');
  tl.set(last, { opacity: 0, x: -6 }, 0);
  tl.to(last, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, B(59.75));
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('class', 'cring'); ring.setAttribute('cx', P[5][0]); ring.setAttribute('cy', P[5][1]); ring.setAttribute('r', 4);
  svg.append(ring);
  tl.set(ring, { opacity: 0, scale: 1, transformOrigin: '50% 50%' }, 0);
  tl.fromTo(ring, { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 5, duration: 1, ease: 'expo.out' }, B(59.5));

  // ---- Titres de la plongée
  const shade = S.querySelector('.s5-shade');
  const title = S.querySelector('.s5-title'), kpi = S.querySelector('.s5-kpi');
  tl.set([title, kpi, shade], { opacity: 0 }, 0);
  tl.to(shade, { opacity: 1, duration: 0.4 }, B(56));
  enter(title, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, B(56.25));
  enter(kpi, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, B(60));
  tl.to([title, kpi, shade], { opacity: 0, duration: 0.35, ease: 'power2.in' }, B(60.75));
  cue(60, 'pop_up', { pan: -0.4 });

  // ---- Fermeture du panneau, puis la visite commence (scène 6, même navigateur).
  moveTo(closeR, 62.6, 0.8);
  click(63.5, 0.6);
  tl.to(pnl, { xPercent: 105, duration: B(0.5), ease: 'power3.in' }, B(63.5));
  tl.to(ovl, { opacity: 0, duration: B(0.5) }, B(63.5));

  return S;
}

// ======================= Scène 6 : visite guidée (temps 64 → 96) =======================
export function scene6(S) {
  const { moveTo, click, setTab, showView, views, bodies, segP, perP, selV, focus, rect, tabs, mkR, perR, themeR } = cams;
  const cam = S.querySelector('.cam'), browser = S.querySelector('.browser');

  // Mesures à l'échelle 1 (vues rendues visibles le temps de mesurer).
  S.style.display = 'block';
  const measure = (view, fn) => { view.style.visibility = 'visible'; const r = fn(); view.style.visibility = ''; return r; };
  const mainR = rect(S.querySelector('.main'));
  const T = measure(views.today, () => ({ cards: rect(views.today.querySelector('.cards')), mh2: rect(views.today.querySelector('.mh2')),
    ups: rect(views.today.querySelector('.list.ups')), aside: rect(views.today.querySelector('.taside')) }));
  const R = measure(views.rank, () => { bodies.jday.style.display = 'block'; const r = { list: rect(bodies.jday.querySelector('.list')) }; bodies.jday.style.display = ''; return r; });
  const ST = measure(views.stores, () => ({ grid: rect(views.stores.querySelector('.stores')) }));
  const BZ = measure(views.buzz, () => ({ cols: rect(views.buzz.querySelector('.bzcols')) }));
  S.style.display = '';
  const scrollY = Math.round(T.mh2.y - mainR.y - 18);

  // ---- Légendes (une par mesure)
  const caps = S.querySelector('.caps');
  const CAPS = [
    [64.25, 'sparkles', 'Les entrées du jour', ''],
    [68.25, 'trending-up', 'Les plus fortes hausses', 'depuis hier'],
    [72.25, 'list-ordered', 'Jour, 7 j, 30 j, mois, année', ''],
    [76.25, 'globe', 'France ⇄ États-Unis', ''],
    [80.25, 'store', 'Les best-sellers des marques', 'Shopify'],
    [84.25, 'search', 'Ce que tout le monde cherche', 'Google Trends'],
    [88.25, 'bell-ring', 'Une ruée ? Vous êtes prévenu.', ''],
    [92.25, 'newspaper', "L'article du lundi", 'par e-mail'],
  ];
  CAPS.forEach(([at, ic, txt, sub], i) => {
    const c = h(`<div class="cap"><span class="ck">${icon(ic)}</span><b>${fr(txt)}</b>${sub ? `<span class="cs">${fr(sub)}</span>` : ''}</div>`);
    caps.append(c);
    tl.set(c, { opacity: 0, y: 30 }, 0);
    tl.to(c, { opacity: 1, y: 0, duration: 0.55, ease: 'expo.out' }, B(at));
    const out = i < CAPS.length - 1 ? CAPS[i + 1][0] - 0.45 : 94.6;
    tl.to(c, { opacity: 0, y: -16, duration: 0.25, ease: 'power2.in' }, B(out));
  });

  // ---- Mesure 17 : Aujourd'hui
  moveTo(tabs.today, 63.75, 0.25);
  click(64, -0.3);
  setTab('today', 64);
  showView('today', 64);
  const camTo = (f, beat, dur, e = 'power3.inOut') => tl.to(cam, { ...f, duration: B(dur), ease: e }, B(beat));
  camTo(focus(T.cards.cx + 120, T.cards.cy + 40, 1.14), 64.2, 3.6, 'power2.inOut');
  const cardEls = [...views.today.querySelectorAll('.card')];
  cardEls.forEach((c, i) => {
    enter(c, { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'expo.out' }, B(64.5 + i * 0.5));
    const bd = c.querySelector('.c-delta');
    enter(bd, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.5)' }, B(64.75 + i * 0.5));
    cue(64.75 + i * 0.5, 'pop_new', { pan: -0.5 + i * 0.3, soft: true });
  });
  const bz = [...views.today.querySelectorAll('.bz')];
  enter(bz, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, B(65));

  // ---- Mesure 18 : défilement jusqu'aux plus fortes hausses
  const scroller = views.today.querySelector('.scroller');
  tl.to(scroller, { y: -scrollY, duration: B(1), ease: 'power3.inOut' }, B(67.75));
  camTo(focus(T.ups.cx, T.ups.cy - scrollY + 10, 1.3), 67.75, 1.2);
  cue(67.75, 'whoosh', { dur: B(1), from: 0, to: 0, up: true, soft: true });
  const ups = [...views.today.querySelectorAll('.list.ups .r')];
  ups.forEach((r, i) => {
    const at = 68.5 + i * 0.25;
    enter(r, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, ease: 'expo.out' }, B(at));
    enter(r.querySelector('.c-delta'), { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, B(at + 0.2));
    const pl = [...r.querySelectorAll('.sp-l')];
    tl.set(pl, { drawSVG: '0%' }, 0);
    tl.to(pl, { drawSVG: '100%', duration: 0.5, ease: 'power2.out' }, B(at + 0.25));
    enter(r.querySelector('.sp-d'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, B(at + 0.6));
    cue(at + 0.2, 'pop_up', { pan: -0.2, soft: true, n: i });
  });
  camTo(focus(T.ups.cx + 30, T.ups.cy - scrollY + 10, 1.36), 69, 2.6, 'power1.inOut');

  // ---- Mesure 19 : Classements, Jeux et Jouets, puis 7 jours
  moveTo(tabs.rank, 70.8, 1.1);
  camTo(cams.full, 71.2, 0.8);
  click(72, -0.1);
  setTab('rank', 72);
  showView('rank', 72);
  tl.set(bodies.sante, { display: 'none' }, B(72));
  tl.set(bodies.jday, { display: 'block' }, B(72));
  tl.set(selV.sante, { opacity: 0 }, B(72));
  tl.set(selV.jouets, { opacity: 1 }, B(72));
  const jday = [...bodies.jday.querySelectorAll('.r')];
  enter(jday, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'expo.out' }, B(72.1));
  camTo(focus(R.list.cx - 60, R.list.cy - 40, 1.12), 72.2, 1.4);
  moveTo(perR[1], 73.1, 0.8);
  click(74, 0.1);
  tl.to(perP, { x: perR[1].x - perR[0].x, duration: 0.3, ease: 'power3.out' }, B(74));
  tl.set(bodies.jday, { display: 'none' }, B(74.05));
  tl.set(bodies.j7, { display: 'block' }, B(74.05));
  const j7 = [...bodies.j7.querySelectorAll('.r')];
  enter(j7, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.05, ease: 'expo.out' }, B(74.05));
  const bars7 = [...bodies.j7.querySelectorAll('.bar i')];
  enter(bars7, { scaleX: 0 }, { scaleX: 1, duration: 0.8, stagger: 0.05, ease: 'expo.out' }, B(74.3));
  cue(74.3, 'bars', { n: bars7.length });

  // ---- Mesure 20 : FR → US
  camTo(focus(mkR.US.cx - 40, mkR.US.cy + 60, 1.7, 1150, 380), 75.2, 0.8);
  moveTo(mkR.US, 75.2, 0.75);
  click(76, 0.5);
  tl.to(segP, { x: mkR.US.x - mkR.FR.x, duration: 0.3, ease: 'power3.out' }, B(76));
  tl.set(bodies.j7, { display: 'none' }, B(76.1));
  tl.set(bodies.j7us, { display: 'block' }, B(76.1));
  const j7us = [...bodies.j7us.querySelectorAll('.r')];
  enter(j7us, { opacity: 0, rotationX: -80, transformOrigin: '50% 0%' }, { opacity: 1, rotationX: 0, duration: 0.55, stagger: 0.06, ease: 'back.out(1.4)' }, B(76.1));
  const barsUS = [...bodies.j7us.querySelectorAll('.bar i')];
  enter(barsUS, { scaleX: 0 }, { scaleX: 1, duration: 0.8, stagger: 0.05, ease: 'expo.out' }, B(76.4));
  camTo(focus(R.list.cx - 40, R.list.cy - 30, 1.14), 76.3, 1.2);
  cue(76.1, 'flip', { n: j7us.length });

  // ---- Mesure 21 : Boutiques
  moveTo(tabs.stores, 79.0, 0.95);
  camTo(cams.full, 79.2, 0.75);
  click(80, -0.1);
  setTab('stores', 80);
  showView('stores', 80);
  const stores = [...views.stores.querySelectorAll('.store')];
  stores.forEach((st, i) => {
    enter(st, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, B(80.25 + i * 0.25));
    enter(st.querySelectorAll('.sr'), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power3.out' }, B(80.5 + i * 0.25));
    cue(80.25 + i * 0.25, 'card', { pan: -0.6 + i * 0.6, soft: true });
  });
  camTo(focus(ST.grid.cx, ST.grid.cy - 30, 1.08), 80.3, 3.2, 'power1.inOut');

  // ---- Mesure 22 : Buzz
  moveTo(tabs.buzz, 83.0, 0.95);
  camTo(cams.full, 83.2, 0.75);
  click(84, 0);
  setTab('buzz', 84);
  showView('buzz', 84);
  const bzr = [...views.buzz.querySelectorAll('.bzr')];
  enter(bzr, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'expo.out' }, B(84.2));
  camTo(focus(BZ.cols.cx, BZ.cols.cy - 10, 1.12), 84.3, 3.2, 'power1.inOut');
  cue(84.2, 'list_in', { n: 6 });

  // ---- Mesure 23 : téléphone, alertes « Ruée » réelles
  const ph = h(`<div class="phone"><div class="ph-scr">
    <div class="ph-isl"></div><div class="ph-date">jeudi 8 octobre</div><div class="ph-time num">7:24</div>
    ${DATA.rushes.filter((r) => r.market === 'FR' && r.brand !== 'Amazon').slice(0, 2).reverse().map((r, i) => `<div class="notif n${i}">
      <div class="n-ic">${icon('site-app-icon')}</div><div class="n-b"><div class="n-h"><b>Relevé</b><span>${i ? 'maintenant' : 'il y a 1 min'}</span></div>
      <div class="n-t">${esc2(r.title)}</div><div class="n-x">${esc2(r.body)}</div></div></div>`).join('')}
    <div class="ph-bar"></div></div></div>`);
  S.append(ph);
  tl.set(ph, { x: 700, rotationY: -28, opacity: 0, transformPerspective: 1600 }, 0);
  tl.to(ph, { x: 0, rotationY: -6, opacity: 1, duration: B(1.1), ease: 'expo.out' }, B(87.6));
  tl.to(cam, { scale: 0.8, x: 700 - 0.8 * 960, y: 540 - 0.8 * 540, duration: B(1.2), ease: 'power3.inOut' }, B(87.5));
  tl.to(browser, { filter: 'brightness(0.42) saturate(0.8)', duration: B(1.2) }, B(87.5));
  tl.to(S.querySelector('.cursor'), { opacity: 0, duration: 0.3 }, B(87.5));
  cue(87.6, 'whoosh', { dur: B(1.1), from: 0.9, to: 0.4 });
  const notifs = [...ph.querySelectorAll('.notif')];
  // Les notifications arrivent par le haut ; la plus récente pousse l'autre vers le bas.
  tl.set(notifs, { opacity: 0, y: -60, scale: 0.9 }, 0);
  tl.to(notifs[0], { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }, B(88.75));
  cue(88.75, 'notif', { pan: 0.5 });
  tl.to(notifs[0], { y: 150, duration: 0.5, ease: 'power3.inOut' }, B(90));
  tl.to(notifs[1], { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }, B(90));
  cue(90, 'notif', { pan: 0.5, second: true });

  // ---- Mesure 24 : l'article du lundi, puis bouton de thème
  const a = DATA.article;
  const mail = h(`<div class="mail">
    <div class="m-top">${icon('mail')}<span>Boîte de réception</span></div>
    <div class="m-row"><div class="m-av">${icon('site-app-icon')}</div><div class="m-c"><div class="m-f"><b>Relevé</b><span>lun. 7:30</span></div>
      <div class="m-s">${esc2(fr(`Relevé · ${a.title}`))}</div><div class="m-p">${esc2(fr(a.summary))}</div></div></div>
    <div class="m-art"><div class="kicker">Article de la semaine</div><div class="m-h">${esc2(a.title)}</div>
      <div class="m-chips">${[...new Set(a.sections)].map((s) => `<span>${esc2(s)}</span>`).join('')}</div></div></div>`);
  S.append(mail);
  tl.set(mail, { opacity: 0, y: 120, rotationX: 18, transformPerspective: 1400 }, 0);
  tl.to(mail, { opacity: 1, y: 0, rotationX: 0, duration: B(1), ease: 'expo.out' }, B(91.8));
  tl.to(ph, { x: 60, rotationY: -12, duration: B(1.2), ease: 'power2.inOut' }, B(91.8));
  cue(91.8, 'swoosh_up', { dur: B(1) });
  const chips = [...mail.querySelectorAll('.m-chips span')];
  enter(chips, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power3.out' }, B(92.75));
  // Retour au navigateur, clic sur le bouton de thème : tout passe en clair.
  tl.to([mail], { opacity: 0, y: -40, duration: B(0.6), ease: 'power3.in' }, B(93.6));
  tl.to(ph, { x: 700, opacity: 0, rotationY: -30, duration: B(0.7), ease: 'power3.in' }, B(93.6));
  tl.to(cam, { ...cams.full, duration: B(0.9), ease: 'power3.inOut' }, B(93.8));
  tl.to(browser, { filter: 'brightness(1) saturate(1)', duration: B(0.9) }, B(93.8));
  tl.set(S.querySelector('.cursor'), { x: themeR.cx - 220, y: themeR.cy + 160 }, B(93.9));
  tl.to(S.querySelector('.cursor'), { opacity: 1, duration: 0.2 }, B(94));
  moveTo(themeR, 94.1, 0.85);
  click(95, 0.4);
  cue(95, 'theme_switch');
}

function esc2(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
