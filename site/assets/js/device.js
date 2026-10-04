// Type d'appareil, lu localement pour adapter l'écran (connexion, installation, notifications).
// Rien n'est enregistré ni envoyé : ce n'est pas un traceur, aucun consentement n'est nécessaire.
const ua = () => (typeof navigator !== 'undefined' && navigator.userAgent) || '';

/** iPhone, iPod, iPad, y compris iPadOS qui se présente comme un Mac (écran tactile). */
export const isIOS = () => /iPhone|iPad|iPod/.test(ua()) || (/Macintosh/.test(ua()) && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/i.test(ua());

/** Lancé depuis l'écran d'accueil (application installée). */
export function isStandalone() {
  if (typeof navigator !== 'undefined' && navigator.standalone === true) return true;
  try { return window.matchMedia('(display-mode: standalone)').matches; } catch { return false; }
}

/** Téléphone ou tablette, ou application installée : la connexion passe par un code plutôt que par un lien. */
export const isMobile = () => isIOS() || isAndroid() || isStandalone();

/** Safari sur iPhone/iPad (pas Chrome, Firefox, Edge… ni le navigateur intégré d'une autre application). */
export const isIOSSafari = () => isIOS() && /Safari\//.test(ua())
  && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|GSA\/|FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|LinkedInApp/.test(ua());
