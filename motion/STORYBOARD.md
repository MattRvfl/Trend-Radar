# Relevé : motion design (film de présentation)

Film de 66 s, 1920×1080, 60 i/s. Pas de voix : musique originale composée pour le film, chaque coupe et
chaque animation tombe sur un temps. Tempo **120 BPM** : 1 temps = 0,5 s, 1 mesure = 2 s, 32 mesures.
Tonalité **fa mineur** (Fm9 · D♭maj7 · A♭maj7 · E♭6), une progression par mesure.

Tout ce qui est montré est réel :
- **Données** : relevés du dépôt (3 → 8 oct. 2026), via `site/data` régénéré par `collector.aggregate`.
- **Icônes** : Lucide, Simple Icons (Amazon, Shopify, GitHub), flag-icons, et le sprite SVG du site
  (badges ▲ ▼ ✚, logo, onglets, connexion Google / Microsoft / Discord). Aucune icône dessinée ni générée.
- **Charte** : `design/DESIGN.md` (tokens du thème sombre puis clair, Inter, un seul accent).

## Signature sonore = le logo
Le pictogramme de Relevé est une polyligne `4,14.5 → 8,10 → 11,12 → 16,5.5`. La mélodie-signature la suit
**à la lettre** : abscisses → rythme (écarts 4, 3, 5 doubles-croches : notes à 0, 1, 1¾ et 3 temps),
ordonnées → hauteurs (fa, do, la♭, fa aigu). À l'écran, chaque sommet du logo s'allume sur sa note.

## Découpage (temps = n° de temps depuis le début, 1 temps = 0,5 s)

| Mesures | Temps | Musique | Image |
|---|---|---|---|
| 1-4 | 0-16 | Intro : tic-tac d'horloge, nappe filtrée, sub | Mur 3D de vrais produits classés qui défile. « Chaque matin, » / « des milliers de produits » / « changent de place. » : les lignes s'échangent sur les doubles-croches. |
| 5-8 | 16-32 | Kick, basse, arpège qui s'ouvre, montée | « Qui monte ? » Bosch Série 6 ▲ 18 → n° 6 · « Qui chute ? » Pokémon Mini-boîte ▼ 15 → n° 26 · « Qui débarque ? » Levi's ✚ Nouveau n° 4. Logos Amazon, Shopify, Google : « Les classements sont publics. » / « Mais chaque jour efface la veille. » Silence d'un demi-temps. |
| 9-10 | 32-40 | **Drop 1** : impact + signature sonore | Le logo se construit sommet par sommet sur la mélodie, puis « Relevé » (l'accent aigu tombe sur un tic), slogan officiel. |
| 11-14 | 40-56 | Groove A | « Chaque matin, Relevé lit… » Amazon (17 catégories × top 30, FR + US, icônes en cascade), Shopify (16 boutiques), Google Trends (vraies recherches du 8 oct.). Puis l'historique se remplit jour après jour (jauge de couverture du site). |
| 15-16 | 56-64 | Groove A | Vraie courbe de rang : Philips OneBlade 360, n° 25 → n° 2 en 6 jours, un point par croche. Contrôle Jour · 7 j · 30 j · Mois · Année cliqué sur chaque temps. |
| 17-24 | 64-96 | Groove B (lead, open hats) | Visite du produit dans un navigateur 3D : Aujourd'hui (entrées du jour, hausses), Classements (Jeux et Jouets, passage à 7 j), bascule FR → US, Boutiques, Buzz, téléphone avec vraies alertes push (« Ruée en Beauté et Parfum · France »), article du lundi. Clic sur le bouton de thème : tout passe en clair. |
| 25-28 | 96-112 | Pause : nappe, piano, sub | Thème clair, typographie éditoriale : « Pas de prédiction. » (barré) · « Pas d'estimation de ventes. » (barré) · « Des positions, avec leur source. » + ligne de source · « Un classement n'est pas un volume de ventes. » Montée. |
| 29-32 | 112-128 | **Drop final** puis coda | Retour au sombre, logo + signature sonore, « Ce qui grimpe dans les classements, ce matin. », adresse du site, compte gratuit sans mot de passe (Google, GitHub, Microsoft, Discord, e-mail), membre fondateur : 1 an offert. Le point d'accent s'éteint en dernier. |

## Fabrication
- `tools/extract_data.py` : vraies données → `src/data.js`.
- `tools/build_icons.mjs` : vraies icônes → `src/icons.js`.
- `src/` : la page animée (GSAP en pause, rendu image par image déterministe : `renderFrame(t)`).
- `audio/compose.py` : musique et bruitages synthétisés note par note (numpy + pedalboard), calés sur
  les mêmes repères que l'image (`src/cues.json`).
- `tools/render.mjs` : Chromium (Playwright) capture chaque image, avec flou de mouvement par
  sous-images, puis ffmpeg assemble image + son.
