// Scène 8 (temps 52,4 → 61,9) : « Pas de prédiction, pas d'estimation de ventes : juste les vrais classements,
// avec leur source. » Bascule en thème clair (cercle qui part de l'icône de la notification), comme le bouton ◐ du site.
import { DATA2 } from '../data2.js';
import { tl, B, cue, h, icon, enter, sceneSpan, punch, fr, typeText } from '../core.js';
import { thumb, esc } from '../ui.js';

export function sceneHonest(stage, amb) {
  const top3 = DATA2.sante['2026-10-08'].slice(0, 3);
  const heroId = DATA2.hero.id;
  const S = h(`<section class="scene s8 light">
    <div class="grid-bg"></div>
    <div class="s8-k">${icon('shield-check')}<span>Méthode et sources</span></div>
    <div class="s8-no">
      <div class="s8-card a">${icon('wand-sparkles')}<span class="tx">Prédiction</span><svg class="s8-spark" viewBox="0 0 200 80"><polyline class="past" points="6,70 46,56 86,40 126,38"/><polyline class="fut" points="126,38 166,20 196,8"/></svg><i class="strike"></i></div>
      <div class="s8-card b">${icon('badge-euro')}<span class="tx">${fr('Estimation de ventes')}</span><i class="strike"></i></div>
    </div>
    <div class="s8-yes">
      <div class="s8-rows">${top3.map((x) => `<div class="s8-row${x.id === heroId ? ' hero' : ''}"><b class="num">${x.rank}</b>${thumb('sante', 76)}<span class="t">${esc(x.id === heroId ? DATA2.hero.title : x.t)}</span>${x.id === heroId ? `<span class="c-delta is-up" style="--s:2.2">${icon('site-i-up')}<span>1</span></span>` : ''}</div>`).join('')}</div>
      <div class="s8-src"><i class="dot amazon"></i><span class="tt"></span>${icon('site-i-ext')}</div>
    </div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 52.3, 62.0);

  // Bascule : cercle qui part de l'icône de l'application (notification), puis se referme au centre.
  const ox = 130, oy = 314;
  tl.set(S, { clipPath: `circle(0px at ${ox}px ${oy}px)` }, 0);
  tl.to(S, { clipPath: `circle(2300px at ${ox}px ${oy}px)`, duration: B(0.9), ease: 'power3.in' }, B(52.35));
  cue(52.35, 'theme_switch');
  tl.to(S, { clipPath: 'circle(0px at 540px 560px)', duration: B(0.85), ease: 'expo.in' }, B(61.05));
  cue(61.05, 'reverse_swell', { dur: B(0.85) });
  tl.to(amb.accent, { opacity: 0, duration: B(1) }, B(52.4));

  const k = S.querySelector('.s8-k');
  enter(k, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(52.8));
  // Ce que Relevé ne fait pas : barré, en rythme avec la voix.
  const a = S.querySelector('.s8-card.a'), b = S.querySelector('.s8-card.b');
  enter(a, { opacity: 0, y: 60, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out' }, B(52.75));
  enter(b, { opacity: 0, y: 60, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out' }, B(54.4));
  cue(52.75, 'card'); cue(54.4, 'card');
  const fut = a.querySelector('.fut');
  enter(fut, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: B(0.6), ease: 'power2.out' }, B(53.0));
  [[a, 53.75], [b, 55.85]].forEach(([el, at]) => {
    const st = el.querySelector('.strike');
    tl.set(st, { scaleX: 0 }, 0);
    tl.to(st, { scaleX: 1, duration: B(0.45), ease: 'power3.inOut' }, B(at));
    tl.to(el, { opacity: 0.55, duration: B(0.4) }, B(at + 0.3));
    cue(at, 'strike', { dur: B(0.45) });
  });
  tl.to(S.querySelector('.s8-no'), { y: -80, opacity: 0, duration: B(0.5), ease: 'power3.in' }, B(56.45));

  // Ce qu'il fait : le vrai classement, et sa source.
  const rows = [...S.querySelectorAll('.s8-row')];
  rows.forEach((r, i) => enter(r, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B(56.8 + i * 0.15)));
  cue(56.8, 'list_in', { n: 3 });
  const hero = S.querySelector('.s8-row.hero');
  punch(hero, 58.3, { s: 1.04, dur: 0.35 });
  const src = S.querySelector('.s8-src');
  enter(src, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' }, B(59.7));
  typeText(src.querySelector('.tt'), fr('Amazon.fr · Meilleures ventes · Hygiène et Santé · relevé le 8 oct. 2026'), 59.75, 1.5, { caret: true });
  cue(59.75, 'typing', { dur: B(1.5), n: 26 });
  const ext = src.querySelector('.site-ic');
  tl.set(ext, { opacity: 0, scale: 0.4 }, 0);
  tl.to(ext, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, B(61.25));
}
