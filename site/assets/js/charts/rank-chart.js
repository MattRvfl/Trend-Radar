// Courbe de rang (§8.1) : SVG fait main, Y fixe [1, 30] inversé, bande top 10, zone « hors »,
// jours non relevés hachurés, ligne interrompue sur les trous (jamais d'interpolation).
import { html, fr } from '../escape.js';
import { dWeek, dShort, dFull, monthShort, no, dayDate } from '../format.js';

const NS = { '7j': 7, '30j': 30 };
let uid = 0;

export const windowDays = (all, range) => (NS[range] ? all.slice(-NS[range]) : all);
const has = (ranks, d) => ranks && typeof ranks[d] === 'number';

function pointText(d, ranks, collected) {
  if (has(ranks, d)) return `${dWeek(d)} · ${no(ranks[d])}`;
  return `${dWeek(d)} · ${collected.has(d) ? 'absent du top 30' : 'pas de relevé ce jour-là'}`;
}

/** Résumé accessible : « Rang de 30 jours : n° 4 aujourd'hui, meilleur n° 1 le 28 septembre, présent 12 jours sur 14 relevés. » */
export function summary(days, ranks, collected, range) {
  const last = days[days.length - 1];
  const head = range === 'tout' ? "Rang sur tout l'historique" : `Rang de ${days.length} jours`;
  const today = has(ranks, last) ? `${no(ranks[last])} aujourd'hui`
    : collected.has(last) ? "absent du top 30 aujourd'hui" : "pas de relevé aujourd'hui";
  let best = null;
  let bestDay = null;
  days.forEach((d) => { if (has(ranks, d) && (best === null || ranks[d] <= best)) { best = ranks[d]; bestDay = d; } });
  const present = days.filter((d) => has(ranks, d)).length;
  const done = days.filter((d) => collected.has(d)).length;
  const bestTxt = best === null ? '' : `, meilleur ${no(best)} le ${dFull(bestDay).replace(/ \d{4}$/, '')}`;
  return fr(`${head} : ${today}${bestTxt}, présent ${present} ${present > 1 ? 'jours' : 'jour'} sur ${done} ${done > 1 ? 'relevés' : 'relevé'}.`);
}

/** Tableau de données (dans <details> « Voir les données »). */
export function chartTable(days, ranks, collected) {
  return html`<table class="data-table"><caption class="sr-only">Rang jour par jour</caption><thead><tr><th scope="col">Date</th><th scope="col" class="num">Rang</th></tr></thead><tbody>${
    [...days].reverse().map((d) => html`<tr><td>${dShort(d)}</td><td class="num">${
      has(ranks, d) ? no(ranks[d]) : collected.has(d) ? 'absent du top 30' : 'pas de relevé'}</td></tr>`)}</tbody></table>`;
}

/**
 * host : conteneur (position relative) ; opts : { days, ranks, collected:Set, range, animate, live:Element }.
 * Retourne une fonction de nettoyage.
 */
export function mountRankChart(host, { days, ranks, collected, range, animate = false, live }) {
  const id = `rc${uid += 1}`;
  const n = days.length;
  let geo = null;
  let idx = null;
  let first = true;

  function draw() {
    const W = Math.max(240, Math.round(host.clientWidth || 328));
    const H = window.matchMedia('(min-width: 600px)').matches ? 200 : 160;
    const L = 40; const R = 44; const T = 8; const B = 24;
    const yB = H - B - 20; // zone « hors » assez haute pour que « n° 30 » et « hors » ne se touchent pas
    const y = (r) => T + ((r - 1) / 29) * (yB - T);
    const pw = W - L - R;
    const step = n > 1 ? pw / (n - 1) : pw;
    const x = (i) => (n > 1 ? L + i * step : L + pw / 2);
    const yOut = yB + 14;
    geo = { L, R, W, H, T, step, x, yOut };
    const f = (v) => v.toFixed(1);
    let s = `<defs><pattern id="${id}h" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line class="rc-hatch" x1="0" y1="0" x2="0" y2="5"/></pattern></defs>`;
    s += `<rect class="rc-band" x="${L}" y="${f(y(1))}" width="${f(pw)}" height="${f(y(10) - y(1))}"/>`;
    // Étiquette « top 10 » en bas de bande, à droite, sauf si elle chevaucherait l'étiquette du dernier point.
    const lastRank = [...days].reverse().map((d) => ranks && ranks[d]).find((v) => typeof v === 'number');
    if (!(lastRank >= 6 && lastRank <= 14)) s += `<text class="rc-ax" x="${W - R + 4}" y="${f(y(10) + 4)}">top 10</text>`;
    [1, 10, 20, 30].forEach((r) => {
      s += `<line class="rc-grid" x1="${L}" x2="${W - R}" y1="${f(y(r))}" y2="${f(y(r))}"/><text class="rc-ax" x="${L - 6}" y="${f(y(r) + 4)}" text-anchor="end">${no(r)}</text>`;
    });
    s += `<line class="rc-sep" x1="${L}" x2="${W - R}" y1="${yB + 4}" y2="${yB + 4}"/><text class="rc-ax" x="${L - 6}" y="${yOut + 4}" text-anchor="end">hors</text>`;
    const cw = Math.max(2, step);
    days.forEach((d, i) => {
      if (!collected.has(d)) s += `<rect fill="url(#${id}h)" x="${f(Math.max(L - cw / 2, x(i) - cw / 2))}" y="${T}" width="${f(cw)}" height="${yOut + 5 - T}"/>`;
    });
    // Segments : la ligne s'interrompt dès qu'un jour manque.
    const segs = [];
    let cur = [];
    days.forEach((d, i) => {
      if (has(ranks, d)) cur.push(`${f(x(i))},${f(y(ranks[d]))}`);
      else { if (cur.length) segs.push(cur); cur = []; }
    });
    if (cur.length) segs.push(cur);
    segs.forEach((p) => { if (p.length > 1) s += `<polyline class="rc-line" pathLength="1" points="${p.join(' ')}"/>`; });
    let lastI = -1;
    days.forEach((d, i) => { if (has(ranks, d)) lastI = i; });
    const alone = (i) => !has(ranks, days[i - 1]) && !has(ranks, days[i + 1]);
    days.forEach((d, i) => {
      if (has(ranks, d) && i !== lastI && (n <= 31 || alone(i))) {
        s += `<circle class="rc-pt" cx="${f(x(i))}" cy="${f(y(ranks[d]))}" r="3"/>`;
      } else if (!has(ranks, d) && collected.has(d)) {
        s += `<circle class="rc-absent" cx="${f(x(i))}" cy="${yOut}" r="3"/>`;
      }
    });
    if (lastI >= 0) {
      const r = ranks[days[lastI]];
      s += `<circle class="rc-last" cx="${f(x(lastI))}" cy="${f(y(r))}" r="4"/><text class="rc-end" x="${f(x(lastI) + 8)}" y="${f(y(r) + 4)}">${no(r)}</text>`;
    }
    // Axe X : premier et dernier jour, puis lundis (30 j) ou 1ers du mois (Tout), sans chevauchement.
    const placed = [];
    const label = (i, txt, anchor) => {
      if (placed.some((p) => Math.abs(p - x(i)) < 44)) return;
      placed.push(x(i));
      s += `<text class="rc-ax" x="${f(x(i))}" y="${H - 6}" text-anchor="${anchor}">${txt}</text>`;
    };
    if (n) {
      label(0, dShort(days[0]), n > 1 ? 'start' : 'middle');
      if (n > 1) label(n - 1, dShort(days[n - 1]), 'end');
      days.forEach((d, i) => {
        const dt = dayDate(d);
        if (range === '30j' && dt.getUTCDay() === 1) label(i, dShort(d), 'middle');
        if (range === 'tout' && dt.getUTCDate() === 1) label(i, monthShort(d), 'middle');
        if (range === '7j' && step >= 44) label(i, dShort(d), 'middle');
      });
    }
    s += `<line class="rc-rule" x1="0" x2="0" y1="${T}" y2="${yOut + 5}" visibility="hidden"/>`;
    const cls = animate && first ? 'rank-chart rc-anim' : 'rank-chart';
    first = false;
    host.querySelector('.rc-svg-wrap').innerHTML = `<svg class="${cls}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${summary(days, ranks, collected, range).replace(/"/g, '&quot;')}">${s}</svg>`;
    if (idx !== null) setIdx(idx);
  }

  function setIdx(i) {
    const svg = host.querySelector('svg');
    const tip = host.querySelector('.rc-tip');
    const rule = svg && svg.querySelector('.rc-rule');
    if (!svg || !rule) return;
    if (i === null) {
      idx = null;
      rule.setAttribute('visibility', 'hidden');
      tip.hidden = true;
      return;
    }
    idx = Math.max(0, Math.min(n - 1, i));
    const cx = geo.x(idx);
    rule.setAttribute('x1', cx.toFixed(1));
    rule.setAttribute('x2', cx.toFixed(1));
    rule.setAttribute('visibility', 'visible');
    tip.textContent = pointText(days[idx], ranks, collected);
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = `${Math.max(0, Math.min(geo.W - w, cx - w / 2))}px`;
    tip.style.top = '0px';
    if (live) live.textContent = tip.textContent;
  }

  host.innerHTML = '<div class="rc-svg-wrap"></div><div class="rc-tip" hidden aria-hidden="true"></div>';
  draw();

  const onMove = (e) => {
    const svg = host.querySelector('svg');
    if (!svg || !n) return;
    const px = e.clientX - svg.getBoundingClientRect().left;
    setIdx(n > 1 ? Math.round((px - geo.L) / geo.step) : 0);
  };
  const onLeave = () => { if (!host.contains(document.activeElement)) setIdx(null); };
  const onKey = (e) => {
    if (!e.target.matches || !e.target.matches('svg.rank-chart')) return;
    const map = { ArrowLeft: -1, ArrowRight: 1 };
    let next = null;
    if (e.key in map) next = (idx === null ? n - 1 : idx + map[e.key]);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    setIdx(next);
  };
  const onBlur = () => setIdx(null);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('keydown', onKey);
  host.addEventListener('focusout', onBlur);

  let lastW = host.clientWidth;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    if (host.clientWidth && host.clientWidth !== lastW) { lastW = host.clientWidth; draw(); }
  }) : null;
  if (ro) ro.observe(host);
  return () => {
    if (ro) ro.disconnect();
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerleave', onLeave);
    host.removeEventListener('keydown', onKey);
    host.removeEventListener('focusout', onBlur);
  };
}
