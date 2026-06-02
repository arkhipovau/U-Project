import { HERO_LOCATIONS } from "./data.js";
import { initCarousel } from "./carousel.js";

export function initHero(parallax) {
  const section = document.querySelector(".hero");
  if (!section) return;

  const bgRoot = section.querySelector(".hero__bg");
  const track = section.querySelector(".hero__cards");
  if (!bgRoot || !track) return;

  HERO_LOCATIONS.forEach((loc, i) => {
    const layer = document.createElement("div");
    layer.className = "hero__bg-layer";
    layer.style.backgroundImage = `url("${loc.bg}")`;
    layer.dataset.index = String(i);
    layer.style.opacity = "0";
    bgRoot.appendChild(layer);

    const card = document.createElement("a");
    card.className = "location-card";
    card.href = loc.href;
    card.dataset.index = String(i);
    card.innerHTML = `
      <div class="location-card__label">
        <span>${loc.label}</span>
        <img src="assets/chevron.svg" alt="" width="12" height="12" draggable="false" />
      </div>
    `;
    track.appendChild(card);
  });

  const layers = [...bgRoot.querySelectorAll(".hero__bg-layer")];
  const cards = [...track.querySelectorAll(".location-card")];

  function syncVisuals(activeIndex) {
    const center = track.scrollLeft + track.clientWidth / 2;
    const influenceRadius = track.clientWidth * 0.55;
    let strongest = activeIndex;
    let strongestVal = 0;
    const influences = [];
    let totalInfluence = 0;

    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      const influence = Math.max(0, 1 - dist / influenceRadius);
      influences[i] = influence;
      totalInfluence += influence;

      if (influence > strongestVal) {
        strongestVal = influence;
        strongest = i;
      }
    });

    // Normalize cumulative opacity to avoid bright flash during crossfade in Safari.
    cards.forEach((_, i) => {
      const normalized = totalInfluence > 0 ? influences[i] / totalInfluence : 0;
      layers[i].style.opacity = String(normalized);
      layers[i].classList.toggle("is-active", normalized > 0.03);
    });

    cards.forEach((card, i) => card.classList.toggle("is-center", i === strongest));
  }

  const defaultIndex = Math.min(1, cards.length - 1);

  const carousel = initCarousel(track, {
    items: cards,
    snap: "center",
    loop: true,
    nativeScroll: true,
    autoplayMs: 12000,
    onActive: (index) => syncVisuals(index),
  });

  if (!carousel) return;

  carousel.setActive(defaultIndex, { smooth: false });

  track.addEventListener(
    "scroll",
    () => {
      syncVisuals(carousel.getActiveIndex());
    },
    { passive: true }
  );

  initHeroTouchPan(track, carousel);
}

/** Touch: quick swipe scrolls the page; brief hold then drag moves the carousel. */
function initHeroTouchPan(track, carousel) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScroll = 0;
  let active = false;
  let gestureLocked = false;
  let horizontalGesture = false;
  let holdReady = false;
  let holdTimer = null;

  const HOLD_MS = 220;
  const SWIPE_LOCK_X = 8;
  const SWIPE_LOCK_Y = 8;

  function clearHoldTimer() {
    if (holdTimer !== null) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || e.button !== 0) return;

    clearHoldTimer();
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScroll = track.scrollLeft;
    active = true;
    gestureLocked = false;
    horizontalGesture = false;
    holdReady = false;

    holdTimer = setTimeout(() => {
      holdTimer = null;
      holdReady = true;
    }, HOLD_MS);

    carousel?.pauseAutoplay?.();
  });

  track.addEventListener(
    "pointermove",
    (e) => {
      if (!active || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (horizontalGesture) {
        e.preventDefault();
        track.classList.add("is-dragging");
        track.scrollLeft = startScroll - dx;
        return;
      }

      if (gestureLocked) return;

      const moved = absX > SWIPE_LOCK_X || absY > SWIPE_LOCK_Y;
      if (!moved) return;

      if (!holdReady) {
        if (absY > absX * 1.15) {
          gestureLocked = true;
          horizontalGesture = false;
        }
        return;
      }

      gestureLocked = true;
      horizontalGesture = absX >= absY * 0.55;

      if (horizontalGesture) {
        if (track.setPointerCapture && !track.hasPointerCapture(e.pointerId)) {
          track.setPointerCapture(e.pointerId);
        }
        e.preventDefault();
        track.classList.add("is-dragging");
        track.scrollLeft = startScroll - dx;
      }
    },
    { passive: false }
  );

  function endPan(e) {
    if (!active || e.pointerId !== pointerId) return;

    clearHoldTimer();
    holdReady = false;
    track.classList.remove("is-dragging");
    if (track.hasPointerCapture?.(e.pointerId)) {
      track.releasePointerCapture(e.pointerId);
    }

    active = false;
    gestureLocked = false;
    horizontalGesture = false;
    pointerId = null;
    carousel?.scheduleAutoplay?.();
  }

  track.addEventListener("pointerup", endPan);
  track.addEventListener("pointercancel", endPan);
}
