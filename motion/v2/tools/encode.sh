#!/usr/bin/env bash
# Assemble le film vertical : images rendues + mixage (voix ElevenLabs, musique, bruitages).
#   bash motion/v2/tools/encode.sh final
# Sorties :
#   out/releve-vertical-1080x1920.mp4   master réseaux sociaux (H.264 High, 60 i/s, AAC 320k, -14 LUFS)
#   out/releve-vertical-web.mp4         version légère (dépôt, aperçus)
#   out/releve-vertical-couverture.jpg  image de couverture (crochet n° 25 → n° 2)
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:-final}"
LIST="out/chunks-${NAME}/list.txt"
AUDIO="out/releve-vertical-mix.wav"
# Grain très léger : tramage des dégradés sombres (évite les aplats en escalier en 8 bits).
VF="noise=alls=2:allf=t,format=yuv420p"
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -i "$AUDIO" -map 0:v -map 1:a \
  -vf "$VF" -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -x264-params aq-mode=3:aq-strength=0.9 \
  -r 60 -g 60 -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest \
  -metadata title="Relevé · les classements du commerce en ligne, relevés chaque matin" \
  -metadata comment="Voix ElevenLabs (Léo), musique originale synthétisée, vraies données Amazon.fr du 3 au 8 oct. 2026" \
  out/releve-vertical-1080x1920.mp4
ffmpeg -y -v error -i out/releve-vertical-1080x1920.mp4 -map 0:v -map 0:a \
  -c:v libx264 -preset slow -crf 23 -profile:v high -level 4.2 -x264-params aq-mode=3 -g 120 \
  -c:a aac -b:a 160k -movflags +faststart out/releve-vertical-web.mp4
ls -la out/*.mp4
