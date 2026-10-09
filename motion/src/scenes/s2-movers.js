// Scène 2 (temps 16 → 32) : « Qui monte ? Qui chute ? Qui débarque ? » sur une règle de rangs n° 1 → n° 30,
// puis « Les classements sont publics. / L'historique, lui, disparaît. »
import { DATA } from '../data.js';
import { tl, B, cue, h, icon, splitWords, splitChars, revealWords, hideWords, sceneSpan, fr, counter, everyFrame } from '../lib/core.js';
import { delta, thumb, esc, price } from '../lib/ui.js';

const X_LINE = 1190, Y1 = 150, Y30 = 930;
const yOf = (r) => Y1 + (r - 1) * (Y30 - Y1) / 29;

export function scene2(stage) {
  const up = DATA.ups.find((i) => i.title.startsWith('Bosch PIX631HC1E'));
  const down = DATA.downs.find((i) => i.title.startsWith('Pokémon : Mini-boîte'));
  const nw = DATA.news.find((i) => i.title.startsWith("Levi's"));
  const acts = [
    { it: up, q: 'Qui monte ?', from: up.rank + up.change, to: up.rank, at: 16, kind: 'up' },
    { it: down, q: 'Qui chute ?', from: down.rank + down.change, to: down.rank, at: 20, kind: 'down' },
    { it: nw, q: 'Qui débarque ?', from: null, to: nw.rank, at: 24, kind: 'new' },
  ];

  const ticks = Array.from({ length: 30 }, (_, i) => {
    const r = i + 1, y = yOf(r), major = r === 1 || r % 10 === 0;
    return `<line x1="${X_LINE - (major ? 22 : 12)}" x2="${X_LINE}" y1="${y}" y2="${y}" class="tk${major ? ' mj' : ''}"/>`
      + (major ? `<text x="${X_LINE - 34}" y="${y + 7}" class="tl">n° ${r}</text>` : '');
  }).join('');

  const S = h(`<section class="scene s2">
    <div class="grid-bg"></div>
    <svg class="s2-ruler" viewBox="0 0 1920 1080" width="1920" height="1080">
      <rect class="band" x="${X_LINE - 2}" y="${yOf(1) - 14}" width="670" height="${yOf(10) - yOf(1) + 28}" rx="8"/>
      <text class="band-l" x="${X_LINE + 656}" y="${yOf(10) + 4}" text-anchor="end">top 10</text>
      <line class="axis" x1="${X_LINE}" x2="${X_LINE}" y1="${Y1 - 20}" y2="${Y30 + 20}"/>
      <line class="hors" x1="${X_LINE - 22}" x2="${X_LINE + 670}" y1="${Y30 + 34}" y2="${Y30 + 34}"/>
      <text class="tl" x="${X_LINE - 34}" y="${Y30 + 60}">hors</text>
      ${ticks}
      ${acts.map((a, i) => `<line class="trail ${a.kind}" data-i="${i}" x1="${X_LINE}" x2="${X_LINE}" y1="0" y2="0"/>`).join('')}
    </svg>
    <div class="s2-left">
      ${acts.map((a, i) => `<div class="display s2-q" data-i="${i}">${fr(a.q)}</div>`).join('')}
      <div class="s2-rank"><span class="s2-no">n°</span><span class="s2-n num">24</span><span class="s2-badges">${acts.map((a, i) => delta(a.it, 3.4, `bd${i}`)).join('')}</span></div>
      <div class="s2-meta">${acts.map((a, i) => `<span data-i="${i}">${esc(a.it.cat)} · France</span>`).join('')}</div>
    </div>
    ${acts.map((a, i) => `<div class="s2-mark ${a.kind}" data-i="${i}"><span class="ring"></span></div>
      <div class="s2-card" data-i="${i}">${thumb(a.it.category, 76)}
        <div class="c-prod"><div class="c-t">${esc(a.it.title)}</div><div class="c-s">${esc(a.it.cat)} · ${price(a.it.price, 'FR')}</div></div>
        <div class="c-d">${delta(a.it, 1.7)}</div></div>`).join('')}
    <div class="s2-pub">
      <div class="display md s2-h1">${fr('Les classements sont publics.')}</div>
      <div class="display md s2-h2"><span class="s2-h2a">${fr("L'historique, lui,")}</span> <span class="acc s2-gone">disparaît.</span></div>
      <div class="s2-cards"></div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 16, 32);

  const q = (sel, i) => S.querySelector(`${sel}[data-i="${i}"]`);
  const nEl = S.querySelector('.s2-n');

  // Règle : apparition des graduations.
  const tks = [...S.querySelectorAll('.s2-ruler .tk, .s2-ruler .tl')];
  tl.set(tks, { opacity: 0 }, 0);
  tl.to(tks, { opacity: 1, duration: 0.25, stagger: { each: 0.012, from: 'start' } }, B(16));
  tl.set(S.querySelector('.axis'), { drawSVG: '0%' }, 0);
  tl.to(S.querySelector('.axis'), { drawSVG: '100%', duration: B(1), ease: 'expo.out' }, B(16));
  tl.set([S.querySelector('.band'), S.querySelector('.band-l'), S.querySelector('.hors')], { opacity: 0 }, 0);
  tl.to([S.querySelector('.band'), S.querySelector('.band-l'), S.querySelector('.hors')], { opacity: 1, duration: 0.5 }, B(16.5));
  tl.set(S.querySelector('.s2-rank'), { opacity: 0, y: 30 }, 0);
  tl.to(S.querySelector('.s2-rank'), { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(16.6));

  acts.forEach((a, i) => {
    const qEl = q('.s2-q', i), card = q('.s2-card', i), mark = q('.s2-mark', i), trail = q('.trail', i);
    const meta = q('.s2-meta span', i), badge = S.querySelector(`.bd${i}`), cardBadge = card.querySelector('.c-delta');
    const words = splitWords(qEl);
    revealWords(words, a.at, { stagger: 0.07, dur: 0.8 });
    if (i < 2) hideWords(words, a.at + 3.6, { stagger: 0.03 });
    else hideWords(words, a.at + 3.5, { stagger: 0.03 });
    tl.set(meta, { opacity: 0 }, 0);
    tl.to(meta, { opacity: 1, duration: 0.3 }, B(a.at + 0.25));
    tl.to(meta, { opacity: 0, duration: 0.2 }, B(a.at + 3.6));

    const yFrom = a.from ? yOf(a.from) : yOf(a.to), yTo = yOf(a.to);
    const t0 = a.at + (i === 0 ? 0.75 : 0.5), dur = i === 0 ? 1.0 : 1.25;
    // Carte produit accrochée à la règle.
    tl.set(card, { autoAlpha: 0, x: a.kind === 'new' ? 760 : 40, y: yFrom - 52 }, 0);
    tl.set(mark, { autoAlpha: 0, scale: 0, y: yFrom - 9 }, 0);
    tl.set(cardBadge, { scale: 0, autoAlpha: 0 }, 0);
    if (a.kind === 'new') {
      tl.to(card, { autoAlpha: 1, x: 0, duration: B(1.1), ease: 'expo.out' }, B(t0));
      tl.to(mark, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' }, B(t0 + 0.55));
      cue(t0, 'whoosh', { dur: 0.45, from: 0.8, to: 0.3 });
    } else if (i === 0) {
      // Raccord avec la scène 1 : la ligne Bosch, plein cadre, se range sur la règle à son rang d'hier (n° 24).
      const cx = 1240 + 300, dx = 960 - cx, dy = 540 - yFrom;
      tl.set(card, { autoAlpha: 1, x: dx, y: yFrom - 52 + dy, scale: 2.9, transformOrigin: '50% 50%' }, B(15.99));
      tl.to(card, { x: 0, y: yFrom - 52, scale: 1, duration: B(1.25), ease: 'expo.inOut' }, B(16));
      tl.to(mark, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, B(16.9));
      tl.to(card, { y: yTo - 52, duration: B(dur), ease: 'expo.inOut' }, B(t0));
      tl.to(mark, { y: yTo - 9, duration: B(dur), ease: 'expo.inOut' }, B(t0));
      tl.set(trail, { attr: { y1: yFrom, y2: yFrom }, opacity: 1 }, 0);
      tl.to(trail, { attr: { y2: yTo }, duration: B(dur), ease: 'expo.inOut' }, B(t0));
      tl.to(trail, { opacity: 0, duration: 0.3 }, B(a.at + 3.5));
      cue(t0, 'rise', { dur: B(dur), pan: 0.35 });
    } else {
      tl.to(card, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out' }, B(a.at + 0.1));
      tl.to(mark, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, B(a.at + 0.1));
      tl.to(card, { y: yTo - 52, duration: B(dur), ease: 'expo.inOut' }, B(t0));
      tl.to(mark, { y: yTo - 9, duration: B(dur), ease: 'expo.inOut' }, B(t0));
      // Traînée : de l'ancien rang au rang actuel.
      tl.set(trail, { attr: { y1: yFrom, y2: yFrom }, opacity: 1 }, 0);
      tl.to(trail, { attr: { y2: yTo }, duration: B(dur), ease: 'expo.inOut' }, B(t0));
      tl.to(trail, { opacity: 0, duration: 0.3 }, B(a.at + 3.5));
      cue(t0, a.kind === 'up' ? 'rise' : 'fall', { dur: B(dur), pan: 0.35 });
    }
    tl.to(cardBadge, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2.5)' }, B(t0 + dur));
    tl.fromTo(mark.querySelector('.ring'), { scale: 0.4, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: 0.7, ease: 'expo.out' }, B(t0 + dur));
    cue(t0 + dur, a.kind === 'new' ? 'pop_new' : a.kind === 'up' ? 'pop_up' : 'pop_down', { pan: 0.3 });
    tl.to([card, mark], { autoAlpha: 0, x: '+=60', duration: 0.3, ease: 'power2.in' }, B(a.at + 3.55));

    // Grand rang à gauche + badge.
    tl.set(badge, { autoAlpha: 0, scale: 0.5, x: -10 }, 0);
    tl.to(badge, { autoAlpha: 1, scale: 1, x: 0, duration: 0.45, ease: 'back.out(2.2)' }, B(t0 + dur));
    tl.to(badge, { autoAlpha: 0, duration: 0.2 }, B(a.at + 3.6));
    if (a.from) counter(nEl, a.from, a.to, t0, dur, { easeName: 'expo.inOut', activeFrom: a.at - 0.5, activeTo: a.at + 3.9 });
  });
  // Nouveau : le rang s'affiche directement (n° 4) quand la carte se pose.
  everyFrame((t) => {
    if (t >= B(24) && t < B(28)) nEl.textContent = t < B(25.6) ? '—' : String(nw.rank);
  });
  tl.to(S.querySelector('.s2-rank'), { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, B(27.6));
  tl.to(S.querySelector('.s2-ruler'), { x: 300, opacity: 0, duration: B(0.5), ease: 'power3.in' }, B(27.5));
  cue(27.5, 'whoosh', { dur: 0.4, from: 0, to: 0.9 });

  // ---- « Les classements sont publics. »
  const amazon = DATA.lists['FR-high-tech'].slice(0, 4).map((x) => ({ r: x.rank, t: x.title, v: price(x.price, 'FR') }));
  const stanley = DATA.stores.find((s) => s.store === 'Stanley');
  const shop = stanley.items.slice(0, 4).map((x) => ({ r: x.rank, t: x.title, v: price(x.price, 'US') }));
  const goog = DATA.gtrends.FR.slice(0, 4).map((x) => ({ r: x.rank, t: `« ${x.title} »`, v: `${x.traffic.replace('000+', ' 000+')} rech.` }));
  const cards = [
    { logo: icon('amazon'), cls: 'amazon', name: 'Amazon', sub: 'Meilleures ventes · High-Tech', rows: amazon },
    { logo: icon('shopify'), cls: 'shopify', name: 'Shopify', sub: 'Stanley · meilleures ventes', rows: shop },
    { logo: icon('site-pv-google'), cls: 'google', name: 'Google Trends', sub: 'Tendances du moment · France', rows: goog },
  ];
  const wrap = S.querySelector('.s2-cards');
  cards.forEach((c, i) => {
    const el = h(`<div class="pub-card ${c.cls}"><div class="pc-head"><span class="pc-logo">${c.logo}</span>
      <span class="pc-n"><b>${c.name}</b><span>${fr(c.sub)}</span></span></div>
      <div class="pc-rows">${c.rows.map((r) => `<div class="pc-row"><span class="num pc-r">${r.r}</span><span class="pc-t">${esc(fr(r.t))}</span><span class="num pc-v">${esc(r.v)}</span><span class="pc-sk"></span></div>`).join('')}</div></div>`);
    wrap.append(el);
    tl.set(el, { autoAlpha: 0, y: 80, rotationX: -25 }, 0);
    tl.to(el, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.7, ease: 'expo.out' }, B(28 + i * 0.5));
    cue(28 + i * 0.5, 'card', { pan: (i - 1) * 0.6 });
    const rows = [...el.querySelectorAll('.pc-row')];
    tl.set(rows, { opacity: 0, x: -20 }, 0);
    tl.to(rows, { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' }, B(28.25 + i * 0.5));
    // L'historique disparaît : chaque ligne se vide (texte → barre fantôme → rien), de bas en haut.
    rows.slice().reverse().forEach((rw, k) => {
      const at = 30.25 + i * 0.25 + k * 0.25;
      tl.to(rw.querySelectorAll('.pc-r, .pc-t, .pc-v'), { opacity: 0, filter: 'blur(6px)', duration: 0.25, ease: 'power2.in' }, B(at));
      tl.fromTo(rw.querySelector('.pc-sk'), { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 0.2, ease: 'power2.out' }, B(at));
      tl.to(rw.querySelector('.pc-sk'), { opacity: 0, scaleX: 0, duration: 0.35, ease: 'power2.in' }, B(at + 0.5));
    });
    tl.to(el, { autoAlpha: 0, y: 30, scale: 0.96, duration: 0.25, ease: 'power2.in' }, B(31.35 + i * 0.03));
  });
  cue(30.25, 'erase', { dur: B(1.5) });

  const h1w = splitWords(S.querySelector('.s2-h1'));
  revealWords(h1w, 28, { stagger: 0.05, dur: 0.7 });
  hideWords(h1w, 29.75, { stagger: 0.02 });
  const gone = S.querySelector('.s2-gone');
  const goneChars = splitChars(gone);
  const h2w = splitWords(S.querySelector('.s2-h2a'));
  revealWords(h2w, 30, { stagger: 0.05, dur: 0.7 });
  tl.set(goneChars, { opacity: 0, y: 40 }, 0);
  tl.to(goneChars, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.03 }, B(30.5));
  // « disparaît. » se dissout lettre par lettre.
  tl.to(goneChars, { opacity: 0, filter: 'blur(10px)', y: -10, duration: 0.3, ease: 'power2.in', stagger: { each: 0.04, from: 'random' } }, B(31));
  tl.to(h2w, { opacity: 0, duration: 0.2 }, B(31.4));
  cue(31.0, 'dissolve', { dur: 0.6 });
}
