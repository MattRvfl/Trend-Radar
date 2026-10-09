// Exporte les repères sonores déclarés par l'animation v2 : node motion/v2/tools/export_cues.mjs -> motion/v2/src/cues.json
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:8790/v2/src/index.html');
await page.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 30000 });
const { cues, duration, beat, err } = await page.evaluate(() => ({ cues: window.CUES, duration: window.DURATION, beat: window.BEAT, err: window.BOOT_ERROR }));
if (err) { console.log(err); process.exit(1); }
fs.writeFileSync(new URL('../src/cues.json', import.meta.url), JSON.stringify({ bpm: 60 / beat, duration, cues }, null, 1));
const byType = {};
for (const c of cues) byType[c.type] = (byType[c.type] || 0) + 1;
console.log(`${cues.length} repères, durée ${duration.toFixed(3)} s, ${(60 / beat).toFixed(2)} BPM`);
console.log(byType);
await browser.close();
