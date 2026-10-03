// Formats français (Intl) : nombres, prix, dates (Europe/Paris), pluriels.
const TZ = 'Europe/Paris';
const NF = new Intl.NumberFormat('fr-FR');
const NF1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const PR = new Intl.PluralRules('fr');
const CUR = { FR: 'EUR', US: 'USD' };
const PF = {};

export const DASH = '—';
const ok = (v) => typeof v === 'number' && Number.isFinite(v);

export const num = (v) => (ok(v) ? NF.format(v) : DASH);
export const dec1 = (v) => (ok(v) ? NF1.format(v) : DASH);
export const no = (r) => (ok(r) ? `n°\u00a0${r}` : DASH);
export const plural = (n, one, many) => (PR.select(n) === 'one' ? one : many);

/** Prix dans la devise du marché ; null, 0 ou négatif → « — » (un prix nul n'est pas une donnée fiable). */
export function price(v, market) {
  if (!ok(v) || v <= 0) return DASH;
  const c = CUR[market] || 'EUR';
  PF[c] = PF[c] || new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c });
  return PF[c].format(v);
}

export function pct(v) {
  if (!ok(v)) return DASH;
  return `${NF1.format(v)}\u00a0%`;
}

// ---- Dates ----
const isoDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s);
export const dayDate = (iso) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};
const dtf = (o) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...o });
const MS = dtf({ month: 'short' });
const ML = dtf({ month: 'long' });
const WL = dtf({ weekday: 'long' });
const WS = dtf({ weekday: 'short' });
const HM = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const YMD = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Jour calendaire (AAAA-MM-JJ) à Paris pour un instant donné (défaut : maintenant). */
export const parisDay = (d = new Date()) => YMD.format(d);
const dn = (d) => (d.getUTCDate() === 1 ? '1er' : String(d.getUTCDate()));
const yr = (iso) => (iso.slice(0, 4) !== parisDay().slice(0, 4) ? ` ${iso.slice(0, 4)}` : '');

/** « 3 oct. », « 1er oct. » (+ année si différente de l'année en cours). */
export function dShort(iso) {
  if (!isoDay(iso)) return DASH;
  const d = dayDate(iso);
  return `${dn(d)}\u00a0${MS.format(d)}${yr(iso)}`;
}
/** « samedi 3 octobre ». */
export function dLong(iso) {
  if (!isoDay(iso)) return DASH;
  const d = dayDate(iso);
  return `${WL.format(d)} ${dn(d)} ${ML.format(d)}${yr(iso)}`;
}
/** « 3 octobre 2026 ». */
export function dFull(iso) {
  if (!isoDay(iso)) return DASH;
  const d = dayDate(iso);
  return `${dn(d)} ${ML.format(d)} ${iso.slice(0, 4)}`;
}
/** « ven. 2 oct. » (infobulle de courbe). */
export function dWeek(iso) {
  const d = dayDate(iso);
  return `${WS.format(d)} ${dn(d)}\u00a0${MS.format(d)}`;
}
export const monthShort = (iso) => MS.format(dayDate(iso));

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Clé de mois « 2026-10 » → « Octobre 2026 » ; court → « Oct. 2026 ». */
export const monthLabel = (key) => `${cap(ML.format(dayDate(`${key}-01`)))} ${key.slice(0, 4)}`;
export const monthShortLabel = (key) => `${cap(MS.format(dayDate(`${key}-01`)))} ${key.slice(0, 4)}`;

/** Heure de Paris « 06:12 » d'un horodatage ISO. */
export function time(ts) {
  const d = new Date(ts || NaN);
  return Number.isNaN(d.getTime()) ? DASH : HM.format(d);
}
/** « 3 oct. à 06:12 » (date et heure de Paris). */
export function dayTime(ts) {
  const d = new Date(ts || NaN);
  if (Number.isNaN(d.getTime())) return DASH;
  return `${dShort(parisDay(d))} à ${HM.format(d)}`;
}

const RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'always' });
/** « il y a 5 h » à partir d'une date RFC 2822 ou ISO ; null si illisible. */
export function relTime(s) {
  const t = Date.parse(s || '');
  if (Number.isNaN(t)) return null;
  const sec = Math.round((t - Date.now()) / 1000);
  const a = Math.abs(sec);
  if (a < 3600) return RTF.format(Math.round(sec / 60), 'minute').replace('minutes', 'min').replace('minute', 'min');
  if (a < 86400) return RTF.format(Math.round(sec / 3600), 'hour').replace(/heures?/, 'h');
  return RTF.format(Math.round(sec / 86400), 'day');
}

/** Tranche Google « 1000+ » → « 1 000+ recherches », sans changer la valeur. */
export function traffic(label) {
  const s = String(label ?? '').replace(/[\s,.\u202f\u00a0]/g, '');
  const m = /^(\d+)(\+?)$/.exec(s);
  if (!m) return label ? `${label} recherches` : DASH;
  return `${NF.format(Number(m[1]))}${m[2]} recherches`;
}

const LF = new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' });
export const list = (arr) => LF.format(arr);

/** Liste des jours AAAA-MM-JJ de `from` à `to` inclus. */
export function dayRange(from, to) {
  const out = [];
  if (!isoDay(from) || !isoDay(to)) return out;
  const d = dayDate(from);
  const end = dayDate(to).getTime();
  while (d.getTime() <= end && out.length < 4000) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
