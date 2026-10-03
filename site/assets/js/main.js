// Démarrage, routeur hash, thème, panneau produit, événements délégués.
import { getMeta, getLatest, getHistory, getIndex, getRanking, isMarket, collectedDays } from './data.js';
import { parse, build, productHash } from './router.js';
import { html, fr } from './escape.js';
import { dShort, time, parisDay, dayDate, dayRange, no } from './format.js';
import { initTips, hideTip } from './components/tip.js';
import { renderStatusBar, renderStatusButton, renderSourcesSheet } from './components/status.js';
import { renderError, renderSkeleton, renderEmpty, renderNote } from './components/states.js';
import { renderPanel } from './components/panel.js';
import { periodLabel } from './components/coverage.js';
import { extLink } from './components/ui.js';
import { mountRankChart, windowDays, chartTable } from './charts/rank-chart.js';
import { today } from './views/today.js';
import { rankings } from './views/rankings.js';
import { stores } from './views/stores.js';
import { tiktok } from './views/tiktok.js';
import { buzz } from './views/buzz.js';
import { method } from './views/method.js';
import { articles } from './views/articles.js';
import { connexion, compte, desinscription } from './views/account.js';
import { privacy } from './views/privacy.js';
import * as auth from './auth.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const panel = $('#panel');
const sheet = $('#sheet');
const live = $('#live');
const VIEWS = {
  aujourdhui: today, classements: rankings, boutiques: stores, tiktok, buzz, methode: method,
  articles, connexion, compte, confidentialite: privacy, desinscription,
};
// Vues qui ont besoin de meta.json + latest.json avant de s'afficher ; les autres s'en passent.
const DATA_VIEWS = new Set(['aujourdhui', 'classements', 'boutiques', 'tiktok', 'buzz', 'methode']);
const NAV_OF = { compte: 'connexion', desinscription: 'connexion' };
const S = { meta: null, latest: null, viewHash: null, view: null, fromApp: false, token: 0, first: true, openHash: null, pd: null, chart: null };

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};

function marketOf(params) {
  if (params && isMarket(params.m)) { store.set('releve.market', params.m); return params.m; }
  const s = store.get('releve.market');
  return isMarket(s) ? s : 'FR';
}

// ---- Thème : auto → clair → sombre ----
const THEMES = ['auto', 'light', 'dark'];
const T_LONG = { auto: 'automatique', light: 'clair', dark: 'sombre' };
const T_SHORT = { auto: 'Auto', light: 'Clair', dark: 'Sombre' };
function applyTheme(t) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('[data-action="theme"]').forEach((b) => {
    b.setAttribute('aria-label', fr(`Thème : ${T_LONG[t]}`));
    const l = b.querySelector('.theme-label');
    if (l) l.textContent = fr(`Thème : ${T_SHORT[t]}`);
  });
}
const currentTheme = () => { const t = store.get('releve.theme'); return THEMES.includes(t) ? t : 'auto'; };

// ---- Chrome : bandeau des sources, fraîcheur, pied de page ----
function renderChrome() {
  const { meta } = S;
  $('#status').innerHTML = String(renderStatusBar(meta));
  $('#status-m').innerHTML = String(renderStatusButton(meta));
  const today = parisDay();
  const late = meta.last_day && (dayDate(today) - dayDate(meta.last_day)) / 864e5 > 1;
  $('#fresh').innerHTML = late
    ? String(html`<div class="fresh"><div class="container">${renderNote('warn', `Données du ${dShort(meta.last_day)} : les relevés suivants ont échoué.`)}</div></div>`) : '';
  const g = new Date(meta.generated_at || NaN);
  $('#gen').textContent = Number.isNaN(g.getTime()) ? ''
    : fr(`Données générées le ${dShort(parisDay(g)).replace(/\s\d{4}$/, '')} ${parisDay(g).slice(0, 4)} à ${time(meta.generated_at)} (heure de Paris).`);
  const host = location.hostname;
  const seg = location.pathname.split('/').filter(Boolean)[0];
  if (/\.github\.io$/.test(host) && seg) {
    $('#code-link').innerHTML = String(html` · ${extLink(`https://github.com/${host.split('.')[0]}/${seg}`, 'Code source')}`);
  }
}

/** Bandeau des sources et pied de page sur les pages sans données : chargés sans bloquer ni échouer. */
function loadChrome() {
  if (S.meta || S.chromeP) return;
  S.chromeP = Promise.all([getMeta(), getLatest()]).then(([meta, latest]) => {
    if (!S.meta) { S.meta = meta; S.latest = latest; renderChrome(); }
  }, () => {}).finally(() => { S.chromeP = null; });
}

const pageSkeleton = () => html`<div class="container page narrow" aria-busy="true"><span class="sr-only" role="status">Chargement…</span><div class="sk sk-h1"></div><div class="sk"></div><div class="sk sk-60 sk-gap"></div></div>`;

// ---- Compte dans l'en-tête : « Se connecter » ou initiale + menu ----
function renderAccount() {
  const el = $('#acct');
  if (!el) return;
  const s = auth.cachedSession();
  const email = (s && s.user && s.user.email) || '';
  if (!s) {
    el.innerHTML = String(html`<a class="acct-link" href="#/connexion" data-nav="connexion"><svg class="ic" aria-hidden="true" focusable="false"><use href="#i-user"></use></svg><span class="acct-lbl">Se connecter</span></a>`);
  } else {
    const initial = (email.trim().charAt(0) || '?').toUpperCase();
    el.innerHTML = String(html`<button type="button" class="acct-btn" popovertarget="acct-menu" aria-label="${`Mon compte${email ? ` (${email})` : ''}`}" data-nav="connexion"><span class="avatar" aria-hidden="true">${initial}</span><span class="acct-lbl" aria-hidden="true">Mon compte</span></button>
<div id="acct-menu" class="c-menu acct-menu" popover>${email ? html`<p class="menu-email">${email}</p>` : ''}<a href="#/compte">Mon compte</a><button type="button" data-action="signout">Se déconnecter</button></div>`);
  }
  syncChrome(S.view, marketOf(parse(location.hash).params));
}

function syncChrome(view, m) {
  const nav = NAV_OF[view] || view;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('input[name="market"]').forEach((i) => { i.checked = i.value === m; });
}

// ---- Rendu d'une vue ----
function focusKey(el) {
  if (!el || !app.contains(el)) return null;
  if (el.name && el.type === 'radio') return `input[name="${el.name}"][value="${el.value}"]`;
  if (el.id) return `#${el.id}`;
  return null;
}

async function renderView(r, hash) {
  const token = (S.token += 1);
  const same = S.view === r.view;
  const fk = same ? focusKey(document.activeElement) : null;
  S.viewHash = hash;
  S.view = r.view;
  const m = marketOf(r.params);
  syncChrome(r.view, m);
  app.setAttribute('aria-busy', 'true');
  const needsData = DATA_VIEWS.has(r.view);
  const timer = setTimeout(() => {
    if (token === S.token && !same) app.innerHTML = String(needsData ? renderSkeleton(10) : pageSkeleton());
  }, 150);
  let out;
  try {
    if (needsData && (!S.meta || !S.latest)) {
      [S.meta, S.latest] = await Promise.all([getMeta(), getLatest()]);
      renderChrome();
    } else if (!needsData) loadChrome();
    out = await VIEWS[r.view]({ meta: S.meta, latest: S.latest, r, m, params: r.params, open: S.openHash });
  } catch (e) {
    console.error(e);
    out = { title: 'Erreur', html: html`<div class="container page"><h1 tabindex="-1" class="sr-only">Erreur</h1>${renderError('Le fichier des données')}</div>` };
  }
  clearTimeout(timer);
  if (token !== S.token) return;
  if (out.redirect) { location.replace(out.redirect); return; }
  app.removeAttribute('aria-busy');
  app.innerHTML = String(out.html);
  document.title = out.docTitle || `${out.title} · Relevé`;
  if (out.after) out.after(app);
  const sec = r.view === 'methode' && r.sub ? document.getElementById(r.sub) : null;
  if (sec) {
    const h = sec.querySelector('h2') || sec;
    h.focus({ preventScroll: true });
    sec.scrollIntoView();
  } else if (same && fk && $(fk, app)) {
    $(fk, app).focus();
  } else if (!S.first) {
    const h1 = $('h1', app);
    if (h1) h1.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  if (same && out.announce) live.textContent = out.announce;
  S.first = false;
}

// ---- Panneau produit ----
function markOpen() {
  app.querySelectorAll('.c-row.is-open').forEach((li) => li.classList.remove('is-open'));
  if (!S.openHash) return;
  app.querySelectorAll('a.row-link').forEach((a) => {
    if (a.getAttribute('href') === S.openHash) a.closest('.c-row').classList.add('is-open');
  });
}

function neighbours(key) {
  const hrefs = [];
  app.querySelectorAll('a[href^="#/produit/"]').forEach((a) => {
    const h = a.getAttribute('href');
    if (!hrefs.includes(h)) hrefs.push(h);
  });
  const i = hrefs.indexOf(key);
  return i < 0 ? {} : { prev: hrefs[i - 1] || null, next: hrefs[i + 1] || null };
}

async function panelData(r) {
  const { meta, latest } = S;
  const { market: m, category: c, id } = r;
  const catLabel = meta.categories && meta.categories[c];
  if (!catLabel) return null;
  const [hist, idx] = await Promise.all([getHistory(m, c).catch(() => ({})), getIndex().catch(() => ({}))]);
  const list = (latest.amazon || []).find((l) => l.market === m && l.category === c);
  const item = (list && (list.items || []).find((x) => x.id === id)) || null;
  const h = hist[id] || null;
  const months = Object.keys(idx).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
  const keys = ['7d', '30d', months[months.length - 1]].filter((k) => k && idx[k]);
  const res = await Promise.all(keys.map((k) => getRanking(k).then((R) => ({ k, R }), () => ({ k, R: null }))));
  let card = null;
  const periods = res.map(({ k, R }) => {
    const ov = (R && R.amazon && R.amazon[m] && R.amazon[m].overall) || [];
    const i = ov.findIndex((x) => x.id === id);
    if (i >= 0 && !card) card = ov[i];
    return { label: periodLabel(k), text: !R ? '—' : i >= 0 ? fr(`${no(i + 1)} · ${ov[i].days}/${R.days_covered} j`) : 'Hors des 50 premiers' };
  });
  if (!item && !h && !card) return null;
  const ranks = (h && h.ranks) || (item ? { [latest.date]: item.rank } : {});
  let best = null;
  let bestDay = null;
  Object.keys(ranks).sort().forEach((d) => { if (best === null || ranks[d] <= best) { best = ranks[d]; bestDay = d; } });
  const allDays = dayRange(meta.first_day, meta.last_day);
  let collected = collectedDays(hist);
  if (!collected.size && item) collected = new Set([latest.date]);
  const src = item || card || {};
  return {
    m, c, id, catLabel, item, best, bestDay, periods, ranks, allDays, collected,
    title: (item && item.title) || (h && h.title) || (card && card.title),
    image: (item && item.image) || (h && h.image) || (card && card.image),
    url: (item && item.url) || (h && h.url) || (card && card.url),
    price: src.price, rating: src.rating, reviews: src.reviews,
    sourceAt: meta.sources && meta.sources.amazon && meta.sources.amazon.collected_at,
    sourceUrl: list && list.source_url,
    hasCurve: Object.keys(ranks).length >= 2,
    range: ['7j', '30j', 'tout'].includes(r.params.r) ? r.params.r : allDays.length < 30 ? 'tout' : '30j',
    ...neighbours(productHash(m, c, id)),
  };
}

function mountChart(animate) {
  if (S.chart) { S.chart(); S.chart = null; }
  const d = S.pd;
  const host = $('#chart-host', panel);
  if (!d || !d.hasCurve || !host) return;
  const days = windowDays(d.allDays, d.range);
  S.chart = mountRankChart(host, { days, ranks: d.ranks, collected: d.collected, range: d.range, animate, live: $('#chart-live', panel) });
  $('#chart-table', panel).innerHTML = String(chartTable(days, d.ranks, d.collected));
}

async function openPanel(r, wasOpen) {
  const key = productHash(r.market, r.category, r.id);
  S.openHash = key;
  markOpen();
  if (!wasOpen) panel.showModal();
  panel.setAttribute('aria-busy', 'true');
  let d = null;
  let failed = false;
  try { d = await panelData(r); } catch (e) { console.error(e); failed = true; }
  if (S.openHash !== key) return;
  panel.removeAttribute('aria-busy');
  S.pd = d;
  if (!d) {
    panel.innerHTML = String(html`<div class="panel-head"><p class="panel-src"></p><button type="button" class="icon-btn" data-action="close-panel" aria-label="Fermer">✕</button></div><div class="panel-body"><h2 id="panel-title" tabindex="-1" class="sr-only">Produit</h2>${
      failed ? renderError("Le fichier d'historique") : renderEmpty({ title: 'Aucun produit ici', text: "Ce produit n'apparaît dans aucun relevé disponible." })}</div>`);
  } else {
    panel.innerHTML = String(renderPanel(d));
    mountChart(!wasOpen);
  }
  const t = $('#panel-title', panel);
  if (t) t.focus();
}

function requestClose() {
  if (parse(location.hash).view !== 'produit') return;
  if (S.fromApp) history.back();
  else location.replace(S.viewHash || '#/');
}

panel.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); });
panel.addEventListener('close', () => {
  if (S.chart) { S.chart(); S.chart = null; }
  const key = S.openHash;
  S.openHash = null;
  S.pd = null;
  markOpen();
  const a = key && [...app.querySelectorAll('a[href^="#/produit/"]')].find((x) => x.getAttribute('href') === key);
  if (a) a.focus();
});

// ---- Routeur ----
async function route() {
  hideTip();
  const r = parse(location.hash);
  if (r.view === 'produit') {
    if (!isMarket(r.market) || !r.category || !r.id) { location.replace('#/'); return; }
    const wasOpen = panel.open;
    if (!S.viewHash) {
      const bg = build('classements', { m: r.market, p: 'jour', c: r.category });
      await renderView(parse(bg), bg);
      S.fromApp = false;
    } else if (!wasOpen) S.fromApp = true;
    if (!S.meta) return;
    await openPanel(r, wasOpen);
    return;
  }
  if (panel.open) panel.close();
  if (sheet.open) sheet.close();
  const h = location.hash || '#/';
  if (h !== S.viewHash) await renderView(r, h);
}

function setParam(name, value) {
  const r = parse(location.hash);
  if (r.view === 'produit') return;
  const params = { ...r.params, [name]: value };
  if (name === 'p' && value !== 'jour') delete params.f;
  if (name === 'vue' && value === 'boutique') delete params.p;
  params.m = marketOf(r.params);
  location.hash = build(r.view, params, r.sub);
}

// ---- Événements délégués ----
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 'market') {
    store.set('releve.market', t.value);
    const r = parse(S.viewHash || location.hash);
    location.hash = build(r.view, { ...r.params, m: t.value }, r.sub);
    return;
  }
  if (t.name === 'plage' && S.pd) {
    S.pd.range = t.value;
    history.replaceState(null, '', productHash(S.pd.m, S.pd.c, S.pd.id, { r: t.value }));
    mountChart(false);
    return;
  }
  if (t.name === 'buzz-m') {
    const g = $('.buzz-grid', app);
    if (g) g.dataset.show = t.value;
    return;
  }
  if (t.dataset && t.dataset.param) setParam(t.dataset.param, t.value);
});

document.addEventListener('click', (e) => {
  const skip = e.target.closest('.skip');
  if (skip) { e.preventDefault(); app.focus(); return; }
  const menuItem = e.target.closest('.c-menu button[data-param]');
  if (menuItem) {
    const pop = menuItem.closest('[popover]');
    if (pop && pop.hidePopover) pop.hidePopover();
    setParam(menuItem.dataset.param, menuItem.dataset.value);
    return;
  }
  if (e.target === panel) { requestClose(); return; }
  if (e.target === sheet) { sheet.close(); return; }
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const act = b.dataset.action;
  if (act === 'retry') { S.viewHash = null; S.view = null; route(); }
  else if (act === 'theme') {
    const t = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
    store.set('releve.theme', t);
    applyTheme(t);
  } else if (act === 'more') {
    const ol = b.previousElementSibling;
    const next = [...ol.querySelectorAll(':scope > li[hidden]')].slice(0, 25);
    next.forEach((li) => { li.hidden = false; });
    if (!ol.querySelector(':scope > li[hidden]')) b.remove();
    const a = next[0] && next[0].querySelector('a');
    if (a) a.focus();
  } else if (act === 'expand') {
    const card = b.closest('.store-card');
    const on = card.classList.toggle('is-expanded');
    b.setAttribute('aria-expanded', String(on));
    b.textContent = on ? 'Réduire' : `Voir les ${card.querySelectorAll('.c-row').length} ›`;
  } else if (act === 'sources' && S.meta) {
    sheet.innerHTML = String(renderSourcesSheet(S.meta));
    sheet.showModal();
    $('#sheet-title', sheet).focus();
  } else if (act === 'close-sheet') sheet.close();
  else if (act === 'close-panel') requestClose();
  else if (act === 'signout') {
    const menu = $('#acct-menu');
    if (menu && menu.hidePopover && menu.matches(':popover-open')) menu.hidePopover();
    b.disabled = true;
    auth.signOut().catch((x) => console.error(x)).finally(() => {
      b.disabled = false;
      renderAccount();
      live.textContent = 'Vous êtes déconnecté.';
      if (S.view === 'compte') location.hash = '#/';
    });
  }
  else if ((act === 'prev' || act === 'next') && S.pd && S.pd[act]) location.replace(S.pd[act]);
});

document.addEventListener('keydown', (e) => {
  if (!panel.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  const target = k === 'j' ? 'next' : k === 'k' ? 'prev' : null;
  if (target && S.pd && S.pd[target]) { e.preventDefault(); location.replace(S.pd[target]); }
});

// Menus Mois/Année : positionnés sous leur bouton à l'ouverture.
document.addEventListener('toggle', (e) => {
  const el = e.target;
  if (!el.matches || !el.matches('.c-menu') || e.newState !== 'open') return;
  const btn = document.querySelector(`[popovertarget="${el.id}"]`);
  if (!btn) return;
  const rc = btn.getBoundingClientRect();
  el.style.top = `${rc.bottom + 4}px`;
  el.style.left = `${Math.max(8, Math.min(rc.left, window.innerWidth - el.offsetWidth - 8))}px`;
}, true);

// Image externe en erreur → tuile avec l'initiale de la catégorie.
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!img || img.tagName !== 'IMG' || img.dataset.initial === undefined) return;
  const s = document.createElement('span');
  s.className = 'thumb-fb';
  s.title = 'Image indisponible';
  s.setAttribute('aria-hidden', 'true');
  s.textContent = img.dataset.initial;
  img.replaceWith(s);
}, true);

// Menu du compte : se ferme dès qu'on choisit une entrée.
document.addEventListener('click', (e) => {
  const item = e.target.closest('#acct-menu a');
  const menu = item && item.closest('[popover]');
  if (menu && menu.hidePopover) menu.hidePopover();
});

// ---- Comptes : état de l'en-tête et pages compte suivent la session ----
let lastUser = null;
auth.onAuthChange((ev, s) => {
  const uid = (s && s.user && s.user.id) || null;
  renderAccount();
  if (uid === lastUser) return; // rafraîchissement de jeton, retour sur l'onglet : rien à refaire
  lastUser = uid;
  if (ev === 'INITIAL_SESSION') return; // session lue au démarrage : la vue l'a déjà attendue
  if (app.querySelector('[data-keep]')) return; // ex. « Compte supprimé » : on laisse le message affiché
  // Seuls les cas où la page affichée ne correspond plus à l'état de connexion sont re-rendus.
  if ((S.view === 'compte' && !uid) || (S.view === 'connexion' && uid)) { S.viewHash = null; route(); }
});

async function boot() {
  initTips();
  applyTheme(currentTheme());
  window.addEventListener('hashchange', route);
  if (auth.isConfigured()) {
    if (auth.isCallback()) {
      // Retour PKCE (?code=…) : on échange le code avant le premier rendu, puis on nettoie l'URL.
      await auth.completeRedirect();
    } else if (auth.hasStoredSession()) {
      auth.getSession().then(() => auth.applyIntent()).catch(() => {}).finally(renderAccount);
    }
    lastUser = (auth.cachedSession() && auth.cachedSession().user.id) || null;
    renderAccount();
  }
  route();
}
boot();
