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
  }

  let pastHero = null;
  let menuPaused = false;

  const setPastHero = (value) => {
    if (pastHero === value) return;
    pastHero = value;
    document.body.classList.toggle("is-past-hero", value);
  };

  if (!heroEmblem) {
    document.body.classList.add("is-past-hero");
    setSiteLogoMenuOpenFn = () => {};
    return;
  }

  if (!fixedChrome) {
    const setBarVisible = (visible) => {
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

    setBarVisible(false);

    const heroEmblemObserver = new IntersectionObserver(
      ([entry]) => {
        if (menuPaused) return;
        setBarVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    heroEmblemObserver.observe(heroEmblem);

    setSiteLogoMenuOpenFn = (open) => {
      menuPaused = open;
      if (!open) setBarVisible(heroEmblem.getBoundingClientRect().bottom <= 0);
    };

    requestAnimationFrame(() => {
      setBarVisible(heroEmblem.getBoundingClientRect().bottom <= 0);
    });
    return;
  }

  const heroEmblemObserver = new IntersectionObserver(
    ([entry]) => {
      if (menuPaused) return;
      setPastHero(!entry.isIntersecting);
    },
    { threshold: 0 },
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
