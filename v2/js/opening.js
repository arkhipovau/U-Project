import { OPENING_SLIDES } from "./data.js";
import { clearVideoSource, ensureVideoSource, resolvePosterUrl } from "./lazy-media.js";

const SLIDE_COUNT = OPENING_SLIDES.length;

const SWIPE_COMMIT_RATIO = 0.12;
const SWIPE_COMMIT_MIN = 10;
const SWIPE_FLICK_VELOCITY = 0.24;
const SWIPE_DIRECTION_RATIO = 0.72;
const SWIPE_LOCK_PX = 4;
const EDGE_RESISTANCE = 0.32;

function appendSlideVideo(slideEl, slide) {
  const video = document.createElement("video");
  video.className = "opening__bg-media";
  video.dataset.src = slide.video;
  if (slide.poster) video.poster = resolvePosterUrl(slide.poster);
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

function getVideoBufferedPercent(video) {
  if (!video?.buffered?.length) return 0;

  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  let bufferedEnd = 0;
  for (let i = 0; i < video.buffered.length; i += 1) {
    bufferedEnd = Math.max(bufferedEnd, video.buffered.end(i));
  }

  return Math.min(100, Math.round((bufferedEnd / duration) * 100));
}

function getVideoLoadPercent(video) {
  if (!video?.src) return 0;

  const buffered = getVideoBufferedPercent(video);
  if (buffered > 0) return buffered;

  if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return 100;
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return 72;
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return 48;
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return 24;

  return 8;
}

function getVideoPlaybackPercent(video) {
  const duration = video?.duration;
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  return Math.min(100, (video.currentTime / duration) * 100);
}

function resetProgressFill(section) {
  const fill = section.querySelector(".opening__progress-fill");
  const progress = section.querySelector(".opening__progress");
  if (fill) {
    fill.style.width = "0%";
    fill.classList.remove("is-playing", "is-loading");
  }
  progress?.setAttribute("aria-valuenow", "0");
  progress?.classList.remove("is-loading");
}

function syncProgressUI(section, index) {
  const progress = section.querySelector(".opening__progress");
  const fill = section.querySelector(".opening__progress-fill");
  const items = [...section.querySelectorAll(".opening__progress-item")];
  const tabs = [...section.querySelectorAll(".opening__tab")];
  const label = OPENING_SLIDES[index]?.label || "";

  tabs.forEach((tab, tabIndex) => {
    const isActive = tabIndex === index;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  if (progress) {
    progress.dataset.active = String(index);
    progress.setAttribute(
      "aria-label",
      label ? `${label}, video loading` : "Video loading",
    );
  }

  items.forEach((item, i) => {
    const isActive = i === index;
    item.classList.toggle("is-active", isActive);

    if (isActive && fill) {
      const track = item.querySelector(".opening__progress-track");
      if (track && fill.parentElement !== track) {
        track.appendChild(fill);
        fill.style.width = "0%";
      }
    }
  });
}

function bindVideoProgress(section, video) {
  const progress = section.querySelector(".opening__progress");
  const fill = section.querySelector(".opening__progress-fill");
  if (!fill || !video) return () => {};

  let rafId = 0;
  let playbackRafId = 0;

  const isVideoLoading = () => {
    if (!video.src) return false;

    const loadPct = getVideoLoadPercent(video);
    return loadPct < 100 && video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA;
  };

  const stopPlaybackLoop = () => {
    if (!playbackRafId) return;
    cancelAnimationFrame(playbackRafId);
    playbackRafId = 0;
  };

  const startPlaybackLoop = () => {
    if (playbackRafId || !video.src || video.paused || isVideoLoading()) return;

    const tick = () => {
      if (!video.src || video.paused || isVideoLoading()) {
        playbackRafId = 0;
        return;
      }

      const pct = getVideoPlaybackPercent(video);
      fill.style.width = `${pct}%`;
      progress?.setAttribute("aria-valuenow", String(Math.round(pct)));
      playbackRafId = requestAnimationFrame(tick);
    };

    playbackRafId = requestAnimationFrame(tick);
  };

  const update = () => {
    rafId = 0;

    if (!video.src) {
      stopPlaybackLoop();
      fill.style.width = "0%";
      fill.classList.remove("is-playing", "is-loading");
      progress?.setAttribute("aria-valuenow", "0");
      progress?.classList.remove("is-loading");
      return;
    }

    const loading = isVideoLoading();
    progress?.classList.toggle("is-loading", loading);
    fill.classList.toggle("is-loading", loading);
    fill.classList.toggle("is-playing", !loading);

    if (loading) {
      stopPlaybackLoop();
      const pct = getVideoLoadPercent(video);
      fill.style.width = `${pct}%`;
      progress?.setAttribute("aria-valuenow", String(Math.round(pct)));
      return;
    }

    const pct = getVideoPlaybackPercent(video);
    fill.style.width = `${pct}%`;
    progress?.setAttribute("aria-valuenow", String(Math.round(pct)));
    startPlaybackLoop();
  };

  const scheduleUpdate = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(update);
  };

  const events = [
    "loadstart",
    "progress",
    "loadedmetadata",
    "durationchange",
    "canplay",
    "canplaythrough",
    "waiting",
    "playing",
    "pause",
    "seeking",
    "seeked",
    "ended",
  ];

  events.forEach((eventName) => {
    video.addEventListener(eventName, scheduleUpdate);
  });

  scheduleUpdate();

  return () => {
    stopPlaybackLoop();
    if (rafId) cancelAnimationFrame(rafId);
    events.forEach((eventName) => {
      video.removeEventListener(eventName, scheduleUpdate);
    });
    resetProgressFill(section);
  };
}

let unbindVideoProgress = null;

function preloadSlideVideo(slides, slideIndex) {
  if (slideIndex < 0 || slideIndex >= SLIDE_COUNT) return;
  const video = slides[slideIndex]?.querySelector("video.opening__bg-media");
  const slide = OPENING_SLIDES[slideIndex];
  if (video && slide?.video) ensureVideoSource(video, slide.video);
}

function playActiveVideo(section, slides, index) {
  const activeSlide = slides[index];
  const activeVideo = activeSlide?.querySelector("video.opening__bg-media");

  if (unbindVideoProgress) {
    unbindVideoProgress();
    unbindVideoProgress = null;
  }

  slides.forEach((slideEl, i) => {
    const video = slideEl.querySelector("video.opening__bg-media");
    if (!video || video === activeVideo) return;
    if (Math.abs(i - index) > 1) clearVideoSource(video);
  });

  resetProgressFill(section);

  if (!activeVideo) return;

  const slide = OPENING_SLIDES[index];
  ensureVideoSource(activeVideo, slide?.video);
  unbindVideoProgress = bindVideoProgress(section, activeVideo);

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

export function initOpening() {
  const section = document.querySelector(".opening");
  if (!section) return;

  const slidesRoot = section.querySelector(".opening__slides");
  const swipeSurface = section.querySelector(".opening__sticky");
  if (!slidesRoot || !swipeSurface) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let index = 0;
  let unlockedPlayback = false;
  let sectionVisible = false;
  let stageWidth = slidesRoot.getBoundingClientRect().width || 1;

  const track = document.createElement("div");
  track.className = "opening__track";
  slidesRoot.appendChild(track);

  OPENING_SLIDES.forEach((slide, i) => {
    const slideEl = document.createElement("div");
    slideEl.className = "opening__slide";
    slideEl.setAttribute("role", "group");
    slideEl.setAttribute("aria-hidden", i === 0 ? "false" : "true");

    const inner = document.createElement("div");
    inner.className = `opening__bg-slide opening__bg-slide--${i}`;
    if (slide.video) appendSlideVideo(inner, slide);
    slideEl.appendChild(inner);
    track.appendChild(slideEl);
  });

  const slides = [...track.querySelectorAll(".opening__slide")];

  function syncSlideStates() {
    slides.forEach((el, i) => {
      const active = i === index;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-hidden", active ? "false" : "true");
    });
  }

  function syncTrackPosition(dragPx = 0) {
    const resist = (value) => {
      if (index === 0 && value > 0) return value * EDGE_RESISTANCE;
      if (index === SLIDE_COUNT - 1 && value < 0) return value * EDGE_RESISTANCE;
      return value;
    };

    const offset = resist(dragPx);
    track.style.transform = `translate3d(calc(-${index * 100}% + ${offset}px), 0, 0)`;
  }

  function refreshStageWidth() {
    stageWidth = slidesRoot.getBoundingClientRect().width || stageWidth || 1;
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      sectionVisible = entries.some((entry) => entry.isIntersecting);
      if (sectionVisible && unlockedPlayback) playActiveVideo(section, slides, index);
      if (!sectionVisible) {
        if (unbindVideoProgress) {
          unbindVideoProgress();
          unbindVideoProgress = null;
        }
        section.querySelectorAll("video.opening__bg-media").forEach(clearVideoSource);
      }
    },
    { rootMargin: "200px", threshold: 0.08 },
  );
  sectionObserver.observe(section);

  function goTo(nextIndex, dragPx = 0) {
    index = ((nextIndex % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;
    track.classList.remove("is-dragging");
    syncSlideStates();
    syncTrackPosition(dragPx);
    syncProgressUI(section, index);
    if (sectionVisible && unlockedPlayback) playActiveVideo(section, slides, index);
  }

  section.querySelectorAll(".opening__tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = Number(tab.dataset.index);
      if (Number.isNaN(target) || target === index) return;
      goTo(target);
    });
  });

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let dragging = false;
  let gestureLocked = false;
  let horizontalGesture = false;

  function isInteractiveTarget(target) {
    return target instanceof Element && target.closest("a, button");
  }

  swipeSurface.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;

    refreshStageWidth();
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startTime = performance.now();
    dragging = true;
    gestureLocked = false;
    horizontalGesture = false;
    track.classList.add("is-dragging");

    if (swipeSurface.hasPointerCapture && !swipeSurface.hasPointerCapture(e.pointerId)) {
      swipeSurface.setPointerCapture(e.pointerId);
    }
  });

  swipeSurface.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!gestureLocked && (absX > SWIPE_LOCK_PX || absY > SWIPE_LOCK_PX)) {
      gestureLocked = true;
      horizontalGesture = absX >= absY * SWIPE_DIRECTION_RATIO;
    }

    if (!horizontalGesture) return;

    e.preventDefault();
    syncTrackPosition(dx);

    if (unlockedPlayback) {
      const previewIndex = dx < 0 ? index + 1 : index - 1;
      preloadSlideVideo(slides, previewIndex);
    }
  });

  function endSwipe(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const elapsed = Math.max(performance.now() - startTime, 1);
    const velocityX = dx / elapsed;

    track.classList.remove("is-dragging");

    const distanceThreshold = Math.max(SWIPE_COMMIT_MIN, stageWidth * SWIPE_COMMIT_RATIO);
    const isHorizontal =
      horizontalGesture || (gestureLocked && absX >= absY * SWIPE_DIRECTION_RATIO);
    const passedDistance = absX >= distanceThreshold && absX >= absY * SWIPE_DIRECTION_RATIO;
    const passedFlick = Math.abs(velocityX) >= SWIPE_FLICK_VELOCITY && absX > SWIPE_LOCK_PX;

    if (isHorizontal && (passedDistance || passedFlick)) {
      if (dx < 0 && index < SLIDE_COUNT - 1) {
        goTo(index + 1);
      } else if (dx > 0 && index > 0) {
        goTo(index - 1);
      } else {
        syncTrackPosition(0);
      }
    } else {
      syncTrackPosition(0);
    }

    if (swipeSurface?.hasPointerCapture?.(e.pointerId)) {
      swipeSurface.releasePointerCapture(e.pointerId);
    }

    dragging = false;
    gestureLocked = false;
    horizontalGesture = false;
    pointerId = null;
  }

  swipeSurface.addEventListener("pointerup", endSwipe);
  swipeSurface.addEventListener("pointercancel", endSwipe);

  window.addEventListener(
    "resize",
    () => {
      refreshStageWidth();
      syncTrackPosition(0);
    },
    { passive: true },
  );

  reducedMotion.addEventListener("change", () => {
    track.classList.remove("is-dragging");
    syncTrackPosition(0);
  });

  const unlock = () => {
    if (unlockedPlayback) return;
    unlockedPlayback = true;
    if (sectionVisible) playActiveVideo(section, slides, index);
  };

  swipeSurface.addEventListener("touchstart", unlock, { passive: true, once: true });
  swipeSurface.addEventListener("click", unlock, { once: true });

  goTo(0);
}
