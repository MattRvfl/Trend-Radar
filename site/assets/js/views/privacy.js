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
<li>Sans compte, Relevé ne collecte aucune donnée personnelle : pas de cookie publicitaire, pas de mesure d'audience. Seule exception, si vous activez les notifications : l'abonnement technique de votre appareil.</li>
<li>Avec un compte : votre adresse e-mail et vos préférences, rien de plus. Jamais revendues, jamais utilisées pour de la publicité.</li>
<li>La newsletter n'est envoyée que si vous l'avez demandée. Vous supprimez votre compte vous-même, en deux clics.</li>
<li>Les notifications ne sont activées que si vous les demandez, appareil par appareil, et se désactivent à tout moment.</li></ul></section>

<section><h2>Qui est responsable</h2>
<p>Relevé est un projet personnel, non commercial à ce jour. Son éditeur est responsable du traitement des données décrites ici. Pour le joindre : ${contact}.</p></section>

<section><h2>Données collectées</h2>
<p>Uniquement si vous créez un compte :</p><ul>
<li><strong>Adresse e-mail</strong>, transmise par vous (lien de connexion) ou par le service choisi (Google, GitHub, Microsoft ou Discord).</li>
<li><strong>Fournisseur de connexion</strong> utilisé, et les informations de profil qu'il transmet à l'authentification (identifiant technique, et le cas échéant nom et photo de profil, que Relevé n'affiche ni n'utilise).</li>
<li><strong>Dates</strong> : inscription, consentement à la newsletter, désinscription.</li>
<li><strong>Préférences</strong> : newsletter oui ou non, marchés suivis (France, États-Unis), statut de membre fondateur.</li>
<li><strong>Journaux techniques</strong> de connexion tenus par Supabase (adresse IP, date), pour la sécurité du service.</li></ul>
<p>Avec ou sans compte, si vous activez les notifications : l'abonnement de l'appareil (détail dans la section <strong>Notifications</strong>).</p>
<p>Relevé ne collecte ni mot de passe, ni moyen de paiement, ni historique de navigation.</p></section>

<section><h2>Pourquoi (finalités et bases légales)</h2><ul>
<li><strong>Gérer votre compte</strong> et vous connecter : nécessaire au service que vous demandez (exécution du contrat).</li>
<li><strong>Vous envoyer l'article hebdo</strong> : uniquement avec votre consentement, donné en cochant la case ou en activant l'interrupteur, et retirable à tout moment. La date du consentement est conservée comme preuve.</li>
<li><strong>Honorer le statut de membre fondateur</strong> (un an offert si Relevé devient payant) : engagement pris envers vous à l'inscription.</li></ul></section>

<section><h2>Qui traite vos données (sous-traitants)</h2><ul>
<li><strong>Supabase</strong> : authentification et base de données des comptes. Société américaine ; les transferts hors de l'Union européenne sont encadrés par son accord de traitement des données (clauses contractuelles types de la Commission européenne).</li>
<li><strong>Brevo</strong> (France) : envoi des e-mails (liens de connexion et article hebdo).</li>
<li><strong>GitHub Pages</strong> : hébergement du site. Comme tout hébergeur, GitHub peut journaliser l'adresse IP des visiteurs ; Relevé n'a pas accès à ces journaux.</li>
<li><strong>Google, GitHub, Microsoft, Discord</strong> : seulement si vous choisissez de vous connecter avec eux ; leur propre politique de confidentialité s'applique à cette étape.</li>
<li><strong>Services push des navigateurs</strong> : seulement si vous activez les notifications (voir plus bas).</li></ul>
<p>Pour s'afficher, le site charge aussi des ressources de tiers, qui voient votre adresse IP comme pour toute page web : la police Inter (Google Fonts), la bibliothèque de connexion (jsDelivr, uniquement sur les pages de compte ou si vous êtes connecté) et les photos de produits (Amazon, boutiques Shopify, sans transmettre l'adresse de la page consultée).</p></section>

<section><h2>Combien de temps</h2>
<p>Vos données sont conservées tant que votre compte existe. Quand vous le supprimez, elles sont effacées immédiatement de la base ; les sauvegardes techniques de l'hébergeur sont écrasées selon son propre cycle de rotation. Une désinscription de la newsletter ne supprime pas le compte.</p></section>

<section><h2>Vos droits</h2><ul>
<li><strong>Accès et rectification</strong> : vos données sont visibles dans <a href="#/compte">Mon compte</a> ; pour corriger votre adresse, reconnectez-vous avec la bonne, ou contactez-nous.</li>
<li><strong>Suppression</strong> : directement depuis <a href="#/compte">Mon compte</a>, bouton « Supprimer mon compte ». Effet immédiat.</li>
<li><strong>Retrait du consentement</strong> : interrupteur dans Mon compte, ou lien de désinscription en un clic présent dans chaque e-mail, sans avoir à vous connecter.</li>
<li><strong>Portabilité, opposition, limitation</strong> : sur simple demande, ${contact}.</li></ul>
<p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL : ${extLink('https://www.cnil.fr/fr/adresser-une-plainte', 'cnil.fr, adresser une plainte')}.</p></section>

<section><h2>Notifications</h2>
<p>Si vous activez les notifications sur un appareil (téléphone, ordinateur, application installée), Relevé conserve, pour cet appareil seulement :</p><ul>
<li>l'<strong>adresse technique d'abonnement</strong> fournie par votre navigateur (une adresse chez son service push, qui ne révèle ni votre nom ni votre adresse e-mail) et les <strong>clés de chiffrement</strong> qui l'accompagnent, pour que seul votre appareil puisse lire les messages ;</li>
<li>les <strong>sujets</strong> choisis (article de la semaine, ruées détectées) et les <strong>marchés</strong> (France, États-Unis) ;</li>
<li>la <strong>date</strong> d'activation, et un compteur d'échecs d'envoi ;</li>
<li>si vous êtes connecté au moment de l'activation, le lien avec votre compte (l'abonnement est alors effacé avec lui).</li></ul>
<p>Base légale : votre consentement, donné en autorisant les notifications. Vous les désactivez à tout moment depuis <a href="#/compte">Mon compte</a>, depuis l'encart des articles, ou dans les réglages de votre navigateur ou de votre téléphone. Désactiver efface l'abonnement chez nous ; un abonnement que le navigateur déclare expiré est effacé automatiquement au premier envoi qui échoue.</p>
<p>Les messages transitent, chiffrés, par le service push de votre navigateur, qui agit comme sous-traitant pour la seule livraison : <strong>Google</strong> pour Chrome, Edge et Android, <strong>Apple</strong> pour Safari sur iPhone, iPad et Mac, <strong>Mozilla</strong> pour Firefox. Ces services ne peuvent pas lire le contenu des messages.</p></section>

<section><h2>Cookies et stockage</h2>
<p>Relevé n'affiche pas de bannière de cookies, parce qu'il n'utilise que du stockage strictement nécessaire au service que vous demandez, exempté de consentement selon la CNIL : aucun traceur publicitaire, aucune mesure d'audience ou de statistique. Ce stockage, dans votre navigateur, sert à :</p><ul>
<li>garder votre <strong>session de connexion</strong> ouverte si vous êtes connecté (envoyée à Supabase pour vous identifier) ;</li>
<li>retenir vos <strong>préférences d'affichage</strong> : thème, marché FR ou US, encart d'installation refermé ;</li>
<li>retenir, le temps de la connexion, que vous avez coché la case newsletter ;</li>
<li>retenir les <strong>frais saisis dans le calculateur de rentabilité</strong> (commission, frais fixes, livraison, TVA), pour ne pas les retaper. Les prix et coûts de vos produits ne sont ni enregistrés ni envoyés : le calcul se fait dans votre navigateur ;</li>
<li>gérer votre <strong>abonnement aux notifications</strong> sur cet appareil (sujets et marchés choisis), et garder une copie des pages et des derniers relevés pour que l'application s'ouvre même hors connexion.</li></ul>
<p>Pour adapter l'écran de connexion (un code à saisir sur téléphone, un lien sur ordinateur) et l'encart d'installation, le site lit localement le type de votre appareil (téléphone ou ordinateur, application installée ou non). Cette information n'est jamais enregistrée ni envoyée.</p></section>

<section><h2>Extension navigateur</h2>
<p>L'extension Relevé s'affiche d'elle-même sur les pages d'Amazon (amazon.fr, amazon.com). Sur un autre site, par exemple une boutique Shopify, elle ne fait rien tant que vous ne cliquez pas sur son icône. Elle lit sur la page affichée l'identifiant, le titre et le prix du produit ; dans une boutique Shopify, elle demande pour cela à la boutique la fiche publique du produit (l'adresse de la page suivie de « .js »), comme le fait la page elle-même.</p>
<p>Pour afficher la place du produit dans les classements, elle télécharge les fichiers publics de Relevé, au plus une fois toutes les six heures, et en garde une copie sur votre ordinateur. Elle n'envoie ni les pages visitées, ni votre historique, ni aucun identifiant : le lien « Calculer la rentabilité » transmet le titre et le prix dans la partie de l'adresse après « # », que le navigateur garde pour lui, et ses liens n'indiquent pas la page d'où vous venez.</p></section>
</div>`,
  };
}
