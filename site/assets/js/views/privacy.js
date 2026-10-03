// Confidentialité (RGPD) : ce que Relevé collecte, pourquoi, chez qui, combien de temps, et vos droits.
import { html } from '../escape.js';
import { CONTACT_EMAIL } from '../config.js';
import { extLink } from '../components/ui.js';

const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

export async function privacy() {
  const mail = typeof CONTACT_EMAIL === 'string' && EMAIL.test(CONTACT_EMAIL) ? CONTACT_EMAIL : '';
  const contact = mail
    ? html`par e-mail à <a href="mailto:${mail}">${mail}</a>`
    : html`via la page <a href="https://github.com/mattrvfl/Trend-Radar/issues" target="_blank" rel="noopener noreferrer">Issues du dépôt GitHub du projet<span class="sr-only"> (nouvel onglet)</span></a> (sans y publier de donnée personnelle : indiquez seulement que vous souhaitez être recontacté)`;
  return {
    title: 'Confidentialité',
    html: html`<div class="container page narrow prose"><div class="page-head"><h1 tabindex="-1">Confidentialité</h1>
<p class="lede">Ce que Relevé sait de vous, pourquoi, et comment tout effacer. Mise à jour le 4 octobre 2026.</p></div>

<section class="essentiel"><h2>En bref</h2><ul>
<li>Sans compte, Relevé ne collecte aucune donnée personnelle : pas de cookie publicitaire, pas de mesure d'audience.</li>
<li>Avec un compte : votre adresse e-mail et vos préférences, rien de plus. Jamais revendues, jamais utilisées pour de la publicité.</li>
<li>La newsletter n'est envoyée que si vous l'avez demandée. Vous supprimez votre compte vous-même, en deux clics.</li></ul></section>

<section><h2>Qui est responsable</h2>
<p>Relevé est un projet personnel, non commercial à ce jour. Son éditeur est responsable du traitement des données décrites ici. Pour le joindre : ${contact}.</p></section>

<section><h2>Données collectées</h2>
<p>Uniquement si vous créez un compte :</p><ul>
<li><strong>Adresse e-mail</strong>, transmise par vous (lien de connexion) ou par le service choisi (Google, GitHub, Microsoft ou Discord).</li>
<li><strong>Fournisseur de connexion</strong> utilisé, et les informations de profil qu'il transmet à l'authentification (identifiant technique, et le cas échéant nom et photo de profil, que Relevé n'affiche ni n'utilise).</li>
<li><strong>Dates</strong> : inscription, consentement à la newsletter, désinscription.</li>
<li><strong>Préférences</strong> : newsletter oui ou non, marchés suivis (France, États-Unis), statut de membre fondateur.</li>
<li><strong>Journaux techniques</strong> de connexion tenus par Supabase (adresse IP, date), pour la sécurité du service.</li></ul>
<p>Relevé ne collecte ni mot de passe, ni moyen de paiement, ni historique de navigation.</p></section>

<section><h2>Pourquoi (finalités et bases légales)</h2><ul>
<li><strong>Gérer votre compte</strong> et vous connecter : nécessaire au service que vous demandez (exécution du contrat).</li>
<li><strong>Vous envoyer l'article hebdo</strong> : uniquement avec votre consentement, donné en cochant la case ou en activant l'interrupteur, et retirable à tout moment. La date du consentement est conservée comme preuve.</li>
<li><strong>Honorer le statut de membre fondateur</strong> (un an offert si Relevé devient payant) : engagement pris envers vous à l'inscription.</li></ul></section>

<section><h2>Qui traite vos données (sous-traitants)</h2><ul>
<li><strong>Supabase</strong> : authentification et base de données des comptes. Société américaine ; les transferts hors de l'Union européenne sont encadrés par son accord de traitement des données (clauses contractuelles types de la Commission européenne).</li>
<li><strong>Brevo</strong> (France) : envoi des e-mails (liens de connexion et article hebdo).</li>
<li><strong>GitHub Pages</strong> : hébergement du site. Comme tout hébergeur, GitHub peut journaliser l'adresse IP des visiteurs ; Relevé n'a pas accès à ces journaux.</li>
<li><strong>Google, GitHub, Microsoft, Discord</strong> : seulement si vous choisissez de vous connecter avec eux ; leur propre politique de confidentialité s'applique à cette étape.</li></ul>
<p>Pour s'afficher, le site charge aussi des ressources de tiers, qui voient votre adresse IP comme pour toute page web : la police Inter (Google Fonts), la bibliothèque de connexion (jsDelivr, uniquement sur les pages de compte ou si vous êtes connecté) et les photos de produits (Amazon, boutiques Shopify, sans transmettre l'adresse de la page consultée).</p></section>

<section><h2>Combien de temps</h2>
<p>Vos données sont conservées tant que votre compte existe. Quand vous le supprimez, elles sont effacées immédiatement de la base ; les sauvegardes techniques de l'hébergeur sont écrasées selon son propre cycle de rotation. Une désinscription de la newsletter ne supprime pas le compte.</p></section>

<section><h2>Vos droits</h2><ul>
<li><strong>Accès et rectification</strong> : vos données sont visibles dans <a href="#/compte">Mon compte</a> ; pour corriger votre adresse, reconnectez-vous avec la bonne, ou contactez-nous.</li>
<li><strong>Suppression</strong> : directement depuis <a href="#/compte">Mon compte</a>, bouton « Supprimer mon compte ». Effet immédiat.</li>
<li><strong>Retrait du consentement</strong> : interrupteur dans Mon compte, ou lien de désinscription en un clic présent dans chaque e-mail, sans avoir à vous connecter.</li>
<li><strong>Portabilité, opposition, limitation</strong> : sur simple demande, ${contact}.</li></ul>
<p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL : ${extLink('https://www.cnil.fr/fr/adresser-une-plainte', 'cnil.fr, adresser une plainte')}.</p></section>

<section><h2>Cookies et stockage local</h2>
<p>Relevé ne dépose aucun cookie publicitaire ni traceur. Le site utilise seulement le stockage local de votre navigateur pour vos réglages (thème, marché FR ou US), pour garder votre session ouverte si vous êtes connecté, et, le temps de la connexion, pour retenir que vous avez coché la case newsletter. Ces éléments sont strictement nécessaires et ne quittent pas votre appareil, sauf la session, envoyée à Supabase pour vous identifier.</p></section>
</div>`,
  };
}
