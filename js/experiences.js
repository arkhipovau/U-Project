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
  const DESIGN_PROGRESS_X = 65;
  const PEEK_LEFT = -107.2;
  const SWIPE_THRESHOLD = 40;
  const count = slides.length;
  const TELEPORT_DISTANCE = 220;
  const prevLeftByCard = new WeakMap();

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

  let active = 0;
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
    const prevLeft = prevLeftByCard.get(card);
    const shouldTeleport =
      typeof prevLeft === "number" && Math.abs(left - prevLeft) > TELEPORT_DISTANCE * scale;

    card.classList.toggle("is-teleport", shouldTeleport);
    card.style.left = `${left}px`;
    card.style.transform = "translate3d(0, 0, 0)";
    card.classList.toggle("is-active", isActive);

    card.style.opacity = "1";

    prevLeftByCard.set(card, left);
  }

  function applyDragOffset() {
    track.style.transform = dragX ? `translate3d(${dragX}px, 0, 0)` : "translate3d(0, 0, 0)";
  }

  function applyDragOpacity() {
    slides.forEach((card) => {
      card.style.opacity = "1";
    });

    if (!dragging || dragX === 0) return;

    const progress = Math.min(Math.abs(dragX) / 140, 1);
    const leavingIndex = active;
    const leavingOpacity = Math.max(0.35, 1 - progress * 0.65);

    slides[leavingIndex].style.opacity = String(leavingOpacity);
  }

  function syncLayoutMetrics(scale) {
    const h = DESIGN_ACTIVE_H * scale;
    stage.style.height = `${h}px`;
    track.style.height = `${h}px`;
    stage.style.setProperty("--days-scale", String(scale));
    stage.style.setProperty("--days-progress-x", `${DESIGN_PROGRESS_X * scale}px`);
  }

  function layoutCards() {
    const scale = layoutScale();
    const layout = LAYOUTS[active];

    syncLayoutMetrics(scale);

    slides.forEach((card, i) => {
      const slot = layout[i];
      applyCard(card, slot, scale);
      card.classList.remove("is-prev", "is-next");

      const rel = (i - active + count) % count;
      if (rel === count - 1) card.classList.add("is-prev");
      if (rel === 1) card.classList.add("is-next");
    });

    applyDragOffset();
    applyDragOpacity();

    requestAnimationFrame(() => {
      slides.forEach((card) => card.classList.remove("is-teleport"));
    });
  }

  function goTo(index) {
    active = ((index % count) + count) % count;
    dragX = 0;
    layoutCards();

    progress.dataset.active = String(active);
    dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", i === active ? "true" : "false");
    });
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
