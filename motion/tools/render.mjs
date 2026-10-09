// Rendu image par image : Chromium (Playwright) capture la page à t donné, ffmpeg assemble.
// Flou de mouvement réel : `sub` sous-images par image, réparties sur l'obturateur (180° par défaut), moyennées.
//   node tools/render.mjs --fps 60 --sub 4 --workers 3            -> out/chunks/*.mkv puis out/releve-motion.mp4
//   node tools/render.mjs --fps 30 --sub 1 --scale 0.5 --name preview   (aperçu rapide)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = { fps: 60, sub: 4, shutter: 0.5, workers: 3, scale: 1, from: 0, to: null, name: 'releve-motion', url: 'http://localhost:8790/src/index.html' };
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i].replace(/^--/, ''), v = process.argv[i + 1];
  opt[k] = Number.isNaN(Number(v)) ? v : Number(v);
}
const W = Math.round(1920 * opt.scale), H = Math.round(1080 * opt.scale);
const chunkDir = path.join(root, 'out', `chunks-${opt.name}`);
fs.rmSync(chunkDir, { recursive: true, force: true });
fs.mkdirSync(chunkDir, { recursive: true });

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const probe = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await probe.goto(opt.url);
await probe.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 60000 });
const duration = await probe.evaluate(() => window.DURATION);
await probe.close();
const t1 = opt.to ?? duration;
const F0 = Math.round(opt.from * opt.fps), F1 = Math.round(t1 * opt.fps);
const total = F1 - F0;
console.log(`rendu ${opt.name} : ${total} images (${opt.fps} i/s, ${opt.sub} sous-images, ${W}x${H}), ${opt.workers} travailleurs`);

let done = 0;
const tStart = Date.now();
function progress() {
  done++;
  if (done % 60 === 0 || done === total) {
    const el = (Date.now() - tStart) / 1000, eta = el / done * (total - done);
    process.stdout.write(`\r  ${done}/${total} images · ${el.toFixed(0)} s écoulées · reste ~${eta.toFixed(0)} s   `);
  }
}

async function worker(w, f0, f1) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: opt.scale });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`\n[${w}] pageerror:`, e.message));
  await page.goto(opt.url);
  await page.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.BOOT_ERROR);
  if (err) throw new Error(err);
  const cdp = await ctx.newCDPSession(page);
  const out = path.join(chunkDir, `${String(w).padStart(2, '0')}.mkv`);
  const vf = opt.sub > 1
    ? `tmix=frames=${opt.sub},select='eq(mod(n\\,${opt.sub})\\,${opt.sub - 1})',setpts=N/${opt.fps}/TB`
    : `setpts=N/${opt.fps}/TB`;
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(opt.fps * opt.sub), '-c:v', 'png', '-i', '-',
    '-vf', vf, '-r', String(opt.fps), '-c:v', 'libx264', '-preset', 'ultrafast', '-qp', '0', '-pix_fmt', 'yuv444p', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${w} : code ${c}`)))));
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once('drain', res)));
  for (let f = f0; f < f1; f++) {
    for (let s = 0; s < opt.sub; s++) {
      const off = opt.sub > 1 ? ((s + 0.5) / opt.sub - 0.5) * opt.shutter : 0;
      const t = Math.max(0, (f + off) / opt.fps) + 1e-6;
      await page.evaluate((tt) => window.renderFrame(tt), t);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false });
      await write(Buffer.from(data, 'base64'));
    }
    progress();
  }
  ff.stdin.end();
  await ffDone;
  await ctx.close();
  return out;
}

const per = Math.ceil(total / opt.workers);
const jobs = [];
for (let w = 0; w < opt.workers; w++) {
  const a = F0 + w * per, b = Math.min(F1, a + per);
  if (a < b) jobs.push(worker(w, a, b));
}
const chunks = await Promise.all(jobs);
await browser.close();
console.log(`\nimages rendues en ${((Date.now() - tStart) / 1000).toFixed(0)} s`);
fs.writeFileSync(path.join(chunkDir, 'list.txt'), chunks.map((c) => `file '${c}'`).join('\n'));
console.log(path.join(chunkDir, 'list.txt'));
