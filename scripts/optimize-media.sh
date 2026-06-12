#!/usr/bin/env bash
# Regenerate delivery assets in assets/opt/
# Full-bleed: up to 2048px JPEG q96 (hero/ecosystem Retina + 128% bleed). Cards: 620px q90.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/assets"
OPT="$ASSETS/opt"
mkdir -p "$OPT"

FULL_BLEED_MAX=2048
FULL_BLEED_Q=96
CARD_MAX=620
CARD_Q=90
VIDEO_MAX_W=1080
VIDEO_CRF=16
VIDEO_PRESET=slow
WEBM_CRF=32
WEBM_CPU=2

if ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libvpx-vp9; then
  echo "⚠ ffmpeg lacks libvpx-vp9 — skipping WebM (conda-forge: conda install -c conda-forge ffmpeg)" >&2
  encode_webm() { :; }
else
  encode_webm() {
    local input="$1"
    local output="$2"
    local max_w="${3:-$VIDEO_MAX_W}"
    ffmpeg -y -i "$input" \
      -vf "scale='min(${max_w},iw)':-2:flags=lanczos" \
      -c:v libvpx-vp9 -crf "$WEBM_CRF" -b:v 0 -row-mt 1 \
      -deadline good -cpu-used "$WEBM_CPU" \
      -an "$output"
  }
fi

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
for f in days-water.png days-dining.png days-wellness.png beyond-jet.png beyond-yacht.png \
  opening-kite.jpg opening-tropics.jpg opening-wellness.jpg; do
  [[ -f "$ASSETS/$f" ]] || continue
  base="${f%.*}"
  case "$base" in
    opening-kite) out="opening-kitesurf" ;;
    opening-tropics) out="opening-tropics" ;;
    opening-wellness) out="opening-wellness" ;;
    *) out="$base" ;;
  esac
  sips -Z "$CARD_MAX" "$ASSETS/$f" --out "$OPT/${out}.jpg" -s format jpeg -s formatOptions "$CARD_Q"
done

echo "→ Videos (max ${VIDEO_MAX_W}px, H.264 CRF ${VIDEO_CRF}, ${VIDEO_PRESET})"
for v in kitesurf tropics wellness jet yacht; do
  [[ -f "$ASSETS/${v}.mp4" ]] || continue
  ffmpeg -y -i "$ASSETS/${v}.mp4" \
    -vf "scale='min(${VIDEO_MAX_W},iw)':-2:flags=lanczos" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf "$VIDEO_CRF" -preset "$VIDEO_PRESET" \
    -movflags +faststart -an "$OPT/${v}.mp4" 2>/dev/null
  encode_webm "$OPT/${v}.mp4" "$OPT/${v}.webm"
done

echo "→ WebM delivery (VP9 CRF ${WEBM_CRF})"

if [[ -f "$ASSETS/footer.mp4" ]]; then
  echo "→ Footer / CTA video (stream copy + faststart, no re-encode)"
  ffmpeg -y -i "$ASSETS/footer.mp4" -c:v copy -movflags +faststart -an "$ASSETS/footer-faststart.mp4" 2>/dev/null \
    && mv "$ASSETS/footer-faststart.mp4" "$ASSETS/footer.mp4"
  ffmpeg -y -i "$ASSETS/footer.mp4" -vf "scale='min(2048,iw)':-2:flags=lanczos" -vframes 1 -q:v 2 \
    "$OPT/cta-footer-poster.jpg" 2>/dev/null
  encode_webm "$ASSETS/footer.mp4" "$ASSETS/footer.webm" 2048
fi

echo "Done. Bump MEDIA_VERSION in js/lazy-media.js after deploy."
ls -lh "$OPT" | tail -n +2
