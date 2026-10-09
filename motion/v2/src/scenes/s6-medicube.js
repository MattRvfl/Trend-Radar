// Scènes 6-7 (temps 39,5 → 52,4) : « Le 8 octobre, Medicube tenait 7 des 10 premières places en beauté.
// Et quand une marque rafle tout comme ça, tu reçois une alerte. »
// Vrai top 10 Beauté et Parfum (Amazon.fr, 8 oct. 2026) et vraie notification de ruée générée par Relevé.
import { DATA } from '../../../src/data.js';
import { DATA2 } from '../data2.js';
import { tl, B, cue, h, icon, enter, sceneSpan, punch, shake, fr, everyFrame } from '../core.js';
import { esc } from '../ui.js';

export function sceneMedicube(stage, amb) {
  const rows = DATA2.beaute;
  const rush = DATA.rushes.find((r) => r.brand === 'Medicube');
  const RH = 70, GAP = 6;
  const prod = (r) => r.t.replace(new RegExp(`^${r.brand}\\s+`, 'i'), '');
  const S = h(`<section class="scene s6">
    <div class="s6-in">
      <div class="s6-pill pill">${icon('calendar')}<span class="num">8 oct. 2026</span><span class="sep">·</span>${icon('spray-can')}<span>${esc(DATA2.beaute_cat)}</span>${icon('flag-fr')}</div>
      <div class="s6-hd"><div class="s6-brand">Medicube</div><div class="s6-stat num"><span class="s6-7">7</span><span class="s6-10">/10</span></div></div>
      <div class="s6-list">${rows.map((r, i) => `<div class="s6-row${r.medicube ? ' mc' : ''}" style="top:${i * (RH + GAP)}px">
        <b class="num">${r.rank}</b><span class="br">${esc(r.medicube ? 'Medicube' : r.brand)}</span><span class="pd">${esc(prod(r))}</span></div>`).join('')}</div>
    </div>
    <div class="notif">
      <div class="n-ic">${icon('site-app-icon')}</div>
      <div class="n-tx"><div class="n-hd"><b>Relevé</b><span>maintenant</span></div>
        <div class="n-t">${esc(fr(rush.title))}</div><div class="n-b">${esc(fr(rush.body))}</div></div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 39.4, 52.9);
  const inner = S.querySelector('.s6-in');

  // ---- « Le 8 octobre » : la date, la catégorie.
  const pill = S.querySelector('.s6-pill');
  enter(pill, { opacity: 0, y: -30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out' }, B(39.5));
  punch(pill, 39.75, { s: 1.06, dur: 0.35 });
  cue(39.5, 'pop', { pan: 0 });
  // Le vrai top 10 tombe, ligne par ligne.
  const rr = [...S.querySelectorAll('.s6-row')];
  rr.forEach((r, i) => {
    enter(r, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, B(39.7 + i * 0.1));
  });
  cue(39.7, 'list_in', { n: 10 });
  // « Medicube » : la marque, puis ses 7 lignes s'allument une à une (on compte avec la voix).
  const brand = S.querySelector('.s6-brand');
  enter(brand, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(41.3));
  cue(41.3, 'text_hit');
  const mc = rr.filter((r) => r.classList.contains('mc'));
  mc.forEach((r, j) => {
    const at = 41.45 + j * 0.2;
    tl.to(r, { '--on': 1, duration: 0.12 }, B(at));
    punch(r, at, { s: 1.03, dur: 0.25 });
    cue(at, 'count', { n: j });
  });
  tl.set(mc, { '--on': 0 }, 0);
  const s7 = S.querySelector('.s6-7'), s10 = S.querySelector('.s6-10');
  enter(s7, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'expo.out' }, B(42.9));
  enter(s10, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, B(43.75));
  shake(inner, 42.9, { amp: 12, dur: 0.3, seed: 9 });
  cue(42.9, 'slam', { size: 'm' });
  cue(43.75, 'pop', { pan: 0.3 });
  tl.to(amb.new, { opacity: 0.55, duration: 0.12 }, B(42.9));
  tl.to(amb.new, { opacity: 0.22, duration: B(2) }, B(43.1));
  punch(pill, 45.35, { s: 1.05, dur: 0.35 });

  // ---- « Et quand une marque rafle tout comme ça » : les autres marques sont balayées, Medicube se resserre.
  const others = rr.filter((r) => !r.classList.contains('mc'));
  tl.to(others, { x: 1100, opacity: 0, duration: B(0.4), ease: 'power3.in', stagger: 0.05 }, B(47.9));
  cue(47.9, 'whoosh', { dur: B(0.45), from: -0.3, to: 0.9 });
  mc.forEach((r, j) => tl.to(r, { top: j * (RH + GAP), duration: B(0.5), ease: 'expo.inOut' }, B(48.6 + j * 0.03)));
  cue(48.6, 'sweep', { dur: B(0.5) });
  tl.to(mc, { '--gap': 0, duration: B(0.3), ease: 'power2.in' }, B(49.4));
  mc.forEach((r, j) => tl.to(r, { top: j * RH, duration: B(0.3), ease: 'power3.in' }, B(49.4)));
  shake(inner, 49.7, { amp: 10, dur: 0.25, seed: 11 });
  cue(49.7, 'snap_hit');

  // ---- « tu reçois une alerte » : tout recule, la notification tombe du haut de l'écran.
  tl.to(inner, { scale: 0.93, opacity: 0.45, filter: 'blur(6px)', duration: B(0.8), ease: 'power2.inOut' }, B(50.3));
  const nt = S.querySelector('.notif');
  enter(nt, { y: -700, opacity: 0 }, { y: 0, opacity: 1, duration: B(0.5), ease: 'back.out(1.25)' }, B(51.1) - B(0.22));
  shake(nt, 51.15, { amp: 7, dur: 0.35, seed: 13, freq: 38 });
  cue(51.1, 'notif');
  tl.to(amb.new, { opacity: 0, duration: B(1) }, B(50.3));
  tl.to(amb.accent, { opacity: 0.4, duration: B(0.5) }, B(51.1));
}
