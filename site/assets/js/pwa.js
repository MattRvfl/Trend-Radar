// Application installable : service worker, encart « Ajouter à l'écran d'accueil », navigation demandée
// par une notification. Tout échec ici est silencieux : le site fonctionne sans.
import { html } from './escape.js';
import { icon } from './components/ui.js';
import { isIOS, isIOSSafari, isStandalone } from './device.js';

const LOCAL = ['localhost', '127.0.0.1', '[::1]'];
const DISMISS = 'releve.install-off';
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};

let regP = null;
/** Enregistre sw.js (https ou localhost) ; résout la registration, ou null si impossible. */
export function swRegistration() {
  if (!regP) {
    const ok = 'serviceWorker' in navigator && (location.protocol === 'https:' || LOCAL.includes(location.hostname));
    regP = !ok ? Promise.resolve(null)
      : navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).catch((e) => {
        console.warn('Service worker non enregistré :', e && e.message);
        return null;
      });
  }
  return regP;
}

/** Clic sur une notification alors que l'application est déjà ouverte : le service worker demande la route. */
function listenToWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.type !== 'releve:navigate' || typeof d.url !== 'string') return;
    let u;
    try { u = new URL(d.url, location.href); } catch { return; }
    if (u.origin !== location.origin || u.pathname !== location.pathname) return;
    if (location.hash !== u.hash) location.hash = u.hash || '#/';
    window.focus();
  });
}

// ---- Encart d'installation ----
/** Icône « Partager » d'iOS (carré ouvert, flèche vers le haut), dans le sprite #i-share. */
export const shareIcon = () => html`${icon('i-share', 'ic-inline')}<span class="sr-only"> (carré avec une flèche vers le haut)</span>`;
const appleDevice = () => (/iPad|Macintosh/.test(navigator.userAgent) ? 'iPad' : 'iPhone');

let deferred = null;

function hide(host, remember) {
  if (remember) ls.set(DISMISS, String(Date.now()));
  const hadFocus = host.contains(document.activeElement);
  host.innerHTML = '';
  if (hadFocus) document.getElementById('app').focus();
}

function render(host, kind) {
  const body = kind === 'ios'
    ? html`<p>Ajoutez Relevé à votre écran d'accueil : touchez Partager ${shareIcon()} puis « Sur l'écran d'accueil ». <span class="muted">Nécessaire pour recevoir les notifications sur ${appleDevice()}.</span></p>`
    : html`<p>Installez Relevé sur cet appareil : il s'ouvre comme une application et peut vous prévenir chaque lundi.</p>
<button type="button" class="btn" data-install>Installer l'application</button>`;
  host.innerHTML = String(html`<div class="container"><aside class="c-install" aria-label="Installer Relevé">
<img class="inst-ic" src="assets/icons/icon-192.png" width="40" height="40" alt="">
<div class="inst-body">${body}</div>
<button type="button" class="icon-btn inst-close" data-install-close aria-label="Fermer ce conseil">${icon('i-close')}</button></aside></div>`);
  host.querySelector('[data-install-close]').addEventListener('click', () => hide(host, true));
  const go = host.querySelector('[data-install]');
  if (go) {
    go.addEventListener('click', async () => {
      if (!deferred) { hide(host, false); return; }
      const ev = deferred;
      deferred = null;
      go.disabled = true;
      try {
        ev.prompt();
        const choice = await ev.userChoice;
        hide(host, choice && choice.outcome !== 'accepted');
      } catch {
        hide(host, false);
      }
    });
  }
}

function initInstall(host) {
  if (!host || isStandalone()) return;
  window.addEventListener('appinstalled', () => { deferred = null; hide(host, false); });
  if (ls.get(DISMISS)) return;
  if (isIOS()) {
    if (isIOSSafari()) render(host, 'ios');
    return;
  }
  // Android, Chrome, Edge : le navigateur annonce qu'il peut installer ; on remplace sa mini-barre par l'encart.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (!ls.get(DISMISS) && !isStandalone()) render(host, 'prompt');
  });
}

/** Démarrage : jamais bloquant, jamais d'exception. */
export function initPWA() {
  try {
    listenToWorker();
    initInstall(document.getElementById('install'));
  } catch (e) {
    console.warn(e);
  }
  return swRegistration();
}
