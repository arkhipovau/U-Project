import { attachLazyVideo } from "./lazy-media.js";

/** Autoplay Beyond card videos when visible (Safari-friendly). */
export function initBeyond() {
  document.querySelectorAll(".beyond__video").forEach((video) => attachLazyVideo(video));
}
