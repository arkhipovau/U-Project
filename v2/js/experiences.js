export function initExperiences() {
  const stage = document.querySelector(".days__stage");
  const track = document.querySelector(".days__track");
  const progress = document.querySelector(".days__progress");
  if (!stage || !track || !progress) return;

  const slides = [...track.querySelectorAll(".days__card")];
  const dots = [...progress.querySelectorAll(".days__progress-item")];
  const hitPrev = stage.querySelector(".days__hit--prev");
  const hitNext = stage.querySelector(".days__hit--next");

  if (slides.length === 0) return;

  /** Figma 614:2836 — stage 412×274, gap 14px between cards */
  const DESIGN_STAGE_W = 412;
  const DESIGN_ACTIVE_W = 205;
  const DESIGN_ACTIVE_H = 274;
  const DESIGN_INACTIVE_W = 163.2;
  const DESIGN_INACTIVE_H = 219.2;
  const DESIGN_INACTIVE_Y = 0;
  const DESIGN_PROGRESS_X = 65;
  const PEEK_LEFT = -107.2;
  const VISIBLE_NEXT_X_MAX = 230;
  const SWIPE_THRESHOLD = 40;
  const count = slides.length;

  const LAYOUTS = [
    [
      { x: 0, active: true },
      { x: 219, active: false },
      { x: 396.2, active: false },
    ],
    [
      { x: PEEK_LEFT, active: false },
      { x: 0, active: true },
      { x: 219, active: false },
    ],
    [
      { x: 219, active: false },
      { x: PEEK_LEFT, active: false },
      { x: 0, active: true },
    ],
  ];

  /** Seamless loop: last → first (forward) / first → last (backward) */
  const WRAP_FORWARD_LAYOUT = [
    { x: 0, active: true },
    { x: 219, active: false },
    { x: PEEK_LEFT, active: false },
  ];
  const WRAP_BACKWARD_LAYOUT = [
    { x: 219, active: false },
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

    // Show only foreground pair (active + immediate next); hide rear movers.
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

    const progress = Math.min(Math.abs(dragX) / 120, 1);
    const leavingIndex = active;
    const leavingOpacity = Math.max(0, 1 - progress);

    slides[leavingIndex].style.opacity = String(leavingOpacity);
  }

  function syncLayoutMetrics(scale) {
    const h = DESIGN_ACTIVE_H * scale;
    stage.style.height = `${h}px`;
    track.style.height = `${h}px`;
    stage.style.setProperty("--days-scale", String(scale));
    stage.style.setProperty("--days-progress-x", `${DESIGN_PROGRESS_X * scale}px`);
  }

  function syncProgress() {
    progress.dataset.active = String(active);
    dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", i === active ? "true" : "false");
    });
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
    syncProgress();
    void stage.offsetHeight;
    setInstant(false);
    isWrapping = false;
  }

  function runWrapForward(nextIndex) {
    isWrapping = true;
    applyLayout(WRAP_FORWARD_LAYOUT, nextIndex);
    afterWrapTransition(() => finishWrap(nextIndex));
  }

  function runWrapBackward(nextIndex) {
    isWrapping = true;
    applyLayout(WRAP_BACKWARD_LAYOUT, nextIndex);
    afterWrapTransition(() => finishWrap(nextIndex));
  }

  function goTo(index) {
    if (isWrapping) return;

    const next = ((index % count) + count) % count;
    if (next === active) return;

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
    syncProgress();
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

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goTo(index));
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    dragX = 0;
    stage.classList.add("is-dragging");
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

  window.addEventListener("resize", () => layoutCards(), { passive: true });

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => layoutCards());
    ro.observe(stage);
  }

  goTo(0);
}
