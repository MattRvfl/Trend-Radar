// Rend quelques images fixes pour contrôle : node tools/stills.mjs out_dir t1 t2 ... (en secondes, ou "b12" en temps)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:8790/src/index.html');
await page.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 30000 });
const err = await page.evaluate(() => window.BOOT_ERROR);
if (err) { console.log('BOOT_ERROR', err); process.exit(1); }
for (const ts of times) {
  const t = ts.startsWith('b') ? parseFloat(ts.slice(1)) * 0.5 : parseFloat(ts);
  await page.evaluate((t) => window.renderFrame(t), t + 1e-6);
  const name = `${outDir}/t${t.toFixed(3).padStart(7, '0')}.png`;
  await page.screenshot({ path: name });
  console.log(name);
}
await browser.close();
