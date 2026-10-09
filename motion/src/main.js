// Assemble le film. window.renderFrame(t) est appelé image par image par tools/render.mjs.
/* global gsap, DrawSVGPlugin, MorphSVGPlugin, CustomEase */
import { tl, B, renderFrame, DURATION, CUES, END_BEAT } from './lib/core.js';
import { scene1 } from './scenes/s1-wall.js';
import { scene2 } from './scenes/s2-movers.js';
import { scene3 } from './scenes/s3-logo.js';
import { scene4 } from './scenes/s4-sources.js';
import { scene5, scene6 } from './scenes/s5-product.js';
import { scene7 } from './scenes/s7-honest.js';
import { scene8 } from './scenes/s8-outro.js';

gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, CustomEase);

async function boot() {
  // Toutes les graisses utilisées, chargées avant de mesurer quoi que ce soit.
  await Promise.all(['400', '500', '600', '700'].flatMap((w) => [
    document.fonts.load(`${w} 40px "Inter Variable"`), document.fonts.load(`${w} 160px "Inter Variable"`),
  ]));
  await document.fonts.load('500 20px "JetBrains Mono"');
  await document.fonts.ready;

  const stage = document.getElementById('stage');
  for (const s of [scene1, scene2, scene3, scene4]) s(stage);
  scene6(scene5(stage));
  scene7(stage);
  scene8(stage);
  const vig = Object.assign(document.createElement('div'), { className: 'vignette' });
  stage.append(vig);
  // Vignettage discret sur la partie claire (scène 7), plein ailleurs.
  tl.to(vig, { opacity: 0.18, duration: B(1) }, B(95));
  tl.to(vig, { opacity: 1, duration: B(1) }, B(111));

  tl.seek(0);
  window.renderFrame = renderFrame;
  window.DURATION = DURATION;
  window.CUES = CUES.sort((a, b) => a.t - b.t);
  window.END_BEAT = END_BEAT;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) renderFrame(parseFloat(q.get('t')));
  if (q.has('play')) {
    const t0 = performance.now() - parseFloat(q.get('play') || 0) * 1000;
    const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
    loop();
  }
  window.READY = true;
}
boot().catch((e) => { window.BOOT_ERROR = String(e && e.stack || e); console.error(e); });
