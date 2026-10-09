// Scène 5 (temps 34,4 → 39,6) : « Tu vois qui monte, qui chute, qui débarque. »
// Trois vrais mouvements du 8 octobre (France) : la plus forte hausse, une chute, une entrée.
import { DATA } from '../../../src/data.js';
import { tl, B, cue, h, icon, enter, sceneSpan, punch, shake, fr } from '../core.js';
import { thumb, esc } from '../ui.js';

export function sceneMovers(stage, amb) {
  const up = DATA.ups[0];                                              // Bosch Série 6 : n° 24 → n° 6
  const down = DATA.downs.find((x) => x.short.startsWith('Pokémon'));  // Pokémon : n° 11 → n° 26
  const nw = DATA.news.find((x) => x.short.startsWith("Levi's"));       // Levi's : entrée en n° 4
  const M = [
    { it: up, k: 'up', at: 35.6, from: up.rank + up.change, to: up.rank, badge: `${icon('site-i-up')}<span>${up.change}</span>`, verb: 'monte' },
    { it: down, k: 'down', at: 36.7, from: down.rank + down.change, to: down.rank, badge: `${icon('site-i-down')}<span>${-down.change}</span>`, verb: 'chute' },
    { it: nw, k: 'new', at: 37.95, from: null, to: nw.rank, badge: `${icon('site-i-new')}<span>Nouveau</span>`, verb: 'débarque' },
  ];
  const S = h(`<section class="scene s5">
    ${M.map((m) => `<div class="s5-big ${m.k}">${icon(`site-i-${m.k}`)}</div>`).join('')}
    <div class="s5-cards">${M.map((m) => `<div class="s5-card ${m.k}">
      <div class="s5-top"><span class="c-delta is-${m.k}" style="--s:3.3">${m.badge}</span>
        <span class="s5-rk num">${m.from ? `n° ${m.from} <i>→</i> <b>n° ${m.to}</b>` : `<b>n° ${m.to}</b> dès son arrivée`}</span></div>
      <div class="s5-bot">${thumb(m.it.category, 104)}<div class="s5-tx"><div class="s5-t">${esc(fr(m.it.short))}</div><div class="s5-c">${esc(m.it.cat)} · Amazon.fr</div></div></div>
    </div>`).join('')}</div>
  </section>`);
  stage.append(S);
  sceneSpan(S, 34.4, 39.7);
  const cards = [...S.querySelectorAll('.s5-card')];
  // Qui monte : la carte jaillit du bas. Qui chute : elle tombe d'en haut. Qui débarque : elle apparaît d'un coup.
  enter(cards[0], { y: 1750, opacity: 1 }, { y: 0, duration: B(0.5), ease: 'expo.out' }, B(M[0].at) - B(0.18));
  enter(cards[1], { y: -1300, opacity: 1 }, { y: 0, duration: B(0.55), ease: 'bounce.out' }, B(M[1].at) - B(0.2));
  enter(cards[2], { scale: 0.2, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.2)' }, B(M[2].at));
  cue(M[0].at - 0.18, 'rise', { dur: B(0.5) });
  cue(M[1].at - 0.2, 'fall', { dur: B(0.5) });
  cue(M[2].at, 'pop_new');
  M.forEach((m, i) => {
    const b = cards[i].querySelector('.c-delta');
    tl.set(b, { scale: 0.4, opacity: 0 }, 0);
    tl.to(b, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(3)' }, B(m.at) + 0.04);
    punch(cards[i], m.at + 0.05, { s: 1.03, dur: 0.3 });
    tl.to(amb[m.k], { opacity: 0.5, duration: 0.12 }, B(m.at));
    tl.to(amb[m.k], { opacity: 0, duration: B(1.1) }, B(m.at) + 0.2);
  });
  shake(S, M[1].at + 0.2, { amp: 10, dur: 0.3, seed: 7 });
  // Grand pictogramme de fond (badges du site) : il traverse l'écran dans le sens du mouvement.
  const bigs = [...S.querySelectorAll('.s5-big')];
  [[0, 300, -300], [1, -300, 300], [2, 0, 0]].forEach(([i, y0, y1]) => {
    const at = B(M[i].at);
    tl.set(bigs[i], { opacity: 0, y: y0, scale: i === 2 ? 0.5 : 1 }, 0);
    tl.to(bigs[i], { opacity: 0.1, y: (y0 + y1) / 2, scale: 1, duration: 0.25, ease: 'power2.out' }, at - 0.1);
    tl.to(bigs[i], { opacity: 0, y: y1, scale: i === 2 ? 1.3 : 1, duration: B(1.1), ease: 'power1.in' }, at + 0.15);
  });
  // Sortie : coup de fouet vers la gauche.
  tl.to(cards, { x: -1200, duration: B(0.45), ease: 'power3.in', stagger: 0.04 }, B(39.05));
  cue(39.05, 'whoosh', { dur: B(0.5), from: 0.6, to: -0.8 });
}
