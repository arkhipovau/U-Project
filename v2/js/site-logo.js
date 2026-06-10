/** Fixed top chrome slides in after the hero section leaves the viewport. */
let setSiteLogoMenuOpenFn = null;

export function setSiteLogoMenuOpen(open) {
  setSiteLogoMenuOpenFn?.(open);
}

export function initSiteLogo() {
  const hero = document.querySelector(".hero");
  const bar = document.getElementById("site-chrome");
  if (!hero || !bar) return;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  let pastHero = null;
  let menuPaused = false;

  const setBarVisible = (visible) => {
    const isVisible = bar.classList.contains("is-visible");
    if (isVisible === visible) return;

    document.body.classList.toggle("is-past-hero", visible);

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

  function syncSiteChrome() {
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
    if (!open) syncSiteChrome();
  };

  setBarVisible(false);
  requestAnimationFrame(syncSiteChrome);
}
