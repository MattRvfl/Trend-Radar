# Extension Relevé (Chrome, Edge, Brave)

Sur une page produit, un encart en bas à droite :

- **Amazon** (amazon.fr, amazon.com), automatiquement : la place du produit dans les meilleures ventes
  relevées par Relevé (rang du jour, meilleur rang, jours dans le top 30), un lien vers son historique, et
  « Calculer la rentabilité » avec le prix de la page déjà rempli. L'encart suit le changement de variante.
- **Boutique Shopify**, en cliquant sur l'icône de l'extension : le prix de la variante affichée, si la
  boutique fait partie de celles suivies par Relevé, et « Calculer la rentabilité ».

Permissions : Amazon seulement en permanence ; ailleurs, `activeTab` (l'onglet ouvert, au moment du clic).
L'installation n'affiche donc pas « accès à tous les sites ».

Les données viennent de `site/data/products.json` (généré par `collector/aggregate.py`), téléchargé au
plus une fois toutes les 6 heures ; si le site ne répond pas, la dernière copie sert. L'extension n'envoie
rien : voir la section « Extension navigateur » de la page Confidentialité du site.

## Installer pour tester

1. Télécharger `releve-extension.zip` (publié avec le site : `https://mattrvfl.github.io/Trend-Radar/releve-extension.zip`)
   et le décompresser, ou utiliser directement ce dossier `extension/`.
2. Ouvrir `chrome://extensions` (ou `edge://extensions`), activer **Mode développeur**.
3. **Charger l'extension non empaquetée** → choisir le dossier.

## Publier pour tout le monde

Chrome Web Store : compte développeur (frais uniques de 5 $), puis envoyer le `.zip`. Le formulaire
demande une politique de confidentialité : utiliser `https://mattrvfl.github.io/Trend-Radar/#/confidentialite`.
Edge Add-ons accepte le même `.zip` (gratuit). Safari (Mac, iPhone) demande une conversion via Xcode et un
compte Apple Developer : pas fait pour l'instant.

Avant chaque nouvelle publication, augmenter `version` dans `manifest.json`.
