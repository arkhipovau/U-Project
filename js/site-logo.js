/** Hero emblem stays fixed on the first screen; compact bar slides in after hero. */
export function initSiteLogo() {
  const hero = document.querySelector(".hero");
  const bar = document.getElementById("site-logo-bar");
  if (!hero || !bar) return;

  let ticking = false;

  const setBarVisible = (visible) => {
    const isVisible = bar.classList.contains("is-visible");
    if (isVisible === visible) return;
    bar.classList.toggle("is-visible", visible);
    bar.setAttribute("aria-hidden", visible ? "false" : "true");
    document.body.classList.toggle("is-past-hero", visible);
  };

  const sync = () => {
    const rect = hero.getBoundingClientRect();
    // First screen = hero at the top; bar appears once hero scrolls past the viewport top.
    setBarVisible(rect.top <= 0);
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sync);
  };

  sync();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
}
