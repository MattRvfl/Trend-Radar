// Comptes : connexion (#/connexion), Mon compte (#/compte), désinscription en un clic (#/desinscription?t=…).
import { html, fr } from '../escape.js';
import { dFull, time, parisDay } from '../format.js';
import { renderEmpty, renderError, renderNote } from '../components/states.js';
import { icon } from '../components/ui.js';
import { renderPushSection, mountPushSection } from '../components/push-ui.js';
import { isMobile } from '../device.js';
import { disable as disablePush } from '../push.js';
import {
  isConfigured, getSession, takeFlash, setIntent, enabledProviders, PROVIDERS, signInWithProvider, signInWithEmail,
  verifyEmailCode, humanizeCode, applyIntent, getProfile, updateProfile, deleteAccount, unsubscribe, isToken, humanize,
} from '../auth.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PROVIDER_LABEL = { google: 'Google', github: 'GitHub', azure: 'Microsoft', discord: 'Discord', email: 'un lien par e-mail' };
const MARKETS = [['FR', 'France'], ['US', 'États-Unis']];

const page = (inner, cls = '') => html`<div class="container page narrow auth ${cls}">${inner}</div>`;
const head = (title, lede) => html`<div class="page-head"><h1 tabindex="-1">${title}</h1>${lede ? html`<p class="lede">${lede}</p>` : ''}</div>`;
const founder = () => html`<div class="founder">${icon('i-star', 'founder-ic')}<p><strong>Membre fondateur</strong> : inscrivez-vous maintenant, un an offert le jour où Relevé deviendra payant.</p></div>`;
const legal = () => html`<p class="auth-legal">Votre adresse sert uniquement à votre compte et, si vous le demandez, à l'envoi de l'article hebdo. Aucune publicité, aucune revente. <a href="#/confidentialite">Confidentialité et données personnelles</a></p>`;
const notConfigured = () => renderEmpty({
  ic: 'i-user',
  title: "La connexion n'est pas encore activée",
  text: 'Les comptes et la newsletter ouvrent bientôt. En attendant, tout le site reste consultable sans compte.',
  action: html`<a class="btn" href="#/articles">Voir les articles</a>`,
});
/** « 3 octobre 2026 à 14:02 » (heure de Paris). */
const when = (ts, withTime = true) => {
  const d = new Date(ts || NaN);
  if (Number.isNaN(d.getTime())) return '';
  return `${dFull(parisDay(d))}${withTime ? ` à ${time(ts)}` : ''}`;
};

// ---- Connexion ----
export async function connexion() {
  const title = 'Se connecter';
  const h = head('Se connecter', 'Un compte gratuit, sans mot de passe, pour recevoir l’article hebdo et gérer vos préférences.');
  if (!isConfigured()) return { title, html: page(html`${h}${founder()}${notConfigured()}${legal()}`) };
  let s;
  let ext;
  try { [s, ext] = await Promise.all([getSession(), enabledProviders()]); } catch (e) {
    console.error(e);
    return { title, html: page(html`${h}${renderError('Le service de connexion')}`) };
  }
  if (s) return { redirect: '#/compte' };
  const flash = takeFlash();
  setIntent(false); // formulaire neuf : aucune intention d'inscription n'est présumée
  const shown = PROVIDERS.filter((p) => !ext || ext[p.id] === true);
  const emailOn = !ext || ext.email !== false;
  if (!shown.length && !emailOn) return { title, html: page(html`${h}${founder()}${notConfigured()}${legal()}`) };

  const buttons = shown.length ? html`<div class="providers">${shown.map((p) => html`<button type="button" class="btn btn-provider" data-provider="${p.id}">${
    icon(`pv-${p.id}`, 'pv-ic')}<span>Continuer avec ${p.label}</span></button>`)}</div>` : '';
  // Téléphone, tablette ou application installée : un code à saisir (le lien s'ouvrirait souvent dans un
  // autre navigateur que celui-ci). Ordinateur : le lien, avec le code en recours.
  const mobile = isMobile();
  const form = emailOn ? html`<form class="otp" novalidate aria-labelledby="otp-title">
<h2 class="h3" id="otp-title">${mobile ? 'Recevoir un code de connexion par e-mail' : 'Recevoir un lien de connexion par e-mail'}</h2>
<label class="field-label" for="otp-email">Adresse e-mail</label>
<input class="field" id="otp-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required aria-describedby="otp-help otp-err">
<p class="field-err" id="otp-err"></p>
<p class="field-help" id="otp-help">${mobile
    ? fr('Vous recevrez un e-mail avec un code à 6 chiffres (et un lien) : saisissez le code ici, sans quitter Relevé.')
    : 'Un lien valable une heure, à ouvrir dans ce même navigateur.'}</p>
<button class="btn-primary" type="submit">${mobile ? 'Recevoir le code' : 'Recevoir le lien'}</button></form>
${mobile ? '' : html`<div class="otp-sent" hidden tabindex="-1">${icon('i-mail', 'sent-ic')}<div><p class="state-title">Lien envoyé</p>
<p>Un e-mail part vers <strong class="sent-email"></strong>. Il contient un lien et un code. <strong>Ouvrez le lien dans ce même navigateur</strong> : sinon la connexion échouera. Il expire au bout d'une heure.</p>
<p class="muted">Rien reçu d'ici quelques minutes ? Regardez dans les courriers indésirables.</p>
<button type="button" class="link-btn" data-code-show aria-expanded="false" aria-controls="otp-code-form">Vous avez reçu un code ? Saisissez-le</button>
<button type="button" class="btn" data-otp-reset>Utiliser une autre adresse</button></div></div>`}
<form class="otp otp-code" id="otp-code-form" novalidate hidden aria-labelledby="code-title">
<h2 class="h3" id="code-title" tabindex="-1">Saisissez le code reçu par e-mail</h2>
${mobile ? html`<p class="field-help" id="code-sent">Envoyé à <strong class="sent-email"></strong>. L'e-mail contient un code et un lien : ici, le code est le plus sûr, car le lien peut s'ouvrir dans un autre navigateur. Le code expire au bout d'une heure.</p>` : ''}
<label class="field-label" for="otp-code">Code à 6 chiffres</label>
<input class="field code-field num" id="otp-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" autocapitalize="off" spellcheck="false" aria-describedby="${mobile ? 'code-sent code-err' : 'code-err'}">
<p class="field-err" id="code-err"></p>
<button class="btn-primary" type="submit">Se connecter</button>
<div class="code-actions"><button type="button" class="btn-ghost" data-code-resend>Renvoyer le code</button>${mobile ? html`<button type="button" class="btn-ghost" data-code-edit>Modifier l'adresse</button>` : ''}</div>
${mobile ? html`<p class="muted small">Rien reçu d'ici quelques minutes ? Regardez dans les courriers indésirables.</p>` : ''}
<p class="save-status" id="code-status" role="status"></p></form>` : '';

  return {
    title,
    html: page(html`${h}${flash ? renderNote('warn', flash) : ''}${founder()}
<div class="auth-card">
<label class="check" for="nl-intent"><input type="checkbox" id="nl-intent"><span><span class="check-title">Recevoir l'article hebdo chaque lundi</span><span class="check-hint">Facultatif. Désinscription en un clic dans chaque e-mail.</span></span></label>
${buttons}${buttons && form ? html`<p class="or" aria-hidden="true"><span>ou</span></p>` : ''}${form}
<p class="form-msg" role="alert"></p></div>${legal()}`),
    after: (root) => mountConnexion(root, mobile),
  };
}

const CODE = /^\d{6,8}$/; // longueur réglable dans Supabase (6 par défaut)
const RESEND_WAIT = 60;

function mountConnexion(root, mobile) {
  const cb = root.querySelector('#nl-intent');
  const msg = root.querySelector('.form-msg');
  const card = root.querySelector('.auth-card');
  const lock = (on) => card.querySelectorAll('button, input').forEach((el) => { el.disabled = on; });
  card.querySelectorAll('[data-provider]').forEach((b) => b.addEventListener('click', async () => {
    msg.textContent = '';
    setIntent(cb.checked);
    lock(true);
    b.setAttribute('aria-busy', 'true');
    try {
      await signInWithProvider(b.dataset.provider); // le navigateur part chez le fournisseur
    } catch (e) {
      setIntent(false);
      lock(false);
      b.removeAttribute('aria-busy');
      msg.textContent = humanize(e);
      b.focus();
    }
  }));

  const form = root.querySelector('form.otp:not(.otp-code)');
  if (!form) return;
  const input = form.querySelector('#otp-email');
  const err = form.querySelector('#otp-err');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = submit.textContent;
  const sent = root.querySelector('.otp-sent'); // ordinateur seulement
  const codeForm = root.querySelector('form.otp-code');
  const code = codeForm.querySelector('#otp-code');
  const codeErr = codeForm.querySelector('#code-err');
  const codeGo = codeForm.querySelector('[type="submit"]');
  const resend = codeForm.querySelector('[data-code-resend]');
  const codeStatus = codeForm.querySelector('#code-status');
  const showCode = root.querySelector('[data-code-show]');
  let email = '';
  let timer = null;

  // « Renvoyer le code » : attente de 60 s (c'est aussi le délai imposé par Supabase entre deux envois).
  function cooldown() {
    clearInterval(timer);
    let left = RESEND_WAIT;
    const tick = () => {
      if (!root.isConnected) { clearInterval(timer); return; }
      resend.disabled = left > 0;
      resend.textContent = left > 0 ? `Renvoyer le code (${left} s)` : 'Renvoyer le code';
      if (left <= 0) clearInterval(timer);
      left -= 1;
    };
    tick();
    timer = setInterval(tick, 1000);
  }
  const setSent = (addr) => root.querySelectorAll('.sent-email').forEach((s) => { s.textContent = addr; });
  const resetCode = () => {
    code.value = '';
    code.removeAttribute('aria-invalid');
    codeErr.textContent = '';
    codeStatus.textContent = '';
  };

  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') && EMAIL.test(input.value.trim())) { input.removeAttribute('aria-invalid'); err.textContent = ''; }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const addr = input.value.trim();
    if (!EMAIL.test(addr)) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = fr('Saisissez une adresse e-mail valide, par exemple nom@exemple.fr.');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    err.textContent = '';
    setIntent(cb.checked);
    lock(true);
    submit.textContent = 'Envoi…';
    try {
      await signInWithEmail(addr);
      email = addr;
      lock(false);
      form.hidden = true;
      setSent(addr);
      resetCode();
      cooldown();
      if (mobile) {
        card.classList.add('is-code'); // une seule chose à faire : saisir le code
        codeForm.hidden = false;
        code.focus();
      } else {
        codeForm.hidden = true;
        showCode.setAttribute('aria-expanded', 'false');
        sent.hidden = false;
        sent.focus();
      }
    } catch (x) {
      setIntent(false);
      lock(false);
      msg.textContent = humanize(x);
      input.focus();
    } finally {
      submit.textContent = submitLabel;
    }
  });

  const backToEmail = () => {
    clearInterval(timer);
    card.classList.remove('is-code');
    if (sent) sent.hidden = true;
    codeForm.hidden = true;
    form.hidden = false;
    msg.textContent = '';
    input.select();
    input.focus();
  };
  if (sent) sent.querySelector('[data-otp-reset]').addEventListener('click', backToEmail);
  const edit = codeForm.querySelector('[data-code-edit]');
  if (edit) edit.addEventListener('click', backToEmail);
  if (showCode) {
    showCode.addEventListener('click', () => {
      const open = codeForm.hidden;
      codeForm.hidden = !open;
      showCode.setAttribute('aria-expanded', String(open));
      if (open) code.focus();
    });
  }

  // Chiffres seulement : un code collé « 123 456 » ou « 123-456 » est nettoyé.
  code.addEventListener('input', () => {
    const v = code.value.replace(/\D/g, '').slice(0, 8);
    if (v !== code.value) code.value = v;
    if (code.getAttribute('aria-invalid') && CODE.test(v)) { code.removeAttribute('aria-invalid'); codeErr.textContent = ''; }
  });
  codeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    codeStatus.textContent = '';
    const token = code.value.replace(/\D/g, '');
    if (!CODE.test(token)) {
      code.setAttribute('aria-invalid', 'true');
      codeErr.textContent = 'Saisissez les 6 chiffres du code reçu par e-mail.';
      code.focus();
      return;
    }
    code.removeAttribute('aria-invalid');
    codeErr.textContent = '';
    codeGo.disabled = true;
    codeGo.textContent = 'Vérification…';
    try {
      await verifyEmailCode(email, token);
      clearInterval(timer);
      codeStatus.textContent = 'Connexion réussie.';
      // Même suite que le lien : l'intention newsletter est appliquée (SIGNED_IN, puis Mon compte).
      await applyIntent().catch(() => {});
      location.hash = '#/compte';
    } catch (x) {
      code.setAttribute('aria-invalid', 'true');
      codeErr.textContent = fr(humanizeCode(x));
      code.select();
      code.focus();
    } finally {
      codeGo.disabled = false;
      codeGo.textContent = 'Se connecter';
    }
  });
  resend.addEventListener('click', async () => {
    if (!email) return;
    resend.disabled = true;
    codeStatus.classList.remove('is-error');
    codeStatus.textContent = 'Envoi…';
    try {
      await signInWithEmail(email);
      resetCode();
      codeStatus.textContent = fr(`Nouveau code envoyé à ${email}. Seul le plus récent fonctionne.`);
      cooldown();
      code.focus();
    } catch (x) {
      codeStatus.textContent = humanize(x);
      codeStatus.classList.add('is-error');
      resend.disabled = false;
      resend.textContent = 'Renvoyer le code';
    }
  });
}

// ---- Mon compte ----
function newsletterHint(p) {
  if (p.newsletter) return p.newsletter_consent_at ? `Inscrit le ${when(p.newsletter_consent_at)} (date de votre consentement).` : 'Inscrit.';
  if (p.unsubscribed_at) return `Désinscrit le ${when(p.unsubscribed_at)}. Vous ne recevez plus l'article.`;
  return "Vous ne recevez pas l'article.";
}

export async function compte() {
  const title = 'Mon compte';
  if (!isConfigured()) return { title, html: page(html`${head('Mon compte')}${notConfigured()}`) };
  let s;
  let p;
  try {
    s = await getSession();
    if (!s) return { redirect: '#/connexion' };
    await applyIntent().catch(() => {});
    p = await getProfile();
  } catch (e) {
    console.error(e);
    return { title, html: page(html`${head('Mon compte')}${renderError('Votre profil')}`) };
  }
  const email = (p && p.email) || s.user.email || '';
  if (!p) {
    return {
      title,
      html: page(html`${head('Mon compte', email)}${renderEmpty({ title: 'Profil introuvable', text: "Votre compte existe mais son profil n'a pas été créé. Déconnectez-vous puis reconnectez-vous ; si le problème persiste, écrivez-nous.", action: html`<button type="button" class="btn" data-action="signout">Se déconnecter</button>` })}`),
    };
  }
  const provider = (s.user.app_metadata && s.user.app_metadata.provider) || 'email';
  const markets = Array.isArray(p.markets) && p.markets.length ? p.markets : ['FR'];
  const free = p.free_until ? ` Gratuit jusqu'au ${dFull(p.free_until)}.` : '';
  return {
    title,
    html: page(html`${head('Mon compte', email)}
<section class="acc-card founder-card" aria-label="Statut">
${p.founding_member ? html`<p><span class="c-tag is-founder">${icon('i-star')}<span>Membre fondateur · 1 an offert</span></span></p>` : ''}
<p class="acc-since">Membre depuis le ${when(p.created_at, false)}.</p>
${p.founding_member ? html`<p class="muted">Le jour où Relevé deviendra payant, votre première année sera offerte.${free}</p>` : ''}</section>

<section class="acc-sec" aria-labelledby="nl-h"><h2 id="nl-h">Newsletter</h2>
<div class="switch-row"><label for="nl-switch"><span class="check-title">Recevoir l'article hebdo chaque lundi</span><span class="check-hint" id="nl-hint">${newsletterHint(p)}</span></label>
<input type="checkbox" role="switch" class="switch" id="nl-switch" aria-describedby="nl-hint"${p.newsletter ? html` checked` : ''}></div>
<fieldset class="mk-pick"><legend>Marchés couverts par l'article</legend><div class="mk-opts">${MARKETS.map(([v, l]) => html`<label class="check"><input type="checkbox" name="nl-market" value="${v}"${markets.includes(v) ? html` checked` : ''}><span>${l}</span></label>`)}</div>
<p class="check-hint">Au moins un marché.</p></fieldset>
<p class="save-status" id="save-status" role="status"></p></section>

${renderPushSection()}

<section class="acc-sec" aria-labelledby="ses-h"><h2 id="ses-h">Connexion</h2>
<p>Connecté avec ${PROVIDER_LABEL[provider] || provider}.</p>
<button type="button" class="btn" data-action="signout">Se déconnecter</button></section>

<section class="acc-sec danger-zone" aria-labelledby="del-h"><h2 id="del-h">Supprimer mon compte</h2>
<p>Votre adresse e-mail, vos préférences et votre statut de membre fondateur sont effacés immédiatement et définitivement.</p>
<button type="button" class="btn btn-danger" data-del-open>Supprimer mon compte…</button></section>

<dialog class="c-dialog" id="del-dialog" aria-labelledby="del-title" aria-describedby="del-desc"><div class="dialog-in">
<h2 id="del-title">Supprimer votre compte ?</h2>
<p id="del-desc">C'est définitif : votre adresse ${email}, vos préférences et votre statut de membre fondateur (un an offert) seront effacés. Vous ne recevrez plus l'article.</p>
<label class="check" for="del-ok"><input type="checkbox" id="del-ok"><span>Je comprends que la suppression est définitive.</span></label>
<p class="form-msg" role="alert"></p>
<div class="dialog-actions"><button type="button" class="btn" data-del-cancel autofocus>Annuler</button><button type="button" class="btn btn-danger" data-del-go disabled>Supprimer définitivement</button></div>
</div></dialog>`, 'account'),
    after: (root) => { mountAccount(root, p); mountPushSection(root); },
  };
}

function mountAccount(root, initial) {
  let prof = initial;
  const sw = root.querySelector('#nl-switch');
  const hint = root.querySelector('#nl-hint');
  const status = root.querySelector('#save-status');
  const boxes = [...root.querySelectorAll('input[name="nl-market"]')];
  const inputs = [sw, ...boxes];
  const show = (text, bad = false) => { status.textContent = fr(text); status.classList.toggle('is-error', bad); };

  async function save(patch, revert) {
    inputs.forEach((i) => { i.disabled = true; });
    show('Enregistrement…');
    try {
      prof = await updateProfile(patch);
      hint.textContent = fr(newsletterHint(prof));
      show(patch.newsletter === true ? 'Inscription enregistrée. Prochain envoi : lundi.' : patch.newsletter === false ? 'Désinscription enregistrée.' : 'Préférences enregistrées.');
    } catch (e) {
      revert();
      show(`Non enregistré. ${humanize(e)}`, true);
    } finally {
      inputs.forEach((i) => { i.disabled = false; });
    }
  }
  sw.addEventListener('change', () => {
    const on = sw.checked;
    save({ newsletter: on }, () => { sw.checked = !on; });
  });
  boxes.forEach((b) => b.addEventListener('change', () => {
    const picked = boxes.filter((x) => x.checked).map((x) => x.value);
    if (!picked.length) {
      b.checked = true;
      show('Gardez au moins un marché.', true);
      return;
    }
    save({ markets: picked }, () => { b.checked = !b.checked; });
  }));

  // Suppression : confirmation explicite dans un <dialog> modal (focus piégé, Échap natif).
  const dlg = root.querySelector('#del-dialog');
  const ok = dlg.querySelector('#del-ok');
  const go = dlg.querySelector('[data-del-go]');
  const msg = dlg.querySelector('.form-msg');
  root.querySelector('[data-del-open]').addEventListener('click', () => {
    ok.checked = false;
    go.disabled = true;
    msg.textContent = '';
    dlg.showModal();
  });
  dlg.querySelector('[data-del-cancel]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  ok.addEventListener('change', () => { go.disabled = !ok.checked; });
  go.addEventListener('click', async () => {
    go.disabled = true;
    ok.disabled = true;
    go.textContent = 'Suppression…';
    msg.textContent = '';
    try {
      await deleteAccount();
      disablePush().catch(() => {}); // l'abonnement rattaché au compte vient d'être effacé côté serveur
      dlg.close();
      root.innerHTML = String(page(html`<div data-keep>${head('Compte supprimé')}${renderEmpty({
        ic: 'i-ok',
        title: 'Vos données ont été effacées',
        text: "Votre compte, votre adresse e-mail et vos préférences n'existent plus chez nous. Merci d'avoir essayé Relevé.",
        action: html`<a class="btn" href="#/">Retour à l'accueil</a>`,
      })}</div>`));
      document.title = 'Compte supprimé · Relevé';
      const h1 = root.querySelector('h1');
      if (h1) h1.focus();
    } catch (e) {
      msg.textContent = `La suppression n'a pas abouti. ${humanize(e)}`;
      go.textContent = 'Supprimer définitivement';
      ok.disabled = false;
      go.disabled = !ok.checked;
    }
  });
}

// ---- Désinscription en un clic ----
export async function desinscription(ctx) {
  const title = 'Désinscription';
  const t = ctx.params && ctx.params.t;
  const back = html`<a class="btn" href="#/">Retour à l'accueil</a>`;
  if (!isConfigured()) {
    return { title, html: page(html`${head('Désinscription')}${renderEmpty({ ic: 'i-mail', title: "La newsletter n'est pas encore activée", text: "Aucun envoi n'a lieu pour l'instant : il n'y a rien à désinscrire.", action: back })}`) };
  }
  const invalid = () => ({
    title,
    html: page(html`${head('Désinscription')}${renderEmpty({ ic: 'i-warn', title: 'Lien de désinscription invalide', text: "Ce lien est incomplet ou ne correspond à aucun compte. Copiez-le en entier depuis l'e-mail, ou gérez la newsletter depuis Mon compte.", action: html`<a class="btn" href="#/compte">Mon compte</a>` })}`),
  });
  if (!isToken(t)) return invalid();
  let ok;
  try { ok = await unsubscribe(t); } catch (e) {
    console.error(e);
    return { title, html: page(html`${head('Désinscription')}${renderError('Le service de désinscription')}`) };
  }
  if (!ok) return invalid();
  return {
    title,
    html: page(html`${head('Désinscription')}${renderEmpty({ ic: 'i-ok', title: 'Vous êtes désinscrit', text: "Vous ne recevrez plus l'article hebdo. Votre compte et votre statut de membre fondateur sont conservés ; vous pouvez vous réinscrire depuis Mon compte.", action: back })}`),
  };
}
