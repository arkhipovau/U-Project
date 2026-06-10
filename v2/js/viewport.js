/** iOS Safari: 100vw is wider than the visible viewport — use innerWidth instead. */
export function initViewport() {
  const root = document.documentElement;

  function sync() {
    const w = window.innerWidth;
    root.style.setProperty("--app-width", `${w}px`);
    root.style.setProperty("--app-height", `${window.innerHeight}px`);
  }

  sync();
  window.addEventListener("resize", sync, { passive: true });
  window.addEventListener("orientationchange", sync, { passive: true });
}
