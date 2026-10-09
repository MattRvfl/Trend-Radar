#!/usr/bin/env bash
# Assemble les morceaux rendus + la musique : master (haute qualité) et version web (légère, démarrage rapide).
#   bash tools/encode.sh final
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:-final}"
LIST="out/chunks-${NAME}/list.txt"
AUDIO="out/releve-musique.wav"
# Grain très léger : tramage des dégradés sombres (évite les aplats en escalier en 8 bits).
VF="noise=alls=2:allf=t,format=yuv420p"
ffmpeg -y -v error -stats -f concat -safe 0 -i "$LIST" -i "$AUDIO" -map 0:v -map 1:a \
  -vf "$VF" -c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -x264-params aq-mode=3:aq-strength=0.9 \
  -r 60 -g 120 -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest \
  -metadata title="Relevé · motion design" -metadata comment="Musique originale synthétisée, vraies données du 3 au 8 oct. 2026" \
  out/releve-motion-1080p60.mp4
ffmpeg -y -v error -stats -i out/releve-motion-1080p60.mp4 -map 0:v -map 0:a \
  -c:v libx264 -preset slow -crf 21 -profile:v high -level 4.2 -x264-params aq-mode=3 -g 120 \
  -c:a aac -b:a 192k -movflags +faststart out/releve-motion-web.mp4
# Affiche (image de couverture) : la carte de fin.
ffmpeg -y -v error -ss 61.5 -i out/releve-motion-1080p60.mp4 -frames:v 1 -q:v 2 out/releve-poster.jpg
ls -la out/*.mp4 out/*.jpg
