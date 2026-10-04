// Notifications : section « Notifications sur cet appareil » (Mon compte) et encart « Être prévenu
// chaque lundi » (Articles, utilisable sans compte). Messages d'état honnêtes selon l'appareil.
import { html, fr } from '../escape.js';
import { icon } from './ui.js';
import { isIOS, isAndroid, isStandalone } from '../device.js';
import { shareIcon } from '../pwa.js';
import { humanize, cachedSession } from '../auth.js';
import * as push from '../push.js';

const TOPIC_LABELS = {
  article: ['Article de la semaine (lundi)', 'Dès sa parution, avec le titre et le résumé.'],
  rush: ['Ruées détectées', "Quand une marque occupe soudain une grande part des meilleures ventes d'une catégorie."],
};
const MARKET_LABELS = { FR: 'France', US: 'États-Unis' };
const apple = () => (/iPad|Macintosh/.test(navigator.userAgent) ? 'iPad' : 'iPhone');

/** Comment réautoriser, selon l'appareil. */
function deniedHelp() {
  if (isIOS()) return html`Les notifications sont bloquées pour Relevé. Pour les réautoriser : Réglages › Notifications › Relevé › Autoriser les notifications, puis rouvrez Relevé.`;
  if (isAndroid()) {
    return isStandalone()
      ? html`Les notifications sont bloquées pour Relevé. Pour les réautoriser : appui long sur l'icône Relevé › Infos sur l'appli › Notifications › Autoriser, puis rouvrez Relevé.`
      : html`Les notifications sont bloquées pour ce site. Pour les réautoriser : touchez l'icône à gauche de l'adresse › Autorisations › Notifications › Autoriser, puis rechargez la page.`;
  }
  return html`Les notifications sont bloquées pour ce site. Pour les réautoriser : cliquez sur l'icône à gauche de l'adresse (cadenas ou réglages) › Notifications › Autoriser, puis rechargez la page.`;
}

/** Texte d'état hors on/off (null si l'action est possible). */
function blockedText(state) {
  if (state === 'unavailable') return html`Les notifications ne sont pas encore ouvertes sur Relevé.`;
  if (state === 'ios-install') {
    return html`Ajoutez d'abord Relevé à l'écran d'accueil (iOS 16.4 ou plus récent) : sur ${apple()}, les notifications ne fonctionnent que dans l'application installée. Touchez Partager ${shareIcon()} puis « Sur l'écran d'accueil », puis ouvrez Relevé depuis son icône.`;
  }
  if (state === 'unsupported') {
    return isIOS()
      ? html`Cette version d'iOS ne permet pas les notifications web : il faut iOS 16.4 ou plus récent.`
      : html`Ce navigateur ne permet pas de recevoir des notifications. Essayez un navigateur récent : Chrome, Edge, Firefox ou Safari.`;
  }
  if (state === 'denied') return deniedHelp();
  return null;
}

/** Erreur d'activation → phrase française. */
function enableError(e) {
  const code = e && e.code;
  if (code === 'dismissed') return "Autorisation non accordée : rien n'a été activé.";
  if (code === 'subscribe') return "Le service de notifications du navigateur n'a pas répondu. Réessayez dans un instant.";
  if (code === 'unsupported') return "Ce navigateur ne permet pas de recevoir des notifications.";
  if (code === 'empty-choice') return 'Choisissez au moins un sujet et un marché.';
  return `Non enregistré. ${humanize(e)}`;
}

const note = (content) => html`<p class="c-note is-info push-note">${icon('i-info')}<span>${content}</span></p>`;

// ---- Mon compte : section complète ----
export const renderPushSection = () => html`<section class="acc-sec push-sec" aria-labelledby="push-h" data-push-sec><h2 id="push-h">Notifications sur cet appareil</h2>
<p class="muted">Un message sur ce téléphone ou cet ordinateur, même Relevé fermé. Le réglage vaut pour cet appareil seulement.</p>
<div class="switch-row"><label for="push-switch"><span class="check-title">Recevoir les notifications</span><span class="check-hint" id="push-hint">Vérification…</span></label>
<input type="checkbox" role="switch" class="switch" id="push-switch" aria-describedby="push-hint" disabled></div>
<div class="push-blocked" hidden></div>
<div class="push-prefs">
<fieldset class="mk-pick"><legend>Sujets</legend><div class="push-topics">${push.TOPICS.map((t) => html`<label class="check"><input type="checkbox" name="push-topic" value="${t}"><span><span class="check-title">${TOPIC_LABELS[t][0]}</span><span class="check-hint">${TOPIC_LABELS[t][1]}</span></span></label>`)}</div></fieldset>
<fieldset class="mk-pick"><legend>Marchés</legend><div class="mk-opts">${push.MARKETS.map((m) => html`<label class="check"><input type="checkbox" name="push-market" value="${m}"><span>${MARKET_LABELS[m]}</span></label>`)}</div>
<p class="check-hint">Au moins un sujet et un marché.</p></fieldset></div>
<p class="save-status" id="push-status" role="status"></p></section>`;

export function mountPushSection(root) {
  const sec = root.querySelector('[data-push-sec]');
  if (!sec) return;
  const sw = sec.querySelector('#push-switch');
  const hint = sec.querySelector('#push-hint');
  const blocked = sec.querySelector('.push-blocked');
  const prefsBox = sec.querySelector('.push-prefs');
  const status = sec.querySelector('#push-status');
  const topics = [...sec.querySelectorAll('input[name="push-topic"]')];
  const markets = [...sec.querySelectorAll('input[name="push-market"]')];
  const show = (text, bad = false) => { status.textContent = fr(text); status.classList.toggle('is-error', bad); };
  const choice = () => ({ topics: topics.filter((b) => b.checked).map((b) => b.value), markets: markets.filter((b) => b.checked).map((b) => b.value) });
  const lock = (on) => [sw, ...topics, ...markets].forEach((i) => { i.disabled = on; });
  let state = null;

  function paint(s) {
    state = s;
    const p = push.readPrefs();
    topics.forEach((b) => { b.checked = p.topics.includes(b.value); });
    markets.forEach((b) => { b.checked = p.markets.includes(b.value); });
    const why = blockedText(s);
    blocked.hidden = !why;
    blocked.innerHTML = why ? String(note(why)) : '';
    prefsBox.hidden = s === 'unavailable' || s === 'unsupported' || s === 'ios-install';
    sw.checked = s === 'on';
    lock(false);
    sw.disabled = s !== 'on' && s !== 'off';
    hint.textContent = fr(s === 'on' ? 'Activées sur cet appareil.' : s === 'off' ? 'Désactivées sur cet appareil.' : 'Indisponibles sur cet appareil.');
  }

  sw.addEventListener('change', () => {
    if (sw.checked) {
      const c = choice();
      if (!c.topics.length || !c.markets.length) { sw.checked = false; show('Choisissez au moins un sujet et un marché.', true); return; }
      const p = push.enable(c); // geste utilisateur : la demande d'autorisation part tout de suite
      lock(true);
      show('Activation…');
      p.then(() => { paint('on'); show('Notifications activées sur cet appareil.'); }, async (e) => {
        if (e && e.code !== 'denied' && e.code !== 'dismissed') console.error(e);
        paint(await push.getState().catch(() => 'off'));
        show(e && e.code === 'denied' ? 'Autorisation refusée par le navigateur.' : enableError(e), true);
      });
    } else {
      lock(true);
      show('Désactivation…');
      push.disable().then((ok) => {
        paint('off');
        show(ok ? 'Notifications désactivées sur cet appareil.' : 'Désactivées sur cet appareil. Le serveur sera prévenu au prochain envoi.');
      }, async (e) => {
        console.error(e);
        paint(await push.getState().catch(() => 'off'));
        show(`La désactivation n'a pas abouti. ${humanize(e)}`, true);
      });
    }
  });

  const onPref = (b, list) => () => {
    const c = choice();
    if (!c.topics.length || !c.markets.length) {
      b.checked = true;
      show(list === topics ? 'Gardez au moins un sujet.' : 'Gardez au moins un marché.', true);
      return;
    }
    lock(true);
    show(state === 'on' ? 'Enregistrement…' : '');
    push.update(c).then(() => {
      lock(false);
      sw.disabled = state !== 'on' && state !== 'off';
      show(state === 'on' ? 'Préférences enregistrées.' : "Préférences retenues : elles s'appliqueront à l'activation.");
    }, (e) => {
      b.checked = !b.checked;
      lock(false);
      sw.disabled = state !== 'on' && state !== 'off';
      show(`Non enregistré. ${humanize(e)}`, true);
    });
  };
  topics.forEach((b) => b.addEventListener('change', onPref(b, topics)));
  markets.forEach((b) => b.addEventListener('change', onPref(b, markets)));

  push.getState().then(paint, () => paint('unsupported'));
}

// ---- Articles : encart « Être prévenu chaque lundi » (sans compte) ----
export const renderPushCta = () => html`<aside class="push-cta" aria-labelledby="push-cta-title" data-push-cta>
<div class="push-cta-head">${icon('i-bell', 'push-ic')}<h2 class="h3" id="push-cta-title">Être prévenu chaque lundi</h2></div>
<p class="push-cta-text">Une notification sur cet appareil dès que l'article de la semaine paraît. Sans compte, sans e-mail.</p>
<div class="push-cta-act"></div>
<p class="save-status" role="status"></p></aside>`;

export function mountPushCta(root, market) {
  const box = root.querySelector('[data-push-cta]');
  if (!box) return;
  const text = box.querySelector('.push-cta-text');
  const act = box.querySelector('.push-cta-act');
  const status = box.querySelector('[role="status"]');
  const show = (t, bad = false) => { status.textContent = fr(t); status.classList.toggle('is-error', bad); };
  const intro = "Une notification sur cet appareil dès que l'article de la semaine paraît. Sans compte, sans e-mail.";

  function paint(s) {
    if (s === 'unavailable') { box.hidden = true; return; }
    box.hidden = false;
    const why = blockedText(s);
    const p = push.readPrefs();
    if (why) {
      text.innerHTML = String(why);
      act.innerHTML = '';
      return;
    }
    if (s === 'on') {
      const withArticle = p.topics.includes('article');
      text.textContent = fr(withArticle
        ? 'Activées sur cet appareil : vous serez prévenu à la parution de chaque article.'
        : "Activées sur cet appareil, pour les ruées seulement : l'article du lundi n'est pas coché.");
      act.innerHTML = String(html`${withArticle ? '' : html`<button type="button" class="btn" data-push-add>Recevoir aussi l'article du lundi</button>`}<button type="button" class="btn" data-push-off>Désactiver</button>${
        cachedSession() ? html`<a class="btn-ghost" href="#/compte">Sujets et marchés</a>` : ''}`);
    } else {
      text.textContent = fr(intro);
      act.innerHTML = String(html`<button type="button" class="btn" data-push-on>${icon('i-bell')}Activer les notifications</button>`);
    }
  }

  act.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const p = push.readPrefs();
    let job;
    if (b.matches('[data-push-on]')) {
      job = push.enable({ topics: ['article'], markets: [market] }) // geste utilisateur : autorisation demandée tout de suite
        .then(() => { paint('on'); show('Notifications activées. Prochain article : lundi.'); });
    } else if (b.matches('[data-push-add]')) {
      job = push.update({ ...p, topics: [...new Set([...p.topics, 'article'])] }).then(() => { paint('on'); show("Ajouté : l'article du lundi."); });
    } else if (b.matches('[data-push-off]')) {
      job = push.disable().then(() => { paint('off'); show('Notifications désactivées sur cet appareil.'); });
    } else return;
    act.querySelectorAll('button').forEach((x) => { x.disabled = true; });
    job.then(() => {
      const first = act.querySelector('button');
      if (first) first.focus();
    }, async (err) => {
      if (err && err.code !== 'denied' && err.code !== 'dismissed') console.error(err);
      paint(await push.getState().catch(() => 'off'));
      show(err && err.code === 'denied' ? 'Autorisation refusée par le navigateur.' : enableError(err), true);
    });
  });

  push.getState().then(paint, () => paint('unsupported'));
}
