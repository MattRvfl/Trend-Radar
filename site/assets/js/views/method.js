// Vue Méthode (§6.8, §11.5) : ce que mesure Relevé, et ce qu'il ne mesure pas.
import { html, fr } from '../escape.js';
import { dayTime, dShort, dFull, num, plural } from '../format.js';
import { sourceStates } from '../components/status.js';
import { icon } from '../components/ui.js';

const STATUS_ICON = { ok: 'i-ok', partial: 'i-partial', error: 'i-error', unavailable: 'i-ban' };
const STATUS_WORD = { ok: 'OK', partial: 'Partiel', error: 'Indisponible', unavailable: 'Non disponible' };

const TEXTS = {
  amazon: {
    id: 'amazon', title: 'Amazon',
    not: "Pas un volume de ventes : le n° 1 est le produit le plus vendu de sa catégorie au moment du relevé, sans dire combien. Relevé n'estime aucune vente ni aucun chiffre d'affaires.",
    limits: "Un seul relevé par jour, alors qu'Amazon met à jour ses classements chaque heure : un produit peut entrer et sortir entre deux relevés. Seuls les 30 premiers de chaque catégorie sont lus.",
  },
  shopify: {
    id: 'shopify', title: 'Shopify',
    not: "Pas un classement récent : Shopify trie sur l'historique complet des ventes de la boutique. Ce ne sont pas des nouveautés.",
    limits: 'Une sélection de boutiques dont le tri « meilleures ventes » est vérifiable ; les 12 premiers produits de chacune. Une boutique peut changer son catalogue sans prévenir.',
  },
  tiktok: {
    id: 'tiktok', title: 'TikTok',
    not: "Pas des ventes TikTok Shop : c'était une popularité dans les publicités.",
    limits: "Source retirée par TikTok : aucune donnée TikTok n'est affichée, et aucune n'est inventée.",
  },
  gtrends: {
    id: 'google', title: 'Google',
    not: 'Pas une liste de produits : tous les sujets y figurent (actualité, sport, produits…).',
    limits: 'Volume approximatif fourni par Google, en tranches (« 1 000+ recherches ») : jamais converti en nombre exact.',
  },
};

const TOC = [['essentiel', "L'essentiel"], ['amazon', 'Amazon'], ['shopify', 'Shopify'], ['tiktok', 'TikTok'], ['google', 'Google'],
  ['score', 'Le score'], ['donnees-incompletes', 'Données incomplètes'], ['glossaire', 'Glossaire']];

function statusLine(st, s) {
  let when = '';
  if (st === 'unavailable') when = s && s.checked ? ` · vérifié le ${dShort(s.checked)}` : '';
  else if (s && s.collected_at) when = ` · relevé le ${dayTime(s.collected_at)}`;
  return html`<p class="method-status st-${st}">${icon(STATUS_ICON[st])}${STATUS_WORD[st]}${fr(when)}</p>`;
}

export async function method(ctx) {
  const { meta } = ctx;
  const toc = html`<ul>${TOC.map(([id, t]) => html`<li><a href="#/methode/${id}">${t}</a></li>`)}</ul>`;
  const sources = sourceStates(meta).map(({ k, st, s }) => {
    const t = TEXTS[k];
    const what = (meta.method && meta.method[k]) || '—';
    return html`<section id="${t.id}" class="method-sec"><h2 tabindex="-1"><span class="dot dot-${k}" aria-hidden="true"></span>${t.title}</h2>${statusLine(st, s)}
<h3>Ce que c'est</h3><p>${fr(what)}</p><h3>Ce que ce n'est pas</h3><p>${fr(t.not)}</p><h3>Limites connues</h3><p>${fr(t.limits)}</p></section>`;
  });
  const days = meta.days_collected || 0;
  return {
    title: 'Méthode',
    html: html`<div class="container page method"><nav class="method-toc" aria-label="Sur cette page"><details class="toc-mobile"><summary>Sur cette page</summary>${toc}</details><div class="toc-desk"><p class="toc-title">Sur cette page</p>${toc}</div></nav>
<article class="method-body"><div class="page-head"><h1 tabindex="-1">Méthode et sources</h1><p class="lede">Ce que mesure Relevé, et ce qu'il ne mesure pas.</p></div>
<section id="essentiel" class="essentiel"><h2 tabindex="-1">L'essentiel</h2><ul>
<li>Relevé lit chaque matin des classements publics : Amazon (17 catégories, France et États-Unis), des boutiques Shopify sélectionnées et Google Trends. TikTok Creative Center n'est plus accessible (voir plus bas).</li>
<li>Ce sont des <strong>positions</strong>, jamais des quantités vendues. Aucune estimation de ventes n'est faite ici.</li>
<li>Chaque chiffre affiche sa source et l'heure du relevé. Quand une source manque ou qu'une période est incomplète, la page le dit.</li></ul></section>
${sources}
<section id="score" class="method-sec"><h2 tabindex="-1">Le score</h2><p>${fr((meta.method && meta.method.score) || '')}</p>
<pre class="formula">score = Σ (31 − rang)</pre>
<p>Chaque jour, un produit gagne 31 − son rang (30 points pour le n° 1, 1 point pour le n° 30). Le score additionne ces points sur la période : il récompense à la fois le rang et la durée. Un jour hors du top 30 rapporte 0 point.</p>
<p><strong>Exemple</strong> (fictif, pour illustrer le calcul) : un produit n° 1, puis n° 3, puis absent sur 3 jours relevés.</p>
<table class="data-table"><thead><tr><th scope="col">Jour</th><th scope="col" class="num">Rang</th><th scope="col" class="num">Points</th></tr></thead><tbody>
<tr><td>Jour 1</td><td class="num">n° 1</td><td class="num">30</td></tr><tr><td>Jour 2</td><td class="num">n° 3</td><td class="num">28</td></tr><tr><td>Jour 3</td><td class="num">absent</td><td class="num">0</td></tr>
<tr><th scope="row">Score</th><td></td><td class="num">58 sur 90 possibles</td></tr></tbody></table>
<p>La barre de score est absolue : pleine = n° 1 chaque jour relevé (30 × nombre de jours). Pour Shopify (listes de 12), le score est la somme de (13 − rang).</p></section>
<section id="donnees-incompletes" class="method-sec"><h2 tabindex="-1">Données incomplètes</h2>
<p>Une période (7 jours, 30 jours, mois, année) n'est jamais extrapolée : son classement repose sur les seuls jours réellement relevés. L'indicateur de couverture affiche ce nombre de jours ; sous la moitié, la période est signalée « incomplète ».</p>
<p>Un jour sans relevé apparaît hachuré sur les courbes ; un produit absent du top 30 un jour relevé est noté « hors ». La ligne n'est jamais tracée à travers un trou.</p>
<p>Une donnée absente s'affiche « — », jamais 0.</p></section>
<section id="glossaire" class="method-sec"><h2 tabindex="-1">Glossaire</h2><dl class="gloss">
<dt>Rang</dt><dd>Position dans un classement public au moment du relevé.</dd>
<dt>Variation</dt><dd>Nombre de places gagnées (▲) ou perdues (▼) depuis le relevé précédent. ✚ Nouveau : absent du top 30 la veille.</dd>
<dt>Série</dt><dd>Nombre de jours d'affilée dans le top 30, jusqu'à aujourd'hui.</dd>
<dt>Présence</dt><dd>Jours où le produit figurait dans le top 30, sur les jours relevés de la période.</dd>
<dt>Couverture</dt><dd>Jours réellement relevés sur les jours que compte la période.</dd></dl>
<p class="muted">Historique : 1er relevé le ${dFull(meta.first_day)}, ${num(days)} ${plural(days, 'jour collecté', 'jours collectés')}.</p></section>
</article></div>`,
  };
}
