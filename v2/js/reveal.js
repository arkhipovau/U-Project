/**
 * Staggered fade-in on scroll (inspired by Apple media-card gallery).
 * Only targets [data-reveal] inside [data-reveal-group] — never swipers, carousels, or [data-parallax].
 */
export function initReveal() {
  const groups = [...document.querySelectorAll("[data-reveal-group]")];
  if (groups.length === 0) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function indexItems(group) {
    const items = [...group.querySelectorAll("[data-reveal]")];
    items.forEach((el, i) => {
      el.style.setProperty("--reveal-i", String(i));
    });
    return items;
  }

  function revealGroup(group) {
    indexItems(group);
    group.classList.add("is-revealed");
  }

  if (reducedMotion.matches) {
    groups.forEach(revealGroup);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealGroup(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
  );

  groups.forEach((group) => {
    indexItems(group);

    if (group.hasAttribute("data-reveal-immediate")) {
      requestAnimationFrame(() => revealGroup(group));
      return;
    }

    observer.observe(group);
  });
}
