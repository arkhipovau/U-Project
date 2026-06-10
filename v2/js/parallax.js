const SHIFT_PX = 16;
const SCALE_BG = 1;
const SCALE_IMG = 1.08;

/**
 * Light scroll parallax for photos and full-bleed backgrounds.
 * @returns {{ register: (el: Element) => void }}
 */
export function initParallax() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const targets = new Set();

  function register(el) {
    if (!el || reducedMotion.matches) return;
    targets.add(el);
    paint(el);
  }

  function registerAll(root = document) {
    root.querySelectorAll("[data-parallax]").forEach(register);
  }

  function offsetFor(rect, strength) {
    const vh = window.innerHeight;
    const center = rect.top + rect.height / 2;
    const normalized = (center - vh * 0.5) / vh;
    return normalized * strength * 2;
  }

  function paint(el) {
    const kind = el.dataset.parallax || "img";
    const rect = el.getBoundingClientRect();

    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const strength = SHIFT_PX;
    const y = offsetFor(rect, strength);
    const scale = kind === "bg" ? SCALE_BG : kind === "opening" ? 1 : SCALE_IMG;

    el.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
  }

  function update() {
    if (reducedMotion.matches) return;
    targets.forEach(paint);
  }

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    }
  }

  function clearAll() {
    targets.forEach((el) => {
      el.style.transform = "";
    });
    targets.clear();
  }

  if (!reducedMotion.matches) {
    registerAll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  reducedMotion.addEventListener("change", (e) => {
    if (e.matches) {
      clearAll();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    } else {
      registerAll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
    }
  });

  return { register, update };
}
