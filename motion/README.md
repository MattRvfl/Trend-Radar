# Relevé : film de présentation (motion design)

66 s, 1920×1080, 60 i/s, sans voix : musique originale calée à l'image près. Découpage et intentions :
[`STORYBOARD.md`](STORYBOARD.md).

| Fichier (dans `out/`) | Usage |
|---|---|
| `releve-motion-1080p60.mp4` | master (H.264 CRF 15, AAC 320 k) |
| `releve-motion-web.mp4` | version site (H.264 CRF 21, AAC 192 k, lecture progressive) |
| `releve-poster.jpg` | image d'attente de la balise `<video poster>` |
| `releve-musique.wav` | bande-son seule (48 kHz, 24 bits, −14 LUFS, crête −1 dBFS) |

## Ce qui est réel

- **Données** : les relevés du dépôt (3 → 8 oct. 2026) : produits, rangs, variations, boutiques Shopify,
  recherches Google, ruées (alertes push) et article de la semaine, tels que le site les calcule.
- **Icônes** : Lucide, Simple Icons (Amazon, Shopify, GitHub), flag-icons, et le sprite SVG du site.
  Aucune image générée ; les vignettes produit (non téléchargeables ici) sont remplacées par l'icône de catégorie.
- **Interface** : reconstruite d'après `design/DESIGN.md` et le rendu réel du site (thèmes sombre et clair).

## Refaire le film

```bash
cd motion
npm install                                   # GSAP, icônes, polices (aucune dépendance côté site)
pip install pedalboard pyloudnorm scipy numba # synthèse et mastering
cd .. && python -m collector.aggregate && python -m collector.weekly --force && cd motion
python3 tools/extract_data.py                 # vraies données -> src/data.js (depuis la racine : python3 motion/tools/extract_data.py)
node tools/build_icons.mjs                    # vraies icônes -> src/icons.js
python3 -m http.server 8790 &                 # la page est servie depuis motion/
node tools/export_cues.mjs                    # repères sonores posés par l'animation -> src/cues.json
python3 audio/compose.py                      # musique -> out/releve-musique.wav
node tools/render.mjs --fps 60 --sub 4 --workers 4 --name final   # images (flou de mouvement réel)
bash tools/encode.sh final                    # MP4 master + web + affiche
```

Aperçu en temps réel dans un navigateur : `http://localhost:8790/src/index.html?play`
(ou `?t=12.5` pour une image fixe).

## Comment c'est fait

- **Image** : une page HTML de 1920×1080 ; toute l'animation est une timeline GSAP en pause.
  `renderFrame(t)` place chaque élément à l'instant `t`, Chromium capture, ffmpeg assemble.
  Chaque image est la moyenne de 4 sous-images réparties sur un obturateur à 180° : vrai flou de mouvement.
- **Son** : `audio/compose.py` synthétise chaque note (kick, clap, charleys, sous-basse, basse « reese »,
  nappe supersaw, arpège pincé, cloche FM, piano électrique), puis les ~130 bruitages aux instants exacts
  déclarés par l'animation (`cue()` dans le code des scènes). Tempo 120 BPM : 1 temps = 30 images.
- **Signature sonore** : la mélodie du logo suit sa polyligne `4,14.5 → 8,10 → 11,12 → 16,5.5`
  (abscisses = rythme, ordonnées = hauteurs) ; chaque sommet s'allume sur sa note.
