// Icônes de la v2 : celles de la v1 (Lucide, Simple Icons, flag-icons, sprite du site) + quelques Lucide en plus.
// Aucune icône dessinée ou générée.   node motion/v2/tools/build_icons.mjs  ->  motion/v2/src/icons.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS as V1 } from '../../src/icons.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const nm = (...p) => path.resolve(here, '..', '..', 'node_modules', ...p);
const ICONS = { ...V1 };
const clean = (svg) => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/\s*\n\s*/g, ' ').replace(/>\s+</g, '><').trim();
const extra = ['calendar', 'bell', 'eraser', 'x', 'circle-x', 'wand-sparkles', 'badge-euro', 'chart-spline', 'gift',
  'arrow-up', 'arrow-down', 'plus', 'link', 'external-link', 'repeat', 'circle-help', 'timer', 'hourglass', 'chevrons-up',
  'chevrons-down', 'flame', 'crown', 'equal-not', 'scan-eye', 'clock-alert', 'bell-dot'];
for (const n of extra) {
  let s = clean(fs.readFileSync(nm('lucide-static', 'icons', `${n}.svg`), 'utf8'));
  s = s.replace(/\s(width|height)="24"/g, '').replace(/class="[^"]*"/, `class="lu lu-${n}"`);
  ICONS[n] = s;
}
const out = path.resolve(here, '..', 'src', 'icons.js');
fs.writeFileSync(out, '// Généré par motion/v2/tools/build_icons.mjs : vraies icônes (Lucide, Simple Icons, flag-icons, sprite du site). Ne pas éditer.\n'
  + 'export const ICONS = ' + JSON.stringify(ICONS, null, 1) + ';\n');
console.log(`${Object.keys(ICONS).length} icônes -> ${path.relative(process.cwd(), out)}`);
