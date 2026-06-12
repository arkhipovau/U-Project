/** Fixed cream site chrome on all screens (Figma 985:1457). */
let setSiteLogoMenuOpenFn = null;

export function setSiteLogoMenuOpen(open) {
  setSiteLogoMenuOpenFn?.(open);
}

export function initSiteLogo() {
  const heroEmblem = document.querySelector(".hero__emblem");
  const bar = document.getElementById("site-chrome");
  if (!bar) return;

  const fixedChrome = document.body.classList.contains("has-fixed-chrome");

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  if (fixedChrome) {
    bar.hidden = false;
    bar.classList.add("is-visible");
    bar.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-past-hero");
    setSiteLogoMenuOpenFn = () => {};
    return;
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

  if (!heroEmblem) {
    setSiteLogoMenuOpenFn = () => {};
    return;
  }

  setBarVisible(false);

  const heroEmblemObserver = new IntersectionObserver(
    ([entry]) => {
      if (menuPaused) return;
      setPastHero(!entry.isIntersecting);
    },
    { threshold: 0 }
  );

  heroEmblemObserver.observe(heroEmblem);

  setSiteLogoMenuOpenFn = (open) => {
    menuPaused = open;
    if (!open) setPastHero(heroEmblem.getBoundingClientRect().bottom <= 0);
  };

  requestAnimationFrame(() => {
    setPastHero(heroEmblem.getBoundingClientRect().bottom <= 0);
  });
}
