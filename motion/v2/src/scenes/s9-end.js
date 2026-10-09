// Scène 9 (temps 61,9 → 70) : « Relevé. C'est gratuit. Rendez-vous demain matin. »
// Le logo se reconstruit sur la signature sonore ; l'adresse du site ; le compte gratuit (texte réel du site).
import { tl, B, cue, h, icon, enter, sceneSpan, punch, fr } from '../core.js';
import { logoSVG, wordSVG, buildLogo, buildWord, LOGO_HITS } from './s3-drop.js';

export function sceneEnd(stage, amb) {
  const S = h(`<section class="scene s9">
    <div class="s9-glow"></div>
    <div class="s9-lock">
      <div class="s9-mark">${logoSVG()}</div>
      <div class="s9-word">${wordSVG()}</div>
    </div>
    <div class="s9-free pill">${icon('sparkles')}<span>${fr('Compte gratuit, sans mot de passe')}</span></div>
    <div class="s9-url">${icon('globe')}<span>mattrvfl.github.io/Trend-Radar</span>${icon('arrow-up-right')}</div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 61.85, null);

  const svg = S.querySelector('.logo-svg');
  buildLogo(svg, 62);
  LOGO_HITS.forEach((hb, i) => cue(62 + hb, 'logo_vertex', { i, final: true }));
  buildWord(S.querySelector('.s9-word'), 62.4, 65);
  const glow = S.querySelector('.s9-glow');
  tl.set(glow, { opacity: 0, scale: 0.6 }, 0);
  tl.to(glow, { opacity: 1, scale: 1.1, duration: 0.3 }, B(62));
  tl.to(glow, { opacity: 0.45, scale: 1, duration: 1.6 }, B(62) + 0.3);
  tl.to(glow, { opacity: 0.85, duration: 0.15 }, B(65));
  tl.to(glow, { opacity: 0.4, duration: 1.2 }, B(65) + 0.15);
  cue(62, 'impact', { size: 'l' });
  amb.set('accent', 62, 0.3);
  punch(S.querySelector('.s9-lock'), 65, { s: 1.05, dur: 0.45 });

  // Vie de la carte de fin : poussée lente, halo qui respire sur les temps forts.
  const lockAll = [S.querySelector('.s9-lock'), S.querySelector('.s9-free'), S.querySelector('.s9-url')];
  tl.set(S, { scale: 1, transformOrigin: '50% 40%' }, 0);
  tl.to(S, { scale: 1.035, duration: B(9), ease: 'none' }, B(62));
  [64, 66, 68, 70].forEach((b) => {
    tl.to(glow, { opacity: 0.6, duration: 0.08 }, B(b));
    tl.to(glow, { opacity: 0.38, duration: B(1.2), ease: 'power2.out' }, B(b) + 0.08);
  });
  const free = S.querySelector('.s9-free');
  enter(free, { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' }, B(63.25));
  cue(63.25, 'pop_new', { pan: 0 });
  const url = S.querySelector('.s9-url');
  enter(url, { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(2)' }, B(64.9));
  cue(64.9, 'pop', { pan: 0 });
  punch(url, 66.1, { s: 1.05, dur: 0.4 });
  // Écho de la signature sur le point d'accent, puis le point respire jusqu'à la fin (la boucle reprend sur le crochet).
  const dot = svg.querySelector('.lm-dot'), ring = svg.querySelector('.lm-ring');
  tl.fromTo(ring, { scale: 1, opacity: 0.8 }, { scale: 4, opacity: 0, duration: 1.2, ease: 'expo.out', immediateRender: false }, B(68));
  LOGO_HITS.forEach((hb) => {
    tl.to(dot, { scale: 1.35, duration: 0.08, ease: 'power2.out' }, B(68 + hb));
    tl.to(dot, { scale: 1, duration: 0.4, ease: 'power3.out' }, B(68 + hb) + 0.08);
  });
  cue(68, 'dot_echo');
  // Dernière mesure : légère poussée vers l'avant, la boucle repart sur le crochet.
  tl.to(lockAll, { scale: 1.05, duration: B(1), ease: 'power2.in' }, B(71));
  tl.to(lockAll, { opacity: 0.0, duration: B(0.35), ease: 'power2.in' }, B(71.65));
  tl.to(glow, { opacity: 0, duration: B(0.5) }, B(71.5));
}
