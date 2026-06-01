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

  /** Figma: positions in 412px stage, card size for 314px content lane (378 − 32×2) */
  const DESIGN_LAYOUT_W = 412;
  const DESIGN_CONTENT_W = 314;
  const DESIGN_CARD_W = 205;
  const DESIGN_CARD_H = 274;
  const SCALE_INACTIVE = 163.2 / 205;
  const OFFSET_Y_INACTIVE = 27.4;
  const PEEK_LEFT = -107.2;
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

  let active = 0;
  let dragging = false;
  let dragX = 0;
  let startX = 0;
  let moved = false;
  let suppressHitClick = false;

  function posScale() {
    const w = stage.clientWidth || DESIGN_LAYOUT_W;
    return w / DESIGN_LAYOUT_W;
  }

  /** Scale card size to content width so phones match Figma proportions, not shrink */
  function sizeScale() {
    const w = stage.clientWidth || DESIGN_CONTENT_W;
    return w / DESIGN_CONTENT_W;
  }

  function styleCard(card, isActive, scale) {
    const offsetY = OFFSET_Y_INACTIVE * scale;
    card.style.transform = isActive
      ? "translate3d(0, 0, 0) scale(1)"
      : `translate3d(0, ${offsetY}px, 0) scale(${SCALE_INACTIVE})`;
    card.classList.toggle("is-active", isActive);
  }

  function applyDragOffset() {
    track.style.transform = dragX ? `translate3d(${dragX}px, 0, 0)` : "translate3d(0, 0, 0)";
  }

  function syncCarouselHeight(scale) {
    const h = DESIGN_CARD_H * scale;
    stage.style.height = `${h}px`;
    track.style.height = `${h}px`;
    stage.style.setProperty("--days-scale", String(scale));
  }

  function layoutCards() {
    const scalePos = posScale();
    const scaleSize = sizeScale();
    const cardW = DESIGN_CARD_W * scaleSize;
    const layout = LAYOUTS[active];

    syncCarouselHeight(scaleSize);

    slides.forEach((card, i) => {
      const slot = layout[i];
      card.style.width = `${cardW}px`;
      card.style.height = `${DESIGN_CARD_H * scaleSize}px`;
      card.style.left = `${slot.x * scalePos}px`;
      styleCard(card, slot.active, scaleSize);
      card.classList.remove("is-prev", "is-next");

      const rel = (i - active + count) % count;
      if (rel === count - 1) card.classList.add("is-prev");
      if (rel === 1) card.classList.add("is-next");
    });

    applyDragOffset();
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
