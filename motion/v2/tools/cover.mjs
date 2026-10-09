// Image de couverture (TikTok / Reels / Shorts) : node motion/v2/tools/cover.mjs -> out/releve-vertical-couverture.jpg
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:8790/v2/src/cover.html');
await page.waitForFunction(() => window.READY, null, { timeout: 30000 });
await page.screenshot({ path: new URL('../out/releve-vertical-couverture.png', import.meta.url).pathname });
await browser.close();
console.log('out/releve-vertical-couverture.png');
