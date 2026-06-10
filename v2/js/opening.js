import { OPENING_SLIDES } from "./data.js";
import { attachLazyVideo, clearVideoSource, ensureVideoSource } from "./lazy-media.js";

const SLIDE_COUNT = OPENING_SLIDES.length;

const SWIPE_MIN_X = 28;
const SWIPE_LOCK_X = 8;
const SWIPE_LOCK_Y = 8;

function appendSlideVideo(slideEl, slide) {
  const video = document.createElement("video");
  video.className = "opening__bg-media";
  video.dataset.src = slide.video;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.autoplay = false;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "true");
  video.preload = "none";
  video.style.width = `${slide.mediaWidth}px`;
  video.style.left = slide.mediaLeft;
  slideEl.appendChild(video);
  return video;
}

function playActiveVideo(section, index) {
  const slides = section.querySelectorAll(".opening__slide");
  const activeSlide = slides[index];
  const activeVideo = activeSlide?.querySelector("video.opening__bg-media");

  section.querySelectorAll("video.opening__bg-media").forEach((node) => {
    if (node !== activeVideo) clearVideoSource(node);
  });

  if (!activeVideo) return;

  const slide = OPENING_SLIDES[index];
  ensureVideoSource(activeVideo, slide?.video);

  const tryPlay = () => {
    const promise = activeVideo.play();
    if (promise?.catch) promise.catch(() => {});
  };

  if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    tryPlay();
    return;
  }

  activeVideo.addEventListener("loadeddata", tryPlay, { once: true });
}

function syncPill(pillLabel, index) {
  const label = OPENING_SLIDES[index]?.label;
  if (pillLabel && label) pillLabel.textContent = label;
}

export function initOpening() {
  const section = document.querySelector(".opening");
  if (!section) return;

  const slidesRoot = section.querySelector(".opening__slides");
  const prevBtn = section.querySelector(".opening__nav-btn--prev");
  const nextBtn = section.querySelector(".opening__nav-btn--next");
  const pillLabel = section.querySelector(".opening__location-pill .ecosystem__location-pill__label");
  const mediaEl = section.querySelector(".opening__media");
  if (!slidesRoot) return;

  let index = 0;
  let unlockedPlayback = false;
  let sectionVisible = false;

  OPENING_SLIDES.forEach((slide, i) => {
    const slideEl = document.createElement("div");
    slideEl.className = "opening__slide";
    slideEl.setAttribute("role", "group");
    slideEl.setAttribute("aria-hidden", i === 0 ? "false" : "true");

    const inner = document.createElement("div");
    inner.className = `opening__bg-slide opening__bg-slide--${i}`;
    if (slide.video) appendSlideVideo(inner, slide);
    slideEl.appendChild(inner);
    slidesRoot.appendChild(slideEl);
  });

  const slides = [...section.querySelectorAll(".opening__slide")];

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      sectionVisible = entries.some((entry) => entry.isIntersecting);
      if (sectionVisible && unlockedPlayback) playActiveVideo(section, index);
      if (!sectionVisible) {
        section.querySelectorAll("video.opening__bg-media").forEach(clearVideoSource);
      }
    },
    { rootMargin: "200px", threshold: 0.08 }
  );
  sectionObserver.observe(section);

  function render() {
    slides.forEach((el, i) => {
      const active = i === index;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-hidden", active ? "false" : "true");
    });
    syncPill(pillLabel, index);
    if (sectionVisible && unlockedPlayback) playActiveVideo(section, index);
  }

  function stepForward() {
    index = (index + 1) % SLIDE_COUNT;
    render();
  }

  function stepBackward() {
    index = (index - 1 + SLIDE_COUNT) % SLIDE_COUNT;
    render();
  }

  prevBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    stepBackward();
  });

  nextBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    stepForward();
  });

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let gestureLocked = false;
  let horizontalGesture = false;

  mediaEl?.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    gestureLocked = false;
    horizontalGesture = false;

    if (mediaEl.hasPointerCapture && !mediaEl.hasPointerCapture(e.pointerId)) {
      mediaEl.setPointerCapture(e.pointerId);
    }
  });

  mediaEl?.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!gestureLocked && (absX > SWIPE_LOCK_X || absY > SWIPE_LOCK_Y)) {
      gestureLocked = true;
      horizontalGesture = absX > absY * 1.1;
    }

    if (horizontalGesture) e.preventDefault();
  });

  function endSwipe(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (horizontalGesture && absX >= SWIPE_MIN_X && absX > absY) {
      if (dx < 0) stepForward();
      else stepBackward();
    }

    if (mediaEl?.hasPointerCapture?.(e.pointerId)) {
      mediaEl.releasePointerCapture(e.pointerId);
    }

    dragging = false;
    gestureLocked = false;
    horizontalGesture = false;
    pointerId = null;
  }

  mediaEl?.addEventListener("pointerup", endSwipe);
  mediaEl?.addEventListener("pointercancel", endSwipe);
  mediaEl?.addEventListener("pointerleave", endSwipe);

  const unlock = () => {
    if (unlockedPlayback) return;
    unlockedPlayback = true;
    if (sectionVisible) playActiveVideo(section, index);
  };

  mediaEl?.addEventListener("touchstart", unlock, { passive: true, once: true });
  mediaEl?.addEventListener("click", unlock, { once: true });

  render();
}
