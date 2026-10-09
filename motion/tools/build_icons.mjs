// Rassemble les VRAIES icônes utilisées par la vidéo (aucune icône dessinée ou générée) :
//  - Lucide (lucide-static, ISC) pour l'interface et les catégories ;
//  - Simple Icons (CC0) pour les logos de marque (Amazon : v9, retiré des versions récentes) ;
//  - flag-icons (MIT) pour les drapeaux ;
//  - le sprite SVG du site Relevé lui-même (site/index.html) : badges ▲ ▼ ✚, logo, onglets, connexion Google/Microsoft/Discord.
// Sortie : src/icons.js  (export const ICONS = { nom: '<svg…>' })
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const nm = (...p) => path.join(root, 'node_modules', ...p);

const lucide = [
  'smartphone', 'laptop', 'cooking-pot', 'washing-machine', 'spray-can', 'heart-pulse', 'shirt', 'dumbbell',
  'puzzle', 'gamepad-2', 'baby', 'paw-print', 'hammer', 'sprout', 'car', 'paperclip', 'shopping-basket',
  'sunrise', 'sun', 'clock', 'calendar-days', 'calendar-check', 'history', 'database', 'trending-up', 'trending-down',
  'bell-ring', 'mail', 'store', 'search', 'radar', 'shield-check', 'newspaper', 'eye', 'mouse-pointer-2',
  'arrow-up-right', 'star', 'user', 'badge-check', 'chart-line', 'list-ordered', 'layers', 'globe', 'key-round',
  'sparkles', 'moon', 'download', 'zap', 'scan-line', 'refresh-cw', 'circle-check', 'ban', 'lock',
];
const ICONS = {};
const clean = (svg) => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/\s*\n\s*/g, ' ').replace(/>\s+</g, '><').trim();

for (const n of lucide) {
  let s = clean(fs.readFileSync(nm('lucide-static', 'icons', `${n}.svg`), 'utf8'));
  s = s.replace(/\s(width|height)="24"/g, '').replace(/class="[^"]*"/, `class="lu lu-${n}"`);
  ICONS[n] = s;
}

const brand = (file, name) => {
  let s = clean(fs.readFileSync(file, 'utf8')).replace(/<title>[^<]*<\/title>/, '');
  ICONS[name] = s.replace('<svg ', `<svg class="brand brand-${name}" fill="currentColor" `);
};
brand(nm('si-v9', 'icons', 'amazon.svg'), 'amazon');
brand(nm('simple-icons', 'icons', 'shopify.svg'), 'shopify');
brand(nm('simple-icons', 'icons', 'github.svg'), 'github');
brand(nm('simple-icons', 'icons', 'google.svg'), 'google-mono');

for (const f of ['fr', 'us']) {
  ICONS[`flag-${f}`] = clean(fs.readFileSync(nm('flag-icons', 'flags', '4x3', `${f}.svg`), 'utf8'))
    .replace('<svg ', `<svg class="flag" preserveAspectRatio="xMidYMid slice" `);
}

// Sprite du site : chaque <symbol> devient un <svg> autonome.
const html = fs.readFileSync(path.resolve(root, '..', 'site', 'index.html'), 'utf8');
for (const m of html.matchAll(/<symbol id="([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)) {
  const [, id, vb, body] = m;
  ICONS[`site-${id}`] = `<svg class="site-ic site-${id}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body.trim()}</svg>`;
}
// Logo de l'en-tête (pictogramme officiel, DESIGN.md §0) et icône d'application.
const logo = html.match(/<svg class="logo-mark"[\s\S]*?<\/svg>/)[0];
ICONS['site-logo-mark'] = logo.replace(' aria-hidden="true" focusable="false"', '');
ICONS['site-app-icon'] = clean(fs.readFileSync(path.resolve(root, '..', 'site', 'assets', 'icons', 'icon.svg'), 'utf8'));

const out = path.join(root, 'src', 'icons.js');
fs.writeFileSync(out, '// Généré par tools/build_icons.mjs : vraies icônes (Lucide, Simple Icons, flag-icons, sprite du site). Ne pas éditer.\n'
  + 'export const ICONS = ' + JSON.stringify(ICONS, null, 1) + ';\n');
console.log(`${Object.keys(ICONS).length} icônes -> ${path.relative(root, out)}`);
console.log(Object.keys(ICONS).filter(k => k.startsWith('site-')).join(' '));
