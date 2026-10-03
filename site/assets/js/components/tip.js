// Infobulle (§7.14) : survol ET focus, délai 300 ms. Le texte est toujours aussi en sr-only à côté.
let tipEl;
let timer;
let current;

function show(target) {
  const text = target.getAttribute('data-tip');
  if (!text) return;
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'c-tip';
    tipEl.setAttribute('aria-hidden', 'true'); // doublon visuel du texte sr-only
    document.body.append(tipEl);
  }
  tipEl.textContent = text;
  tipEl.hidden = false;
  const r = target.getBoundingClientRect();
  const w = tipEl.offsetWidth;
  const h = tipEl.offsetHeight;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
  const top = r.top - h - 6 < 8 ? r.bottom + 6 : r.top - h - 6;
  tipEl.style.left = `${left}px`;
  tipEl.style.top = `${top}px`;
}

export function hideTip() {
  clearTimeout(timer);
  current = null;
  if (tipEl) tipEl.hidden = true;
}

function enter(e) {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (!t || t === current) return;
  clearTimeout(timer);
  current = t;
  timer = setTimeout(() => show(t), 300);
}
function leave(e) {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (t && e.relatedTarget && t.contains(e.relatedTarget)) return;
  hideTip();
}

export function initTips() {
  document.addEventListener('mouseover', enter);
  document.addEventListener('mouseout', leave);
  document.addEventListener('focusin', enter);
  document.addEventListener('focusout', leave);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });
  window.addEventListener('scroll', hideTip, { passive: true });
}
