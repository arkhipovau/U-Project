#!/usr/bin/env bash
# Regenerate delivery assets in assets/opt/
# Full-bleed: up to 1512px JPEG q92 (~3× for 378px + hero bleed). Cards: 620px q90.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/assets"
OPT="$ASSETS/opt"
mkdir -p "$OPT"

FULL_BLEED_MAX=1512
FULL_BLEED_Q=92
CARD_MAX=620
CARD_Q=90
VIDEO_MAX_W=960
VIDEO_CRF=24

echo "→ Full-bleed images (max ${FULL_BLEED_MAX}px, JPEG q${FULL_BLEED_Q})"
for f in "$ASSETS"/enhanced_hero-*.png "$ASSETS"/enhanced_ecosystem-*.png; do
  [[ -f "$f" ]] || continue
  base="$(basename "${f%.png}")"
  sips -Z "$FULL_BLEED_MAX" "$f" --out "$OPT/${base}.jpg" -s format jpeg -s formatOptions "$FULL_BLEED_Q"
done

for f in hero-bg-dubai.jpg hero-bg-cape-town.jpg ecosystem-bg-2.jpg ecosystem-bg-capetown-urban.png \
  ecosystem-bg-alpine.png cta-nature.jpg; do
  [[ -f "$ASSETS/$f" ]] || continue
  base="${f%.*}"
  sips -Z "$FULL_BLEED_MAX" "$ASSETS/$f" --out "$OPT/${base}.jpg" -s format jpeg -s formatOptions "$FULL_BLEED_Q"
done

echo "→ Card / poster images (max ${CARD_MAX}px, JPEG q${CARD_Q})"
for f in days-water.png days-dining.png days-wellness.png beyond-jet.png beyond-yacht.png; do
  [[ -f "$ASSETS/$f" ]] || continue
  base="${f%.*}"
  sips -Z "$CARD_MAX" "$ASSETS/$f" --out "$OPT/${base}.jpg" -s format jpeg -s formatOptions "$CARD_Q"
done

echo "→ Videos (max ${VIDEO_MAX_W}px, H.264 CRF ${VIDEO_CRF})"
for v in kitesurf tropics wellness jet yacht footer; do
  [[ -f "$ASSETS/${v}.mp4" ]] || continue
  ffmpeg -y -i "$ASSETS/${v}.mp4" \
    -vf "scale='min(${VIDEO_MAX_W},iw)':-2" -c:v libx264 -crf "$VIDEO_CRF" -preset slow \
    -movflags +faststart -an "$OPT/${v}.mp4" 2>/dev/null
done

echo "Done. Bump MEDIA_VERSION in js/lazy-media.js after deploy."
ls -lh "$OPT" | tail -n +2
