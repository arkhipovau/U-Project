import { HERO_LOCATIONS } from "./data.js";
import { initCarousel } from "./carousel.js";

export function isSafariBrowser() {
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|EdgiOS|FxiOS|OPiOS|Android/i.test(ua);
}

function cardCenterInScroller(card, scroller) {
  const scrollRect = scroller.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  return cardRect.left - scrollRect.left + scroller.scrollLeft + cardRect.width / 2;
}

export function initHero(parallax) {
  const section = document.querySelector(".hero");
  if (!section) return;

  const bgRoot = section.querySelector(".hero__bg");
  const scroller = section.querySelector(".hero__cards");
  const track = section.querySelector(".hero__cards-track");
  if (!bgRoot || !scroller || !track) return;

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
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    const influenceRadius = scroller.clientWidth * 0.55;
    let strongest = activeIndex;
    let strongestVal = 0;
    const influences = [];
    let totalInfluence = 0;

    cards.forEach((card, i) => {
      const cardCenter = cardCenterInScroller(card, scroller);
      const dist = Math.abs(center - cardCenter);
      const influence = Math.max(0, 1 - dist / influenceRadius);
      influences[i] = influence;
      totalInfluence += influence;

      if (influence > strongestVal) {
        strongestVal = influence;
        strongest = i;
      }
    });

    cards.forEach((_, i) => {
      const normalized = totalInfluence > 0 ? influences[i] / totalInfluence : 0;
      layers[i].style.opacity = String(normalized);
      layers[i].classList.toggle("is-active", normalized > 0.03);
    });

    const isDragging = scroller.classList.contains("is-dragging");
    cards.forEach((card, i) => {
      card.classList.toggle(
        "is-center",
        !isDragging && i === strongest && strongestVal > 0.42
      );
    });
  }

  const defaultIndex = Math.min(1, cards.length - 1);

  const carousel = initCarousel(track, {
    items: cards,
    scrollEl: scroller,
    snap: "center",
    loop: true,
    nativeScroll: true,
    settleNative: false,
    autoplayMs: 12000,
    onActive: (index) => syncVisuals(index),
  });

  if (!carousel) return;

  carousel.setActive(defaultIndex, { smooth: false });

  let syncRaf = 0;
  scroller.addEventListener(
    "scroll",
    () => {
      if (syncRaf) return;
      syncRaf = requestAnimationFrame(() => {
        syncRaf = 0;
        syncVisuals(carousel.getActiveIndex());
      });
    },
    { passive: true }
  );

  if (isSafariBrowser()) {
    scroller.classList.add("hero__cards--safari-touch");
    initSafariHeroSwipe(scroller, carousel);
  } else {
    initHeroTouchPan(scroller, carousel);
  }
}

/** iOS/macOS Safari: touch axis lock + manual scroll (WebKit flex scroll is unreliable). */
function initSafariHeroSwipe(scroller, carousel) {
  let startX = 0;
  let startY = 0;
  let startScroll = 0;
  let tracking = false;
  let axis = null;
  let dragged = false;

  const AXIS_LOCK = 5;

  scroller.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      tracking = true;
      axis = null;
      dragged = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startScroll = scroller.scrollLeft;
      carousel?.pauseAutoplay?.();
    },
    { passive: true }
  );

  scroller.addEventListener(
    "touchmove",
    (e) => {
      if (!tracking || e.touches.length !== 1) return;

      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - startX;
      const dy = y - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!axis && (absX > AXIS_LOCK || absY > AXIS_LOCK)) {
        axis = absX >= absY * 0.85 ? "x" : "y";
      }

      if (axis === "x") {
        if (absX > 8) dragged = true;
        e.preventDefault();
        scroller.classList.add("is-dragging");
        scroller.scrollLeft = startScroll - dx;
      }
    },
    { passive: false }
  );

  function endTouch() {
    if (!tracking) return;
    const wasDrag = dragged;
    const wasHorizontal = axis === "x";
    tracking = false;
    axis = null;
    dragged = false;
    scroller.classList.remove("is-dragging");

    if (wasDrag && wasHorizontal) {
      carousel?.snapToNearest?.({ smooth: true });
    }

    carousel?.scheduleAutoplay?.();

    if (wasDrag) {
      scroller.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        { capture: true, once: true }
      );
    }
  }

  scroller.addEventListener("touchend", endTouch, { passive: true });
  scroller.addEventListener("touchcancel", endTouch, { passive: true });
}

/** Other browsers: quick vertical swipe vs brief hold + horizontal drag. */
function initHeroTouchPan(scroller, carousel) {
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

  scroller.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || e.button !== 0) return;

    clearHoldTimer();
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScroll = scroller.scrollLeft;
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

  scroller.addEventListener(
    "pointermove",
    (e) => {
      if (!active || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (horizontalGesture) {
        e.preventDefault();
        scroller.classList.add("is-dragging");
        scroller.scrollLeft = startScroll - dx;
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
        if (scroller.setPointerCapture && !scroller.hasPointerCapture(e.pointerId)) {
          scroller.setPointerCapture(e.pointerId);
        }
        e.preventDefault();
        scroller.classList.add("is-dragging");
        scroller.scrollLeft = startScroll - dx;
      }
    },
    { passive: false }
  );

  function endPan(e) {
    if (!active || e.pointerId !== pointerId) return;

    clearHoldTimer();
    holdReady = false;
    scroller.classList.remove("is-dragging");
    if (scroller.hasPointerCapture?.(e.pointerId)) {
      scroller.releasePointerCapture(e.pointerId);
    }

    const didHorizontal = horizontalGesture;
    active = false;
    gestureLocked = false;
    horizontalGesture = false;
    pointerId = null;

    if (didHorizontal) {
      carousel?.snapToNearest?.({ smooth: true });
    }

    carousel?.scheduleAutoplay?.();
  }

  scroller.addEventListener("pointerup", endPan);
  scroller.addEventListener("pointercancel", endPan);
}
