# Mise en route : comptes, connexion et newsletter

Tout est gratuit. Compte environ 30 minutes. Fais les étapes dans l'ordre : chaque étape donne une valeur
utilisée par la suivante. **Ne colle jamais la clé secrète Supabase ni la clé SMTP dans une conversation** :
elles vont uniquement dans les secrets GitHub (étape 5).

Dans ce guide, `<REF>` désigne l'identifiant de ton projet Supabase (dans son URL : `https://<REF>.supabase.co`).
L'adresse de retour à donner à chaque fournisseur de connexion est :

    https://<REF>.supabase.co/auth/v1/callback

---

## 1. Supabase (comptes + base de données)

1. https://supabase.com → **Start your project** → connexion avec GitHub.
2. **New project** : nom `releve`, mot de passe de base de données (génère-le et garde-le), région
   **West EU (Paris)**, plan **Free**.
3. **SQL Editor** → **New query** → colle tout le contenu de `supabase/schema.sql` → **Run**
   (« Success. No rows returned »).
4. **Project Settings → API Keys** : note
   - l'URL du projet `https://<REF>.supabase.co` ;
   - la clé **publishable** (`sb_publishable_…`) — elle est publique, tu peux me l'envoyer ;
   - la clé **secret** (`sb_secret_…`) — **privée**, pour l'étape 5 seulement.
5. **Authentication → URL Configuration** :
   - Site URL : `https://mattrvfl.github.io/Trend-Radar/`
   - Redirect URLs : ajoute `https://mattrvfl.github.io/Trend-Radar/**` et `http://localhost:8080/**`

## 2. Brevo (envoi des e-mails)

1. https://www.brevo.com → inscription gratuite.
2. **Senders, domains & dedicated IPs → Senders → Add a sender** : ton adresse e-mail, nom « Relevé »,
   puis valide le code reçu. Sans nom de domaine à toi, Brevo remplacera l'adresse visible par
   `…@brevosend.com` : c'est normal et ça fonctionne.
3. **SMTP & API → SMTP** → **Generate a new SMTP key**. Note le **login** (`…@smtp-brevo.com`) et la **clé**.
4. Retour dans Supabase : **Authentication → Emails → SMTP Settings** → active **Custom SMTP** :
   - Host `smtp-relay.brevo.com`, port `587`
   - Username : le login Brevo, Password : la clé SMTP
   - Sender email : l'adresse validée à l'étape 2, Sender name : `Relevé`
5. Toujours dans **Authentication → Emails → Templates → Magic link** : sujet
   `Votre lien de connexion à Relevé` et corps :

   ```html
   <p>Bonjour,</p>
   <p><a href="{{ .ConfirmationURL }}">Se connecter à Relevé</a></p>
   <p>Ouvrez ce lien dans le navigateur où vous l'avez demandé. Il expire dans une heure.</p>
   <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
   ```

## 3. Fournisseurs de connexion

Dans Supabase : **Authentication → Sign In / Providers**. « Email » est déjà actif (lien magique).
Pour chacun ci-dessous, crée l'application chez le fournisseur avec l'adresse de retour
`https://<REF>.supabase.co/auth/v1/callback`, puis colle **Client ID** et **Client Secret** dans Supabase
et active le fournisseur.

- **Google** — https://console.cloud.google.com → crée un projet → **Google Auth Platform** :
  écran de consentement (type *External*, nom « Relevé », ton e-mail), puis **Clients → Create client** →
  *Web application* → **Authorized redirect URIs** = l'adresse de retour.
- **GitHub** — https://github.com/settings/developers → **New OAuth App** → Homepage URL
  `https://mattrvfl.github.io/Trend-Radar/`, Authorization callback URL = l'adresse de retour →
  **Generate a new client secret**.
- **Microsoft** (fournisseur « Azure » dans Supabase) — https://portal.azure.com → **Microsoft Entra ID →
  App registrations → New registration** → comptes « any organizational directory and personal Microsoft
  accounts » → Redirect URI *Web* = l'adresse de retour → **Certificates & secrets → New client secret**
  (copie la *Value*). Client ID = *Application (client) ID*. Laisse « Azure Tenant URL » vide.
- **Discord** — https://discord.com/developers/applications → **New Application** → **OAuth2** →
  ajoute l'adresse de retour dans *Redirects*, copie *Client ID*, **Reset Secret** pour le secret.

Un fournisseur non configuré n'empêche pas les autres de fonctionner.

## 4. Envoie-moi (sans risque, ce sont des valeurs publiques)

- l'URL du projet Supabase ;
- la clé **publishable** ;
- l'adresse de contact à afficher sur la page Confidentialité (facultatif).

Je les mets dans `site/assets/js/config.js`.

## 5. Secrets GitHub (pour la newsletter automatique)

Dépôt GitHub → **Settings → Secrets and variables → Actions → New repository secret**, cinq fois :

| Nom | Valeur |
|---|---|
| `SUPABASE_URL` | `https://<REF>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé **secret** `sb_secret_…` |
| `SMTP_LOGIN` | le login SMTP Brevo |
| `SMTP_PASSWORD` | la clé SMTP Brevo |
| `NEWSLETTER_FROM` | `Relevé <ton-adresse-validée-chez-brevo>` |

Sans ces secrets, le site marche quand même : la newsletter ne part simplement pas (le robot l'indique).

## Fonctionnement ensuite

- Chaque lundi vers 7 h : l'article de la semaine est généré (dès 5 jours de relevés), publié sur le site
  puis envoyé aux inscrits. Un numéro n'est jamais envoyé deux fois.
- Ton édito : voir `editorial/README.md`.
- Limite gratuite Brevo : 300 e-mails par jour (le robot s'arrête à 290 pour garder de la marge pour les
  liens de connexion).
- Au passage payant : tous les comptes existants ont `founding_member = true` → un an offert.
