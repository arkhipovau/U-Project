export function initExperiences() {
  const section = document.querySelector(".days");
  const stage = document.querySelector(".days__stage");
  const track = document.querySelector(".days__track");
  const progress = document.querySelector(".days__progress");
  const progressFill = document.querySelector(".days__progress-fill");
  if (!stage || !track || !progress || !progressFill) return;

  const slides = [...track.querySelectorAll(".days__card")];
  const progressItems = [...progress.querySelectorAll(".days__progress-item")];
  const hitPrev = stage.querySelector(".days__hit--prev");
  const hitNext = stage.querySelector(".days__hit--next");

  if (slides.length === 0) return;

  /** Figma 614:2836 — scaled to match 16px inset (346px content vs 314px base) */
  const CARD_RATIO = 346 / 314;
  const DESIGN_STAGE_W = 412 * CARD_RATIO;
  const DESIGN_ACTIVE_W = 260 * CARD_RATIO;
  const DESIGN_ACTIVE_H = 347.77 * CARD_RATIO;
  const DESIGN_INACTIVE_W = 207.03 * CARD_RATIO;
  const DESIGN_INACTIVE_H = 278.08 * CARD_RATIO;
  const DESIGN_INACTIVE_Y = 0;
  const DESIGN_GAP = 14 * CARD_RATIO;
  const PEEK_LEFT = -136 * CARD_RATIO;
  const VISIBLE_NEXT_X_MAX = 292 * CARD_RATIO;
  const SWIPE_THRESHOLD = 40;
  const AUTOPLAY_MS = 5000;
  const count = slides.length;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const LAYOUTS = [
    [
      { x: 0, active: true },
      { x: DESIGN_ACTIVE_W + DESIGN_GAP, active: false },
      { x: DESIGN_ACTIVE_W + DESIGN_GAP + DESIGN_INACTIVE_W + DESIGN_GAP, active: false },
    ],
    [
      { x: PEEK_LEFT, active: false },
      { x: 0, active: true },
      { x: DESIGN_ACTIVE_W + DESIGN_GAP, active: false },
    ],
    [
      { x: DESIGN_ACTIVE_W + DESIGN_GAP, active: false },
      { x: PEEK_LEFT, active: false },
      { x: 0, active: true },
    ],
  ];

  /** Seamless loop: last → first (forward) / first → last (backward) */
  const WRAP_FORWARD_LAYOUT = [
    { x: 0, active: true },
    { x: DESIGN_ACTIVE_W + DESIGN_GAP, active: false },
    { x: PEEK_LEFT, active: false },
  ];
  const WRAP_BACKWARD_LAYOUT = [
    { x: DESIGN_ACTIVE_W + DESIGN_GAP, active: false },
    { x: PEEK_LEFT, active: false },
    { x: 0, active: true },
  ];

  let active = 0;
  let isWrapping = false;
  let dragging = false;
  let dragX = 0;
  let startX = 0;
  let moved = false;
  let suppressHitClick = false;
  let sectionVisible = false;
  let autoplayEnabled = !reducedMotion.matches;
  let onAutoplayEnd = null;

  progress.style.setProperty("--days-autoplay-ms", `${AUTOPLAY_MS}ms`);

  function layoutScale() {
    const w = Math.round(stage.getBoundingClientRect().width) || DESIGN_STAGE_W;
    return w / DESIGN_STAGE_W;
  }

  function applyCard(card, slot, scale) {
    const isActive = slot.active;
    const w = isActive ? DESIGN_ACTIVE_W * scale : DESIGN_INACTIVE_W * scale;
    const h = isActive ? DESIGN_ACTIVE_H * scale : DESIGN_INACTIVE_H * scale;
    const left = slot.x * scale;

    card.style.width = `${w}px`;
    card.style.height = `${h}px`;
    card.style.left = `${left}px`;
    card.style.transform = isActive
      ? "translate3d(0, 0, 0)"
      : `translate3d(0, ${DESIGN_INACTIVE_Y * scale}px, 0)`;
    card.classList.toggle("is-active", isActive);

    const baseOpacity = slot.x < 0 || slot.x > VISIBLE_NEXT_X_MAX ? 0 : 1;
    card.dataset.baseOpacity = String(baseOpacity);
    card.style.opacity = String(baseOpacity);
  }

  function applyDragOffset() {
    track.style.transform = "translate3d(0, 0, 0)";
  }

  function applyDragOpacity() {
    slides.forEach((card) => {
      card.style.opacity = card.dataset.baseOpacity || "1";
    });

    if (!dragging || dragX === 0) return;

    const dragProgress = Math.min(Math.abs(dragX) / 120, 1);
    const leavingIndex = active;
    const leavingOpacity = Math.max(0, 1 - dragProgress);

    slides[leavingIndex].style.opacity = String(leavingOpacity);
  }

  function syncLayoutMetrics(scale) {
    const h = DESIGN_ACTIVE_H * scale;
    stage.style.height = `${h}px`;
    track.style.height = `${h}px`;
    stage.style.setProperty("--days-scale", String(scale));
    stage.closest(".days__carousel")?.style.setProperty("--days-scale", String(scale));
    stage.closest(".days__carousel")?.style.setProperty(
      "--days-active-half-w",
      `${(DESIGN_ACTIVE_W / 2) * scale}px`,
    );
  }

  function syncProgressUI() {
    const label = slides[active]?.dataset.label || "";

    progress.dataset.active = String(active);
    progressItems.forEach((item, i) => {
      const isActive = i === active;
      item.classList.toggle("is-active", isActive);

      if (isActive) {
        const trackEl = item.querySelector(".days__progress-track");
        if (trackEl && progressFill.parentElement !== trackEl) {
          trackEl.appendChild(progressFill);
        }
      }
    });

    progress.setAttribute(
      "aria-label",
      label ? `${label}, carousel autoplay` : "Carousel autoplay",
    );
    progress.setAttribute("aria-valuenow", "0");
  }

  function stopAutoplay() {
    if (onAutoplayEnd) {
      progressFill.removeEventListener("animationend", onAutoplayEnd);
      onAutoplayEnd = null;
    }
    progressFill.classList.remove("is-running");
    progressFill.style.animation = "none";
    progressFill.style.width = "0";
    void progressFill.offsetWidth;
    progressFill.style.animation = "";
    progress.setAttribute("aria-valuenow", "0");
  }

  function pauseAutoplay() {
    if (!progressFill.classList.contains("is-running")) return;
    progressFill.style.animationPlayState = "paused";
  }

  function startAutoplay() {
    stopAutoplay();
    syncProgressUI();

    if (!autoplayEnabled || !sectionVisible || dragging || isWrapping || count <= 1) {
      if (!autoplayEnabled) {
        progressFill.style.width = "100%";
        progress.setAttribute("aria-valuenow", "100");
      }
      return;
    }

    progressFill.style.animationPlayState = "running";
    progressFill.classList.add("is-running");

    onAutoplayEnd = (event) => {
      if (event.target !== progressFill) return;
      stopAutoplay();
      goTo(active + 1);
    };

    progressFill.addEventListener("animationend", onAutoplayEnd);
  }

  function setInstant(on) {
    stage.classList.toggle("is-instant", on);
  }

  function slideDirection(from, to) {
    const delta = (to - from + count) % count;
    if (delta === 0) return 0;
    return delta <= count / 2 ? 1 : -1;
  }

  function applyLayout(layout, activeIndex) {
    const scale = layoutScale();
    syncLayoutMetrics(scale);

    slides.forEach((card, i) => {
      applyCard(card, layout[i], scale);
      card.classList.remove("is-prev", "is-next");

      const rel = (i - activeIndex + count) % count;
      if (rel === count - 1) card.classList.add("is-prev");
      if (rel === 1) card.classList.add("is-next");
    });

    applyDragOffset();
    applyDragOpacity();
  }

  function layoutCards() {
    applyLayout(LAYOUTS[active], active);
  }

  function afterWrapTransition(done) {
    let pending = slides.length;
    const handler = (e) => {
      if (e.propertyName !== "left") return;
      pending -= 1;
      if (pending > 0) return;
      slides.forEach((card) => card.removeEventListener("transitionend", handler));
      done();
    };
    slides.forEach((card) => card.addEventListener("transitionend", handler));
  }

  function finishWrap(nextIndex) {
    setInstant(true);
    active = nextIndex;
    layoutCards();
    syncProgressUI();
    void stage.offsetHeight;
    setInstant(false);
    isWrapping = false;
    startAutoplay();
  }

  function runWrapForward(nextIndex) {
    stopAutoplay();
    isWrapping = true;
    applyLayout(WRAP_FORWARD_LAYOUT, nextIndex);
    afterWrapTransition(() => finishWrap(nextIndex));
  }

  function runWrapBackward(nextIndex) {
    stopAutoplay();
    isWrapping = true;
    applyLayout(WRAP_BACKWARD_LAYOUT, nextIndex);
    afterWrapTransition(() => finishWrap(nextIndex));
  }

  function goTo(index) {
    if (isWrapping) return;

    const next = ((index % count) + count) % count;
    if (next === active) {
      startAutoplay();
      return;
    }

    stopAutoplay();

    const dir = slideDirection(active, next);
    dragX = 0;

    if (dir === 1 && active === count - 1 && next === 0) {
      runWrapForward(next);
      return;
    }
    if (dir === -1 && active === 0 && next === count - 1) {
      runWrapBackward(next);
      return;
    }

    active = next;
    layoutCards();
    syncProgressUI();
    startAutoplay();
  }

  function endDrag(pointerId) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");

    if (stage.hasPointerCapture(pointerId)) {
      stage.releasePointerCapture(pointerId);
    }

    const dx = dragX;
    dragX = 0;
    applyDragOffset();

    if (moved && Math.abs(dx) >= SWIPE_THRESHOLD) {
      suppressHitClick = true;
      goTo(dx < 0 ? active + 1 : active - 1);
      return;
    }

    layoutCards();
    startAutoplay();
  }

  hitPrev?.addEventListener("click", (e) => {
    if (suppressHitClick) {
      suppressHitClick = false;
      return;
    }
    e.stopPropagation();
    goTo(active - 1);
  });

  hitNext?.addEventListener("click", (e) => {
    if (suppressHitClick) {
      suppressHitClick = false;
      return;
    }
    e.stopPropagation();
    goTo(active + 1);
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    dragX = 0;
    stage.classList.add("is-dragging");
    pauseAutoplay();
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    dragX = dx;
    applyDragOffset();
    applyDragOpacity();
  });

  stage.addEventListener("pointerup", (e) => {
    if (e.button !== 0) return;
    endDrag(e.pointerId);
  });

  stage.addEventListener("pointercancel", (e) => {
    endDrag(e.pointerId);
  });

  window.addEventListener("resize", () => {
    layoutCards();
    syncProgressUI();
    startAutoplay();
  }, { passive: true });

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      layoutCards();
      syncProgressUI();
      startAutoplay();
    });
    ro.observe(stage);
  }

  if (section) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        sectionVisible = entries.some((entry) => entry.isIntersecting);
        if (sectionVisible) startAutoplay();
        else stopAutoplay();
      },
      { threshold: 0.35 },
    );
    sectionObserver.observe(section);
  } else {
    sectionVisible = true;
  }

  reducedMotion.addEventListener("change", (event) => {
    autoplayEnabled = !event.matches;
    if (autoplayEnabled) startAutoplay();
    else stopAutoplay();
  });

  layoutCards();
  syncProgressUI();
  startAutoplay();
}
