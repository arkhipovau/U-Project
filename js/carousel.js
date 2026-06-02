/**
 * Horizontal carousel: touch scroll, pointer drag, snap, autoplay, optional infinite loop.
 */
export function initCarousel(track, options = {}) {
  const {
    items: itemsOption,
    snap = "center",
    autoplayMs = 0,
    loop = false,
    onActive,
  } = options;

  const logicalItems = itemsOption ? [...itemsOption] : [...track.children];
  if (!track || logicalItems.length === 0) return null;

  const useLoop = loop && logicalItems.length > 1;
  let cloneLead = null;
  let cloneTail = null;

  if (useLoop) {
    cloneLead = logicalItems[logicalItems.length - 1].cloneNode(true);
    cloneTail = logicalItems[0].cloneNode(true);
    cloneLead.classList.add("carousel-clone");
    cloneTail.classList.add("carousel-clone");
    cloneLead.setAttribute("aria-hidden", "true");
    cloneTail.setAttribute("aria-hidden", "true");
    cloneLead.tabIndex = -1;
    cloneTail.tabIndex = -1;
    track.insertBefore(cloneLead, logicalItems[0]);
    track.appendChild(cloneTail);
  }

  const scrollItems = [...track.children];
  const cloneOffset = useLoop ? 1 : 0;

  let activeIndex = 0;
  let autoplayTimer = null;
  let dragging = false;
  let suppressClick = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;
  let jumping = false;
  let touchSnapTimer = null;
  const SNAP_IDLE_MS = 70;
  const SNAP_NEAR_PX = 10;
  const SNAP_SMOOTH_MIN_PX = 28;

  track.classList.add("carousel-track");

  function scrollTarget(item) {
    if (snap === "center") {
      return item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2;
    }
    return item.offsetLeft;
  }

  function scrollIndexToLogical(scrollIndex) {
    if (!useLoop) return scrollIndex;
    const n = logicalItems.length;
    if (scrollIndex === 0) return n - 1;
    if (scrollIndex === n + 1) return 0;
    return scrollIndex - cloneOffset;
  }

  function logicalToScrollIndex(logicalIndex) {
    return logicalIndex + cloneOffset;
  }

  function readScrollIndex() {
    const probe =
      snap === "center"
        ? track.scrollLeft + track.clientWidth / 2
        : track.scrollLeft + 8;

    let best = 0;
    let minDist = Infinity;

    scrollItems.forEach((item, i) => {
      const point =
        snap === "center" ? item.offsetLeft + item.offsetWidth / 2 : item.offsetLeft;
      const dist = Math.abs(probe - point);
      if (dist < minDist) {
        minDist = dist;
        best = i;
      }
    });

    return best;
  }

  function readActiveIndex() {
    return scrollIndexToLogical(readScrollIndex());
  }

  function jumpIfOnClone() {
    if (!useLoop || jumping) return false;

    const scrollIndex = readScrollIndex();
    const n = logicalItems.length;

    if (scrollIndex === 0) {
      jumping = true;
      track.scrollTo({
        left: scrollTarget(scrollItems[n]),
        behavior: "auto",
      });
      activeIndex = n - 1;
      jumping = false;
      onActive?.(activeIndex, logicalItems[activeIndex]);
      return true;
    }

    if (scrollIndex === n + 1) {
      jumping = true;
      track.scrollTo({
        left: scrollTarget(scrollItems[1]),
        behavior: "auto",
      });
      activeIndex = 0;
      jumping = false;
      onActive?.(activeIndex, logicalItems[activeIndex]);
      return true;
    }

    return false;
  }

  function setActive(index, { smooth = true, emit = true } = {}) {
    const n = logicalItems.length;
    const i = ((index % n) + n) % n;
    activeIndex = i;
    const scrollIndex = logicalToScrollIndex(i);

    track.scrollTo({
      left: scrollTarget(scrollItems[scrollIndex]),
      behavior: smooth ? "smooth" : "auto",
    });

    if (emit) onActive?.(i, logicalItems[i]);
  }

  function advanceNext({ smooth = true, emit = true } = {}) {
    const n = logicalItems.length;
    if (!useLoop) {
      setActive((activeIndex + 1) % n, { smooth, emit });
      return;
    }

    if (activeIndex === n - 1) {
      activeIndex = 0;
      track.scrollTo({
        left: scrollTarget(scrollItems[n + 1]),
        behavior: smooth ? "smooth" : "auto",
      });
      if (emit) onActive?.(0, logicalItems[0]);
      return;
    }

    setActive(activeIndex + 1, { smooth, emit });
  }

  function pauseAutoplay() {
    clearTimeout(autoplayTimer);
  }

  function scheduleAutoplay() {
    if (!autoplayMs) return;
    pauseAutoplay();
    autoplayTimer = setTimeout(() => {
      advanceNext();
      scheduleAutoplay();
    }, autoplayMs);
  }

  function onScroll() {
    if (jumping) return;

    const next = readActiveIndex();
    if (next !== activeIndex) {
      activeIndex = next;
      onActive?.(next, logicalItems[next]);
    }
    scheduleAutoplay();
  }

  function snapOffset() {
    const scrollIndex = readScrollIndex();
    const target = scrollTarget(scrollItems[scrollIndex]);
    return {
      scrollIndex,
      target,
      distance: Math.abs(track.scrollLeft - target),
    };
  }

  function snapNearest(smooth = true) {
    if (jumpIfOnClone()) return;

    const { scrollIndex, distance } = snapOffset();
    if (distance < SNAP_NEAR_PX) {
      const logical = scrollIndexToLogical(scrollIndex);
      if (logical !== activeIndex) {
        activeIndex = logical;
        onActive?.(logical, logicalItems[logical]);
      }
      return;
    }

    const useSmooth = smooth && distance > SNAP_SMOOTH_MIN_PX;
    setActive(scrollIndexToLogical(scrollIndex), { smooth: useSmooth, emit: true });
  }

  function scheduleTouchSnap(delay = SNAP_IDLE_MS) {
    clearTimeout(touchSnapTimer);
    touchSnapTimer = setTimeout(() => {
      if (dragging || jumping) return;
      snapNearest(true);
    }, delay);
  }

  let scrollIdleTimer;

  track.addEventListener(
    "scroll",
    () => {
      if (dragging || jumping) return;
      onScroll();
      if (!("onscrollend" in window)) {
        clearTimeout(scrollIdleTimer);
        scrollIdleTimer = setTimeout(() => {
          snapNearest(true);
        }, SNAP_IDLE_MS);
      }
    },
    { passive: true }
  );

  if ("onscrollend" in window) {
    track.addEventListener(
      "scrollend",
      () => {
        if (dragging || jumping) return;
        snapNearest(true);
      },
      { passive: true }
    );
  }

  track.addEventListener(
    "touchstart",
    () => {
      clearTimeout(touchSnapTimer);
      pauseAutoplay();
    },
    { passive: true }
  );
  track.addEventListener(
    "touchend",
    () => {
      scheduleAutoplay();
      // iOS may stop between snap points; enforce a final snap.
      scheduleTouchSnap(SNAP_IDLE_MS);
    },
    { passive: true }
  );
  track.addEventListener(
    "touchcancel",
    () => {
      scheduleAutoplay();
      scheduleTouchSnap(40);
    },
    { passive: true }
  );

  track.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(e.pointerId);
    pauseAutoplay();
  });

  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) moved = true;
    track.scrollLeft = startScroll - dx;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    if (track.hasPointerCapture(e.pointerId)) {
      track.releasePointerCapture(e.pointerId);
    }
    if (moved) {
      suppressClick = true;
      if (!jumpIfOnClone()) snapNearest(true);
    }
    scheduleAutoplay();
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  scrollItems.forEach((item) => {
    item.addEventListener(
      "click",
      (e) => {
        if (item.classList.contains("carousel-clone")) {
          e.preventDefault();
          return;
        }
        if (suppressClick) {
          e.preventDefault();
          suppressClick = false;
        }
      },
      true
    );
  });

  const api = {
    setActive,
    getActiveIndex: () => activeIndex,
    pauseAutoplay,
    scheduleAutoplay,
  };

  requestAnimationFrame(() => {
    onScroll();
    scheduleAutoplay();
  });

  return api;
}
