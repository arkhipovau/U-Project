import { applyVideoPoster, ensureVideoSource } from "./lazy-media.js";

/** Final CTA background video — load and autoplay when the section is visible. */
export function initCtaFinal() {
  const section = document.querySelector(".cta-final");
  const video = section?.querySelector("video");
  if (!section || !video) return;

  const rawSrc = video.dataset.src;
  if (!rawSrc) return;

  applyVideoPoster(video);

  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "true");
  video.preload = "metadata";

  let unlocked = false;
  let visible = false;

  const tryPlay = () => {
    if (!visible && !unlocked) return;

    ensureVideoSource(video, rawSrc);

    const start = () => {
      const promise = video.play();
      if (promise?.catch) {
        promise.catch(() => {
          if (unlocked) video.play().catch(() => {});
        });
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      start();
      return;
    }

    const onReady = () => {
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("loadeddata", onReady);
      start();
    };

    video.addEventListener("canplay", onReady);
    video.addEventListener("loadeddata", onReady);
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    tryPlay();
  };

  document.addEventListener("pointerdown", unlock, { passive: true, once: true });
  document.addEventListener("touchstart", unlock, { passive: true, once: true });

  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) tryPlay();
      else if (!video.paused) video.pause();
    },
    { threshold: 0.08, rootMargin: "200px 0px 120px 0px" },
  );

  observer.observe(section);
}
