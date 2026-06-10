import { attachLazyVideo } from "./lazy-media.js";

/** Final CTA background video — load and autoplay when visible. */
export function initCtaFinal() {
  const video = document.querySelector(".cta-final__bg video");
  if (!video) return;
  attachLazyVideo(video, { rootMargin: "200px" });
}
