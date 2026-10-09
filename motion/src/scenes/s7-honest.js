// Scène 7 (temps 95 → 112) : le bouton de thème bascule tout en clair. Respiration éditoriale :
// ce que Relevé ne fait pas, ce qu'il fait, et la phrase écrite en bas de chaque page du site.
import { tl, B, cue, h, icon, splitWords, revealWords, sceneSpan, fr, typeText, enter } from '../lib/core.js';
import { cams } from './s5-product.js';

export function scene7(stage) {
  const S = h(`<section class="scene s7 light">
    <div class="grid-bg"></div>
    <div class="s7-k kicker">${icon('shield-check')}<span>Méthode et sources</span></div>
    <div class="s7-no">
      <div class="display s7-a"><span class="tx">Pas de prédiction.</span><i class="strike"></i></div>
      <div class="display s7-b"><span class="tx">${fr("Pas d'estimation de ventes.")}</span><i class="strike"></i></div>
    </div>
    <div class="s7-yes">
      <div class="display s7-c">Des positions.</div>
      <div class="display s7-d"><span class="acc">Avec leur source.</span></div>
      <div class="s7-src"><i class="dot amazon"></i><span class="tt"></span><span class="ar">↗</span></div>
    </div>
    <div class="s7-q">
      <div class="s7-note">${icon('site-i-info')}<div class="s7-qt">${fr("Un classement n'est pas un volume de ventes.")}</div></div>
      <div class="s7-sub lede">${fr('Écrit en bas de chaque page du site.')}</div>
    </div>
    <svg class="s7-ruler" viewBox="0 0 1920 120" width="1920" height="120">${Array.from({ length: 49 }, (_, i) => `<line x1="${160 + i * 33.3}" x2="${160 + i * 33.3}" y1="${i % 4 ? 70 : 50}" y2="90"/>`).join('')}<line class="base" x1="160" x2="1760" y1="90" y2="90"/></svg>
  </section>`);
  stage.append(S);
  sceneSpan(S, 95, 112.2);

  // Bascule de thème : cercle qui grandit depuis le bouton ◐ (comme le vrai bouton du site).
  const ox = cams.themeR.cx, oy = cams.themeR.cy;
  tl.set(S, { clipPath: `circle(0px at ${ox}px ${oy}px)` }, 0);
  tl.to(S, { clipPath: `circle(2300px at ${ox}px ${oy}px)`, duration: B(1), ease: 'power3.in' }, B(95));
  // Fermeture en fin de scène : le cercle se referme au centre, en un point (le point d'accent du logo).
  tl.to(S, { clipPath: 'circle(0px at 960px 470px)', duration: B(1), ease: 'expo.in' }, B(111));
  cue(111, 'reverse_swell', { dur: B(1) });

  const k = S.querySelector('.s7-k');
  enter(k, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, B(96));

  const a = S.querySelector('.s7-a'), b = S.querySelector('.s7-b');
  const aw = splitWords(a.querySelector('.tx')), bw = splitWords(b.querySelector('.tx'));
  revealWords(aw, 96, { stagger: 0.07, dur: 0.9 });
  revealWords(bw, 98, { stagger: 0.06, dur: 0.9 });
  [[a, 97.5], [b, 99.5]].forEach(([el, at]) => {
    const st = el.querySelector('.strike');
    tl.set(st, { scaleX: 0 }, 0);
    tl.to(st, { scaleX: 1, duration: B(0.5), ease: 'power3.inOut' }, B(at));
    tl.to(el.querySelector('.tx'), { color: '#8F8F96', duration: B(0.5) }, B(at + 0.25));
    cue(at, 'strike', { dur: B(0.5) });
  });
  const no = S.querySelector('.s7-no');
  tl.to(no, { y: -60, opacity: 0, duration: B(0.6), ease: 'power3.in' }, B(100.6));

  const cw = splitWords(S.querySelector('.s7-c')), dEl = S.querySelector('.s7-d .acc');
  const dw = splitWords(dEl);
  revealWords(cw, 101, { stagger: 0.07, dur: 0.9 });
  revealWords(dw, 102, { stagger: 0.07, dur: 0.9 });
  const src = S.querySelector('.s7-src');
  enter(src, { opacity: 0 }, { opacity: 1, duration: 0.3 }, B(103));
  typeText(src.querySelector('.tt'), fr('Amazon.fr Meilleures ventes · Hygiène et Santé · relevé le 8 oct. à 14:10'), 103.1, 1.4);
  cue(103.1, 'typing', { dur: B(1.4), n: 60 });
  tl.set(src.querySelector('.ar'), { opacity: 0 }, 0);
  tl.to(src.querySelector('.ar'), { opacity: 1, duration: 0.2 }, B(104.6));
  tl.to(S.querySelector('.s7-yes'), { y: -60, opacity: 0, duration: B(0.6), ease: 'power3.in' }, B(104.9));

  const q = S.querySelector('.s7-q'), note = q.querySelector('.s7-note');
  enter(note, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, B(105.5));
  const qw = splitWords(q.querySelector('.s7-qt'));
  revealWords(qw, 105.6, { stagger: 0.05, dur: 0.9 });
  const sub = q.querySelector('.s7-sub');
  enter(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, B(107.5));
  cue(105.5, 'soft_hit');

  // Montée : la règle se remplit de graduations, de plus en plus vite, jusqu'à la fermeture.
  const ticks = [...S.querySelectorAll('.s7-ruler line:not(.base)')];
  tl.set(ticks, { opacity: 0, scaleY: 0, transformOrigin: '50% 100%' }, 0);
  ticks.forEach((t, i) => {
    const p = i / (ticks.length - 1);
    const at = 108 + 3 * (1 - Math.pow(1 - p, 1.8));
    tl.to(t, { opacity: 1, scaleY: 1, duration: 0.15, ease: 'power2.out' }, B(at));
  });
  const base = S.querySelector('.s7-ruler .base');
  tl.set(base, { drawSVG: '0%' }, 0);
  tl.to(base, { drawSVG: '100%', duration: B(3), ease: 'power2.in' }, B(108));
  tl.to(q, { scale: 0.96, opacity: 0.0, duration: B(1), ease: 'power2.in' }, B(110.5));
}
