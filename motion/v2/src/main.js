// Assemble le film vertical. window.renderFrame(t) est appelé image par image par tools/render.mjs.
/* global gsap, DrawSVGPlugin, MorphSVGPlugin, CustomEase */
import { tl, B, renderFrame, DURATION, CUES, END_BEAT, h } from './core.js';
import { captions } from './captions.js';
import { sceneHook } from './scenes/s1-hook.js';
import { sceneDrop } from './scenes/s3-drop.js';
import { sceneSources } from './scenes/s4-sources.js';
import { sceneMovers } from './scenes/s5-movers.js';
import { sceneMedicube } from './scenes/s6-medicube.js';
import { sceneHonest } from './scenes/s8-honest.js';
import { sceneEnd } from './scenes/s9-end.js';

gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, CustomEase);

// Halos d'ambiance (couleurs du design system), pilotés par les scènes.
function ambient(stage) {
  const C = { accent: '#82A7F8', up: '#3CCB9B', down: '#FF925A', new: '#EE93CF', amazon: '#F0A23B', shopify: '#8CC265', google: '#8BA0F2' };
  const el = h(`<div class="amb">${Object.entries(C).map(([k, c]) => `<i data-k="${k}" style="--c:${c}38"></i>`).join('')}</div>`);
  stage.append(el);
  const amb = { el };
  for (const i of el.children) amb[i.dataset.k] = i;   // opacité 0 par défaut (CSS)
  amb.set = (k, beat, op) => tl.set(amb[k], { opacity: op }, B(beat));
  return amb;
}

async function boot() {
  await Promise.all(['500', '600', '700', '800'].flatMap((w) => [
    document.fonts.load(`${w} 40px "Inter Variable"`), document.fonts.load(`${w} 300px "Inter Variable"`),
  ]));
  await document.fonts.load('500 20px "JetBrains Mono"');
  await document.fonts.ready;

  const stage = document.getElementById('stage');
  const marker = gsap.to({}, { duration: 0.001 });   // garde-fou : si un enfant était placé à un temps négatif, GSAP décalerait tout
  tl.add(marker, 0);
  const amb = ambient(stage);
  sceneHook(stage, amb);
  sceneDrop(stage, amb);
  sceneSources(stage, amb);
  sceneMovers(stage, amb);
  sceneMedicube(stage, amb);
  sceneHonest(stage, amb);
  sceneEnd(stage, amb);
  const vig = h('<div class="vignette"></div>');
  stage.append(vig);
  // Vignettage discret sur la partie claire (scène 8), plein ailleurs.
  tl.to(vig, { opacity: 0.12, duration: B(0.8) }, B(52.6));
  tl.to(vig, { opacity: 1, duration: B(0.5) }, B(61.5));
  // Le cercle clair atteint la zone des sous-titres vers 53,05 et la quitte vers 61,85.
  captions(stage, { light: [[B(53.05), B(61.85)]] });

  // (pas de tl.seek(0) ici : les réglages posés au temps 0 ne seraient plus appliqués au premier rendu)
  if (Math.abs(marker.startTime()) > 1e-9) throw new Error(`timeline décalée de ${marker.startTime()} s (position négative quelque part)`);
  window.renderFrame = renderFrame;
  window.DURATION = DURATION;
  window.CUES = CUES.sort((a, b) => a.t - b.t);
  window.END_BEAT = END_BEAT;
  window.BEAT = B(1);
  const q = new URLSearchParams(location.search);
  if (q.has('t')) renderFrame(parseFloat(q.get('t')));
  window.READY = true;
}
boot().catch((e) => { window.BOOT_ERROR = String(e && e.stack || e); console.error(e); });
