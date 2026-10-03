// Vue TikTok (§6.6) : la source est retirée (meta.sources.tiktok.status = "unavailable").
// On garde la page (liens partagés, honnêteté) avec un état « Source indisponible » permanent,
// sans liste ni graphique factice.
import { html, fr } from '../escape.js';
import { renderUnavailable } from '../components/states.js';

const CREATIVE_CENTER = 'https://ads.tiktok.com/business/creativecenter/';

export async function tiktok(ctx) {
  const { meta, m } = ctx;
  const s = (meta.sources && meta.sources.tiktok) || null;
  const market = (meta.markets && meta.markets[m]) || m;
  const permanent = Boolean(s && s.status === 'unavailable');
  const state = renderUnavailable({
    name: 'TikTok',
    permanent,
    checked: s && s.checked,
    message: (s && s.reason) || (meta.method && meta.method.tiktok) || '',
    last: s && s.last_success,
    errors: (s && s.errors) || [],
    url: CREATIVE_CENTER,
    linkLabel: 'Ouvrir le Creative Center',
  });
  return {
    title: 'Pubs TikTok',
    html: html`<div class="container page narrow"><div class="page-head"><h1 tabindex="-1">Pubs TikTok</h1><p class="lede">${permanent
      ? fr("Cette page devait montrer les produits les plus présents dans les publicités TikTok. La source n'est plus accessible : rien n'est affiché à sa place.")
      : `Les produits les plus présents dans les publicités TikTok sur 7 jours, ${market}.`}</p></div>${state}
<p class="list-meta">Les autres sources restent relevées chaque matin : <a href="#/classements">Classements Amazon</a>, <a href="#/boutiques">Boutiques Shopify</a>, <a href="#/buzz">Buzz Google</a>. <a href="#/methode/tiktok">Pourquoi TikTok n'est plus relevé ?</a></p></div>`,
  };
}
