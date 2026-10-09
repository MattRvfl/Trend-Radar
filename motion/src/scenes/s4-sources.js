// Scène 4 (temps 40 → 56) : ce que Relevé lit chaque matin (une source par mesure), puis l'historique
// qui se construit jour après jour (6 vrais relevés : 3 → 8 oct.).
import { DATA } from '../data.js';
import { tl, B, cue, h, icon, splitWords, revealWords, sceneSpan, fr, typeText } from '../lib/core.js';
import { CAT_ICON, esc } from '../lib/ui.js';

const STORE_MARKET = (name) => (['Respire', 'Polène', 'Jimmy Fairly', 'Dagobear'].includes(name) ? 'FR' : 'US');

export function scene4(stage) {
  const trends = (m) => DATA.gtrends[m].slice().sort((a, b) => parseInt(b.traffic, 10) - parseInt(a.traffic, 10) || a.rank - b.rank).slice(0, 5);
  const traffic = (s) => `${s.replace(/(\d)(\d{3})\+/, '$1 $2+')} recherches`;
  const S = h(`<section class="scene s4">
    <div class="grid-bg"></div>
    <div class="s4-top"><span class="kicker">Chaque matin, Relevé lit</span><span class="s4-steps"><i></i><i></i><i></i></span></div>
    <div class="s4-strip">
      <div class="pane amazon">
        <div class="p-left"><div class="p-logo">${icon('amazon')}</div><div class="p-name">Amazon</div><div class="p-sub">Meilleures ventes, top&nbsp;30 de chaque catégorie</div></div>
        <div class="p-right">
          <div class="cat-grid">${DATA.categories.map((c) => `<div class="cat">${icon(CAT_ICON[c.key])}<span>${esc(c.label)}</span></div>`).join('')}</div>
          <div class="p-stat"><b class="num">17</b> catégories <span class="x">×</span> <b class="num">30</b> produits <span class="x">×</span> <span class="fl">${icon('flag-fr')}${icon('flag-us')}</span> <b>2</b> pays</div>
        </div>
      </div>
      <div class="pane shopify">
        <div class="p-left"><div class="p-logo">${icon('shopify')}</div><div class="p-name">Shopify</div><div class="p-sub">Meilleures ventes de 16 marques en direct</div></div>
        <div class="p-right">
          <div class="pills">${DATA.storeNames.map((n) => `<span class="pill">${icon(STORE_MARKET(n) === 'FR' ? 'flag-fr' : 'flag-us')}${esc(n)}</span>`).join('')}</div>
          <div class="p-note">${fr('Tri Shopify : ventes depuis toujours. Des produits phares, pas des nouveautés.')}</div>
        </div>
      </div>
      <div class="pane google">
        <div class="p-left"><div class="p-logo">${icon('site-pv-google')}</div><div class="p-name">Google Trends</div><div class="p-sub">Les recherches qui s'envolent, France et États-Unis</div></div>
        <div class="p-right">
          <div class="search">${icon('search')}<span class="q"></span></div>
          <div class="tr-cols">${['FR', 'US'].map((m) => `<div class="tr-col"><div class="tr-h">${icon(m === 'FR' ? 'flag-fr' : 'flag-us')}${m === 'FR' ? 'France' : 'États-Unis'}</div>
            ${trends(m).map((x, i) => `<div class="tr-row"><span class="num tr-r">${i + 1}</span><span class="tr-t">${esc(fr(`« ${x.title} »`))}</span><span class="num tr-v">${traffic(x.traffic)}</span></div>`).join('')}</div>`).join('')}</div>
        </div>
      </div>
    </div>
    <div class="s4-hist">
      <div class="display md s4-h"><div class="l1">${fr('Jour après jour,')}</div><div class="l2 acc">${fr("l'historique se construit.")}</div></div>
      <div class="days">${DATA.days.map((d, i) => {
        const dt = new Date(`${d}T12:00:00Z`);
        const wd = dt.toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
        const dm = dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
        return `<div class="day"><div class="d-top"><span class="d-w">${wd}.</span><span class="d-d num">${dm}</span></div>
          ${['amazon', 'shopify', 'google'].map((s) => `<div class="d-src"><span class="dot ${s}"></span><span class="d-bar"></span>${icon(d === DATA.days[DATA.days.length - 1] && s === 'amazon' ? 'site-i-partial' : 'site-i-ok')}</div>`).join('')}
          <div class="d-n num">${i === 0 ? 'premier relevé' : `relevé n° ${i + 1}`}</div></div>`;
      }).join('')}<div class="day ghost"><div class="d-top"><span class="d-w">demain</span><span class="d-d">matin</span></div><div class="d-next">${icon('clock')}<span>prochain relevé</span></div></div></div>
      <div class="cov"><span class="cov-l">7 derniers jours</span><span class="cov-g">${Array.from({ length: 7 }, (_, i) => `<i class="${i === 0 ? '' : 'on'}"></i>`).join('')}</span><span class="cov-t num">6 jours relevés sur 7</span></div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 39.6, 56.1);

  const strip = S.querySelector('.s4-strip');
  const steps = [...S.querySelectorAll('.s4-steps i')];
  tl.set(S, { opacity: 0 }, 0);
  tl.to(S, { opacity: 1, duration: B(0.4) }, B(39.6));
  const top = S.querySelector('.s4-top');
  tl.set(top, { opacity: 0, y: -20 }, 0);
  tl.to(top, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(40));
  tl.set(strip, { x: 0 }, 0);
  steps.forEach((st, i) => {
    tl.set(st, { backgroundColor: '#2B2D32', width: 18 }, 0);
    tl.to(st, { backgroundColor: '#82A7F8', width: 44, duration: 0.35, ease: 'power3.out' }, B(40 + i * 4));
    if (i < 2) tl.to(st, { backgroundColor: '#686B74', width: 18, duration: 0.3 }, B(44 + i * 4) - 0.1);
  });
  // Passages d'une source à l'autre : panoramique rapide, posé sur la mesure.
  [1, 2].forEach((k) => {
    tl.to(strip, { x: -1920 * k, duration: B(0.75), ease: 'power4.inOut' }, B(40 + k * 4 - 0.6));
    cue(40 + k * 4 - 0.6, 'whoosh', { dur: B(0.75), from: 0.7, to: -0.7 });
  });

  const panes = [...S.querySelectorAll('.pane')];
  panes.forEach((p, i) => {
    const at = 40 + i * 4;
    const lg = p.querySelector('.p-logo'), nm = p.querySelector('.p-name'), sb = p.querySelector('.p-sub');
    tl.set(lg, { scale: 0.4, opacity: 0, rotation: -12 }, 0);
    tl.to(lg, { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.8)' }, B(at));
    const nw = splitWords(nm);
    revealWords(nw, at + 0.25, { stagger: 0.06, dur: 0.7 });
    tl.set(sb, { opacity: 0, y: 20 }, 0);
    tl.to(sb, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, B(at + 0.75));
    cue(at, 'logo_pop', { pan: -0.5 });
  });

  // Amazon : 17 catégories en cascade, une par double-croche.
  const cats = [...S.querySelectorAll('.cat')];
  tl.set(cats, { opacity: 0, scale: 0.6, y: 20 }, 0);
  cats.forEach((c, i) => {
    tl.to(c, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, B(40.5 + i * 0.125));
    if (i % 2 === 0) cue(40.5 + i * 0.125, 'tick_hi', { pan: 0.2 + (i % 6) * 0.1, n: i });
  });
  const stat = S.querySelector('.amazon .p-stat');
  tl.set(stat, { opacity: 0, y: 20 }, 0);
  tl.to(stat, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(42.75));
  cue(42.75, 'pop', { pan: 0.3 });

  // Shopify : 16 marques.
  const pills = [...S.querySelectorAll('.pill')];
  tl.set(pills, { opacity: 0, y: 24, scale: 0.8 }, 0);
  pills.forEach((pl, i) => {
    tl.to(pl, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, B(44.5 + i * 0.125));
    if (i % 2 === 0) cue(44.5 + i * 0.125, 'tick_hi', { pan: 0.1 + (i % 5) * 0.12, n: i });
  });
  const note = S.querySelector('.shopify .p-note');
  tl.set(note, { opacity: 0 }, 0);
  tl.to(note, { opacity: 1, duration: 0.5 }, B(46.75));

  // Google : on tape la recherche la plus demandée en France, puis les deux classements tombent.
  const q = S.querySelector('.search .q');
  typeText(q, 'robert ménard', 48.6, 1.2);
  cue(48.6, 'typing', { dur: B(1.2), n: 13 });
  const srch = S.querySelector('.search');
  tl.set(srch, { opacity: 0, y: 20 }, 0);
  tl.to(srch, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(48.25));
  const trs = [...S.querySelectorAll('.tr-col')];
  trs.forEach((col, c) => {
    const rows = [col.querySelector('.tr-h'), ...col.querySelectorAll('.tr-row')];
    tl.set(rows, { opacity: 0, x: -24 }, 0);
    tl.to(rows, { opacity: 1, x: 0, duration: 0.45, ease: 'expo.out', stagger: B(0.25) }, B(50 + c * 0.125));
  });
  cue(50, 'list_in', { n: 6 });

  // Historique : la grille de jours monte, chaque relevé tombe sur une croche.
  const hist = S.querySelector('.s4-hist');
  tl.set(hist, { yPercent: 100 }, 0);
  tl.to(hist, { yPercent: 0, duration: B(0.9), ease: 'power4.inOut' }, B(51.4));
  tl.to([strip, top], { yPercent: -60, opacity: 0, duration: B(0.9), ease: 'power4.inOut' }, B(51.4));
  cue(51.4, 'whoosh', { dur: B(0.9), from: 0, to: 0, up: true });
  const hw = [...splitWords(S.querySelector('.s4-h .l1')), ...splitWords(S.querySelector('.s4-h .l2'))];
  revealWords(hw, 52, { stagger: 0.05, dur: 0.7 });
  const days = [...S.querySelectorAll('.day:not(.ghost)')];
  days.forEach((d, i) => {
    const at = 52.5 + i * 0.5;
    tl.set(d, { opacity: 0, y: -60, rotationX: 50 }, 0);
    tl.to(d, { opacity: 1, y: 0, rotationX: 0, duration: 0.55, ease: 'back.out(1.6)' }, B(at));
    const bars = [...d.querySelectorAll('.d-bar')];
    tl.set(bars, { scaleX: 0 }, 0);
    tl.to(bars, { scaleX: 1, duration: 0.4, ease: 'expo.out', stagger: 0.05 }, B(at + 0.1));
    cue(at, 'snap', { n: i, pan: -0.7 + i * 0.28 });
  });
  const ghost = S.querySelector('.day.ghost');
  tl.set(ghost, { opacity: 0 }, 0);
  tl.to(ghost, { opacity: 1, duration: 0.5 }, B(55.25));
  const cov = S.querySelector('.cov'), cg = [...S.querySelectorAll('.cov-g i')];
  tl.set(cov, { opacity: 0 }, 0);
  tl.to(cov, { opacity: 1, duration: 0.4 }, B(53));
  tl.set(cg.filter((x) => x.classList.contains('on')), { backgroundColor: 'transparent' }, 0);
  cg.filter((x) => x.classList.contains('on')).forEach((g, i) => tl.to(g, { backgroundColor: '#A8A8B0', duration: 0.12 }, B(52.6 + i * 0.5)));
  tl.to(hist, { scale: 1.08, opacity: 0, duration: B(0.6), ease: 'power3.in' }, B(55.5));
}
