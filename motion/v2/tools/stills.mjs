// Images fixes de contrôle : node motion/v2/tools/stills.mjs out_dir t1 t2 …   (secondes, ou « b12 » en temps musicaux)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const url = process.env.URL || 'http://localhost:8790/v2/src/index.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(url);
await page.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 30000 });
const err = await page.evaluate(() => window.BOOT_ERROR);
if (err) { console.log('BOOT_ERROR', err); process.exit(1); }
const beat = await page.evaluate(() => window.BEAT);
for (const ts of times) {
  const t = ts.startsWith('b') ? parseFloat(ts.slice(1)) * beat : parseFloat(ts);
  await page.evaluate((tt) => window.renderFrame(tt), t + 1e-6);
  const name = `${outDir}/${ts.startsWith('b') ? 'b' + parseFloat(ts.slice(1)).toFixed(2).padStart(6, '0') : 't' + t.toFixed(3).padStart(7, '0')}.png`;
  await page.screenshot({ path: name });
  console.log(name);
}
await browser.close();
