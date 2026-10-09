# Relevé · film vertical avec voix off (v2)

Version « réseaux sociaux » du motion design de Relevé : **1080 × 1920, 60 i/s, 36,5 s**, voix off ElevenLabs,
musique originale sans voix chantée, bruitages synchronisés, sous-titres incrustés mot à mot.
Pensée pour TikTok, Reels et Shorts (et LinkedIn, X), là où la v1 (16:9, 66 s, musique seule) sert le site.

## Ce qui est réel

- **Données** : uniquement les relevés du dépôt (`data/snapshots/2026/`, 3 → 8 oct. 2026).
  - Crochet : Philips OneBlade 360, Hygiène et Santé (Amazon.fr) : n° 25 → 18 → 12 → 11 → 3 → 2.
  - Liste qui se réordonne : vrais top 6 Hygiène et Santé, jour après jour.
  - Mouvements du 8 oct. : Bosch Série 6 ▲ 18, Pokémon Mini-boîte ▼ 15, Levi's entre en n° 4.
  - Stat : vrai top 10 Beauté et Parfum du 8 oct. (Medicube aux places 2, 4, 6, 7, 8, 9, 10).
  - Notification : vraie « ruée » calculée par `collector.weekly.find_rushes`.
- **Icônes** : Lucide, Simple Icons, flag-icons et le sprite SVG du site lui-même. Aucune image générée,
  aucune photo produit téléchargée (la vignette montre l'icône de la catégorie, comme le site).
- **Voix** : ElevenLabs, voix « Léo – Energetic & Engaging », modèle `eleven_v4` (prise B sur 3),
  minutage mot à mot par ElevenLabs Scribe (`assets/vo-leo-takeB-words.json`).

## Synchronisation

Le tempo (118,4 BPM) est calé sur la voix : les deux « Relevé » tombent exactement sur les temps 22 et 62,
le drop sur « Alors », le rang 25 sur « vingt-cinquième », le n° 2 sur « deuxième ».
Chaque animation qui mérite un son déclare un repère (`cue()`), exporté dans `src/cues.json` et lu par le
mixage : image et son tombent sur la même milliseconde. Les sous-titres affichent chaque mot 40 ms avant
son attaque. La musique cède sous la voix (compression en trois bandes pilotée par la voix : -9 dB dans les
médiums, -3,5 dB dans les graves) ; écart mesuré pendant la parole : voix 8 LU au-dessus du fond.

## Fabriquer

```bash
python3 -m http.server 8790 --directory motion &          # la page est servie depuis motion/
cd motion
npm run v2:data       # données réelles + icônes (déjà générées dans src/)
npm run v2:cues       # repères sonores -> v2/src/cues.json
npm run v2:mix        # musique + bruitages + voix -> v2/out/releve-vertical-mix.wav (-14 LUFS)
npm run v2:render     # 2 189 images, 4 sous-images par image (flou de mouvement réel)
npm run v2:encode     # -> v2/out/releve-vertical-1080x1920.mp4 et releve-vertical-web.mp4
npm run v2:cover      # -> v2/out/releve-vertical-couverture.jpg
```

Aperçu d'une image : `node v2/tools/stills.mjs /tmp/st b20` (temps en battements, ou en secondes sans « b »).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/core.js` | timeline maîtresse GSAP (en pause), tempo, repères, secousses, coups d'échelle |
| `src/captions.js` | sous-titres mot à mot, chiffres en chiffres, mots clés en couleur, barrés |
| `src/scenes/s1-hook.js` | crochet (rang en rouleau 25 → 2) puis le problème (liste qui bouge, historique effacé) |
| `src/scenes/s3-drop.js` | drop, six relevés, logo construit sur la signature sonore |
| `src/scenes/s4-sources.js` | Amazon, Shopify, Google Trends ; 17 catégories ; France et États-Unis |
| `src/scenes/s5-movers.js` | qui monte, qui chute, qui débarque |
| `src/scenes/s6-medicube.js` | 7 des 10 premières places, la rafle, la notification |
| `src/scenes/s8-honest.js` | méthode (thème clair) : ni prédiction ni estimation, le vrai classement et sa source |
| `src/scenes/s9-end.js` | logo, compte gratuit, adresse du site ; fin bouclable |
| `audio/compose2.py` | musique, bruitages, traitement de la voix, mixage, -14 LUFS |
| `out/releve-vertical.srt` | sous-titres pour YouTube / LinkedIn |
