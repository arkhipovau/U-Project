/** Compact wordmark bar slides in after the hero section leaves the viewport. */
let setSiteLogoMenuOpenFn = null;

export function setSiteLogoMenuOpen(open) {
  setSiteLogoMenuOpenFn?.(open);
}

export function initSiteLogo() {
  const hero = document.querySelector(".hero");
  const bar = document.getElementById("site-logo-bar");
  if (!hero || !bar) return;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  let pastHero = null;
  let menuPaused = false;

  const setBarVisible = (visible) => {
    const isVisible = bar.classList.contains("is-visible");
    if (isVisible === visible) return;

    if (!visible) {
      bar.classList.remove("is-visible");
      bar.setAttribute("aria-hidden", "true");
      bar.hidden = true;
      return;
    }

    bar.hidden = false;
    bar.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      bar.classList.add("is-visible");
    });
  };

  const setPastHero = (value) => {
    if (pastHero === value) return;
    pastHero = value;
    setBarVisible(value);
  };

  function readPastHero() {
    const { bottom } = hero.getBoundingClientRect();
    return bottom <= 0.5;
  }

  function syncSiteLogoBar() {
    setPastHero(readPastHero());
  }

  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (menuPaused) return;
      setPastHero(!entry.isIntersecting);
    },
    { threshold: 0 }
  );

  heroObserver.observe(hero);

  setSiteLogoMenuOpenFn = (open) => {
    menuPaused = open;
    if (!open) syncSiteLogoBar();
  };

  setBarVisible(false);
  requestAnimationFrame(syncSiteLogoBar);
}
