// Noyau du film vertical (v2) : tempo, timeline maîtresse, repères audio et fonctions procédurales.
// Tout est fonction du temps t (secondes) : renderFrame(t) donne toujours la même image.
/* global gsap */
import { ICONS } from './icons.js';

export const BPM = 118.4;                  // calé sur la voix : les deux « Relevé » tombent sur les temps 22 et 62
export const BEAT = 60 / BPM;              // 0,5068 s
export const B = (n) => n * BEAT;           // temps (en battements) -> secondes
export const BARS = 18;
export const END_BEAT = 72;                // 36,5 s = 18 mesures pile (boucle propre) ; la voix finit au temps 67,3
export const DURATION = B(END_BEAT);
export const W = 1080;
export const H = 1920;

gsap.defaults({ immediateRender: false, overwrite: false, lazy: false });   // lazy:false : chaque rendu écrit tout de suite (rendu déterministe)
export const tl = gsap.timeline({ paused: true, defaults: { immediateRender: false, lazy: false } });
// Garde-fou : une position négative décalerait toute la timeline (GSAP n'admet pas d'enfant avant 0).
for (const m of ['to', 'set', 'fromTo', 'from']) {
  const f = tl[m].bind(tl);
  tl[m] = (...a) => {
    const p = a[a.length - 1];
    if (typeof p === 'number' && p < 0) throw new Error(`tl.${m} à une position négative (${p.toFixed(4)} s)`);
    return f(...a);
  };
}

// ---- Repères audio : chaque animation qui mérite un son le déclare ici (lu par audio/compose.py).
export const CUES = [];
export function cue(beat, type, params = {}) {
  CUES.push({ t: +B(beat).toFixed(5), beat: +(+beat).toFixed(4), type, ...params });
}

// ---- Fonctions appelées à chaque image (compteurs, frappe au clavier, particules…).
const frameFns = [];
export function everyFrame(fn) { frameFns.push(fn); }
export function renderFrame(t) {
  tl.seek(t, false);
  for (const f of frameFns) f(t);
}

// ---- Outils
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const ease = (name) => gsap.parseEase(name);
export function progress(t, startBeat, durBeats, easeName = 'none') {
  const p = clamp((t - B(startBeat)) / B(durBeats));
  return easeName === 'none' ? p : ease(easeName)(p);
}

export function h(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function icon(name, cls = '') {
  const svg = ICONS[name];
  if (!svg) throw new Error(`icône inconnue : ${name}`);
  return cls ? svg.replace('<svg ', `<svg data-ic="${name}" `).replace(/class="([^"]*)"/, `class="$1 ${cls}"`) : svg;
}

// Typographie française : espace fine insécable avant ? ! ; et à l'intérieur des guillemets.
export const NNBSP = ' ';
export const NBSP = ' ';
export function fr(s) {
  return s.replace(/ ([?!;])/g, `${NNBSP}$1`).replace(/ :/g, `${NBSP}:`)
    .replace(/« /g, `«${NNBSP}`).replace(/ »/g, `${NNBSP}»`);
}

const nf2 = (cur) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur });
export function price(v, market = 'FR') {
  if (v == null) return '—';
  return nf2(market === 'US' ? 'USD' : 'EUR').format(v).replace('$US', '$US').replace('US$', '$US');
}
export const int = (v) => new Intl.NumberFormat('fr-FR').format(v);

// Découpe un élément en mots masqués : <span class="m"><span class="mi">mot</span></span>
export function splitWords(node) {
  const words = node.textContent.split(/(\s+)/);
  node.textContent = '';
  const inner = [];
  for (const w of words) {
    if (/^\s+$/.test(w)) { node.append(document.createTextNode(w.includes(NNBSP) || w.includes(NBSP) ? w : ' ')); continue; }
    if (!w) continue;
    const m = document.createElement('span'); m.className = 'm';
    const i = document.createElement('span'); i.className = 'mi'; i.textContent = w;
    m.append(i); node.append(m); inner.push(i);
  }
  return inner;
}
export function splitChars(node) {
  const text = node.textContent; node.textContent = '';
  return [...text].map((c) => {
    const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c;
    node.append(s); return s;
  });
}

// Entrée : l'état de départ est posé dès t = 0 (rien n'apparaît avant son entrée).
export function enter(targets, from, to, position) {
  tl.set(targets, from, 0);
  return tl.fromTo(targets, from, to, position);
}

// Révélation de mots par masque, mot après mot.
export function revealWords(words, beat, { stagger = 0.06, dur = 0.7, ease: e = 'expo.out', y = 105 } = {}) {
  tl.set(words, { yPercent: y }, 0);
  tl.to(words, { yPercent: 0, duration: dur, ease: e, stagger }, B(beat));
}
export function hideWords(words, beat, { dur = 0.35, ease: e = 'power3.in', stagger = 0.02, y = -110 } = {}) {
  tl.to(words, { yPercent: y, duration: dur, ease: e, stagger }, B(beat));
  tl.to(words, { opacity: 0, duration: dur * 0.6, ease: 'power1.in', stagger }, B(beat) + dur * 0.4);
}

// Compteur entier déterministe (aucun état : dépend seulement de t).
export function counter(node, from, to, startBeat, durBeats, { easeName = 'power2.out', fmt = (v) => String(v), activeFrom = -Infinity, activeTo = Infinity } = {}) {
  everyFrame((t) => {
    if (t < B(activeFrom) || t >= B(activeTo)) return;
    const p = progress(t, startBeat, durBeats, easeName);
    node.textContent = fmt(Math.round(lerp(from, to, p)));
  });
}

// Texte tapé au clavier, caractère par caractère, avec curseur.
export function typeText(node, text, startBeat, durBeats, { caret = true } = {}) {
  everyFrame((t) => {
    const p = progress(t, startBeat, durBeats);
    const n = Math.round(p * text.length);
    const blink = Math.floor(t * 2.6) % 2 === 0;
    const showCaret = caret && t >= B(startBeat) - 0.4 && (p < 1 ? true : blink && t < B(startBeat + durBeats) + 1.2);
    node.innerHTML = '';
    node.append(document.createTextNode(text.slice(0, n)));
    if (showCaret) { const c = document.createElement('span'); c.className = 'caret'; node.append(c); }
  });
}

// Bruit pseudo-aléatoire déterministe.
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

// Affiche une scène entre deux temps (display none ailleurs : rien à peindre).
export function sceneSpan(node, fromBeat, toBeat) {
  // Attention : GSAP décale TOUTE la timeline si un enfant est placé à un temps négatif, et deux réglages
  // contradictoires au même instant dépendent du sens de lecture. Une scène visible dès t = 0 est donc
  // affichée directement, sans réglage au temps 0.
  if (fromBeat <= 0) node.style.display = 'block';
  else { tl.set(node, { display: 'none' }, 0); tl.set(node, { display: 'block' }, B(fromBeat)); }
  if (toBeat != null) tl.set(node, { display: 'none' }, B(toBeat));
}

// ---- Gestes de caméra et d'impact (v2)
// Secousse amortie, déterministe : décalages x/y qui décroissent sur `dur` secondes.
export function shake(node, beat, { amp = 14, dur = 0.35, freq = 31, seed = 1 } = {}) {
  const r = rng(seed), ph = [r() * 6.28, r() * 6.28];
  everyFrame((t) => {
    const k = t - B(beat);
    if (k < 0 || k > dur) { if (node._sh) { node.style.translate = ''; node._sh = 0; } return; }
    const a = amp * Math.pow(1 - k / dur, 2);
    node.style.translate = `${(a * Math.sin(k * freq * 6.28 + ph[0])).toFixed(2)}px ${(a * Math.cos(k * freq * 5.1 + ph[1])).toFixed(2)}px`;
    node._sh = 1;
  });
}
// Coup de poing d'échelle : grossit puis revient (sur la propriété CSS `scale`, indépendante des tweens GSAP).
export function punch(node, beat, { s = 1.12, dur = 0.42 } = {}) {
  everyFrame((t) => {
    const k = t - B(beat);
    if (k < 0 || k > dur) { if (node._pu === beat) { node.style.scale = ''; node._pu = null; } return; }
    const p = k / dur;
    const v = 1 + (s - 1) * Math.exp(-p * 5) * Math.cos(p * 7.5);
    node.style.scale = v.toFixed(4); node._pu = beat;
  });
}
