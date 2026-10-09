/* Relevé : service worker (hors ligne + notifications push). Script classique, à la racine de site/
   pour couvrir tout le scope (« ./ », sous-chemin GitHub Pages compris).

   Stratégie (un mélange ancienne/nouvelle version a déjà donné une page blanche : on ne le permet plus) :
   - HTML, JS, CSS, manifeste et data/*.json : RÉSEAU D'ABORD, revalidé (cache HTTP contourné par
     « no-cache » : ETag, donc 304 bon marché), copie mise en cache ; le cache ne sert que hors ligne.
   - Icônes et polices : cache d'abord (fichiers stables).
   - Tout le reste (Supabase, bibliothèque de connexion, images produits) : jamais intercepté ni mis en cache.
   Changer VERSION purge les anciens caches à l'activation. */
const VERSION = '2026-10-09.2';
const CACHE = `releve-${VERSION}`;
const SCOPE = self.registration.scope; // ex. https://mattrvfl.github.io/Trend-Radar/
const ORIGIN = self.location.origin;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Coquille de l'application, mise en cache dès l'installation pour rouvrir le dernier relevé hors ligne.
// Chaque fichier est ajouté séparément : un oubli ou une absence n'empêche pas l'installation.
const SHELL = [
  './', 'manifest.webmanifest',
  'assets/css/tokens.css', 'assets/css/base.css', 'assets/css/layout.css', 'assets/css/components.css', 'assets/css/pages.css',
  'assets/js/theme-init.js', 'assets/js/main.js', 'assets/js/router.js', 'assets/js/data.js', 'assets/js/format.js',
  'assets/js/escape.js', 'assets/js/auth.js', 'assets/js/config.js', 'assets/js/device.js', 'assets/js/pwa.js', 'assets/js/push.js',
  'assets/js/views/today.js', 'assets/js/views/rankings.js', 'assets/js/views/stores.js', 'assets/js/views/tiktok.js',
  'assets/js/views/buzz.js', 'assets/js/views/method.js', 'assets/js/views/articles.js', 'assets/js/views/account.js',
  'assets/js/views/privacy.js', 'assets/js/views/profit.js',
  'assets/js/components/ui.js', 'assets/js/components/delta.js', 'assets/js/components/score.js', 'assets/js/components/coverage.js',
  'assets/js/components/source.js', 'assets/js/components/segmented.js', 'assets/js/components/period.js',
  'assets/js/components/status.js', 'assets/js/components/row.js', 'assets/js/components/card.js', 'assets/js/components/tip.js',
  'assets/js/components/states.js', 'assets/js/components/panel.js', 'assets/js/components/push-ui.js',
  'assets/js/charts/sparkline.js', 'assets/js/charts/rank-chart.js',
  'assets/icons/icon-192.png', 'assets/icons/badge-96.png', 'assets/icons/favicon.svg',
  'data/meta.json', 'data/latest.json',
];

const abs = (p) => new URL(p, SCOPE).href;
const inScope = (u) => typeof u === 'string' && u.startsWith(SCOPE);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(async (p) => {
      try {
        const res = await fetch(abs(p), { cache: 'no-cache' });
        if (res.ok) await cache.put(abs(p), res);
      } catch { /* hors ligne ou fichier absent : sera mis en cache à la première visite */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('releve-') && k !== CACHE).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch { /* sans importance */ }
    }
    await self.clients.claim();
  })());
});

/** Réponse issue d'une redirection : recopiée, sinon refusée pour une navigation (redirect: manual). */
function clean(res) {
  if (!res.redirected) return res;
  return res.blob().then((body) => new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }));
}

async function networkFirst(request, key) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = request.mode === 'navigate'
      ? await fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
      : await fetch(new Request(request, { cache: 'no-cache' }));
    // Une navigation ne met en cache que de l'HTML : un fichier téléchargé (.zip…) ne remplace jamais la page.
    const isHTML = /text\/html/.test(fresh.headers.get('content-type') || '');
    if (fresh.ok && fresh.type === 'basic' && (request.mode !== 'navigate' || isHTML)) {
      const res = await clean(fresh);
      await cache.put(key, res.clone());
      return res;
    }
    if (fresh.ok || fresh.status === 304) return fresh;
    // Erreur HTTP (404…) : on la rend telle quelle, sauf une navigation qu'on sait encore servir.
    const cached = request.mode === 'navigate' ? await cache.match(key) : null;
    return cached || fresh;
  } catch (err) {
    const cached = await cache.match(key) || (request.mode === 'navigate' ? await cache.match(SCOPE) : null);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') await cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === ORIGIN) {
    if (!inScope(req.url)) return;
    if (req.mode === 'navigate') {
      // Toutes les vues sont des routes hash de la même page : une seule entrée de cache (sans ?code=…).
      // Les autres adresses (releve-extension.zip…) vont directement au réseau.
      if (url.href.split(/[?#]/)[0] !== SCOPE && !url.pathname.endsWith('/index.html')) return;
      event.respondWith(networkFirst(req, SCOPE));
      return;
    }
    if (url.pathname.includes('/assets/icons/')) { event.respondWith(cacheFirst(req)); return; }
    if (/\.(?:js|css|json|webmanifest|html)$/.test(url.pathname) || url.pathname.endsWith('/')) {
      event.respondWith(networkFirst(req, url.origin + url.pathname));
    }
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    // Feuille Google Fonts : réseau d'abord (elle change selon le navigateur) ; fichiers de police : cache d'abord.
    event.respondWith(url.hostname === 'fonts.gstatic.com' ? cacheFirst(req) : networkFirst(req, req.url));
  }
  // Supabase, jsDelivr, images produits : pas d'interception, jamais en cache.
});

// ---- Notifications push : { title, body, url, tag } envoyé par collector/push.py ----
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** URL de destination : uniquement dans le scope de l'application (sinon l'accueil). */
function target(u) {
  try {
    const x = new URL(String(u || ''), SCOPE);
    return x.origin === ORIGIN && inScope(x.href) ? x.href : SCOPE;
  } catch {
    return SCOPE;
  }
}

self.addEventListener('push', (event) => {
  let d = {};
  if (event.data) {
    try { d = event.data.json() || {}; } catch { d = { body: event.data.text() }; }
  }
  const title = text(d.title, 120) || 'Relevé';
  const tag = text(d.tag, 120);
  const options = {
    body: text(d.body, 300),
    icon: abs('assets/icons/icon-192.png'),
    badge: abs('assets/icons/badge-96.png'),
    lang: 'fr',
    dir: 'ltr',
    data: { url: target(d.url) },
  };
  if (tag) { options.tag = tag; options.renotify = true; }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = target(event.notification.data && event.notification.data.url);
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mine = wins.filter((c) => inScope(c.url));
    const win = mine.find((c) => c.focused) || mine.find((c) => c.visibilityState === 'visible') || mine[0];
    if (win) {
      try { await win.focus(); } catch { /* focus refusé : on navigue quand même */ }
      const sameDoc = win.url.split('#')[0] === url.split('#')[0];
      if (sameDoc) {
        // Même page, autre route hash : l'application change de vue sans recharger (main.js écoute ce message).
        win.postMessage({ type: 'releve:navigate', url });
        return;
      }
      try { if (await win.navigate(url)) return; } catch { /* fenêtre non contrôlée */ }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
