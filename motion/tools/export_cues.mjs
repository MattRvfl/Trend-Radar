// Exporte les repères sonores déclarés par l'animation : node tools/export_cues.mjs -> src/cues.json
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:8790/src/index.html');
await page.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 30000 });
const { cues, duration, err } = await page.evaluate(() => ({ cues: window.CUES, duration: window.DURATION, err: window.BOOT_ERROR }));
if (err) { console.log(err); process.exit(1); }
fs.writeFileSync(new URL('../src/cues.json', import.meta.url), JSON.stringify({ bpm: 120, duration, cues }, null, 1));
const byType = {};
for (const c of cues) byType[c.type] = (byType[c.type] || 0) + 1;
console.log(`${cues.length} repères, durée ${duration} s`);
console.log(byType);
await browser.close();
