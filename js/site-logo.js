/** Hero emblem stays fixed while hero is on screen; compact bar replaces it after. */
export function initSiteLogo() {
  const hero = document.querySelector(".hero");
  const bar = document.getElementById("site-logo-bar");
  const heroLogo = document.getElementById("hero-logo");
  if (!hero || !bar) return;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  let onHero = null;

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

  const setOnHero = (visible) => {
    if (onHero === visible) return;
    onHero = visible;

    document.body.classList.toggle("is-past-hero", !visible);

    if (heroLogo) {
      heroLogo.hidden = !visible;
      heroLogo.setAttribute("aria-hidden", visible ? "false" : "true");
    }

    setBarVisible(!visible);
  };

  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      setOnHero(entry.isIntersecting);
    },
    { threshold: 0 }
  );

  heroObserver.observe(hero);

  setBarVisible(false);
  requestAnimationFrame(() => {
    const rect = hero.getBoundingClientRect();
    setOnHero(rect.bottom > 0 && rect.top < window.innerHeight);
  });
}
