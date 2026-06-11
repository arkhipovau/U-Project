import { collapseDestinations } from "./destinations-nav.js";
import { setSiteLogoMenuOpen } from "./site-logo.js";

const MENU_TRANSITION_MS = 450;

export function initMenu() {
  const menu = document.getElementById("site-menu");
  const openToggles = document.querySelectorAll(".site-menu-open");
  const closeToggles = document.querySelectorAll(".site-menu-close");
  if (!menu || openToggles.length === 0 || closeToggles.length === 0) return;

  const destContainer = menu.querySelector("[data-destinations-nav]");
  const menuScroll = menu.querySelector(".menu__scroll");
  const menuSurface = menu.querySelector(".menu__surface");
  const menuToolbar = menu.querySelector(".menu__toolbar");
  let savedScrollY = 0;
  let closeTimer = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setTogglesExpanded(open) {
    openToggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menuToolbar?.setAttribute("aria-hidden", String(!open));
  }

  function lockBodyScroll() {
    savedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function unlockBodyScroll() {
    const y = savedScrollY;
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, y);

    requestAnimationFrame(() => {
      html.style.scrollBehavior = previousScrollBehavior;
    });
  }

  function isOpen() {
    return menu.classList.contains("is-open");
  }

  function isMenuActive() {
    return menu.classList.contains("is-open") || menu.classList.contains("is-closing");
  }

  function finishClose(onClosed) {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    menu.classList.remove("is-closing");
    menu.setAttribute("aria-hidden", "true");
    setTogglesExpanded(false);
    unlockBodyScroll();
    setSiteLogoMenuOpen(false);
    menuScroll?.scrollTo(0, 0);
    collapseDestinations(destContainer);
    onClosed?.();
  }

  function openMenu() {
    if (isMenuActive()) return;

    lockBodyScroll();
    setSiteLogoMenuOpen(true);
    menu.classList.remove("is-closing");
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    setTogglesExpanded(true);
    document.body.classList.add("menu-open");
    menuScroll?.scrollTo(0, 0);
  }

  function closeMenu(onClosed) {
    if (!isOpen() || menu.classList.contains("is-closing")) {
      onClosed?.();
      return;
    }

    menu.classList.remove("is-open");
    menu.classList.add("is-closing");
    document.body.classList.remove("menu-open");
    setTogglesExpanded(false);

    if (prefersReducedMotion()) {
      finishClose(onClosed);
      return;
    }

    const complete = () => finishClose(onClosed);

    const onTransitionEnd = (event) => {
      if (event.target !== menuSurface || event.propertyName !== "transform") return;
      menuSurface.removeEventListener("transitionend", onTransitionEnd);
      complete();
    };

    menuSurface.addEventListener("transitionend", onTransitionEnd);
    closeTimer = window.setTimeout(() => {
      menuSurface.removeEventListener("transitionend", onTransitionEnd);
      complete();
    }, MENU_TRANSITION_MS + 50);
  }

  function navigateToHero(href) {
    const url = new URL(href, window.location.href);
    const onIndex =
      url.pathname.endsWith("/") ||
      url.pathname.endsWith("index.html") ||
      url.pathname.endsWith("/v2") ||
      url.pathname.endsWith("/v2/") ||
      url.pathname.endsWith("/v2/index.html");

    if (!onIndex || url.origin !== window.location.origin) {
      window.location.assign(url.href);
      return;
    }

    const target = document.querySelector(url.hash || "#top");
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    target?.scrollIntoView({ block: "start" });
    history.replaceState(null, "", url.hash || "#top");
    requestAnimationFrame(() => {
      html.style.scrollBehavior = previousScrollBehavior;
    });
  }

  openToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (!isMenuActive()) openMenu();
    });
  });

  closeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (isOpen()) closeMenu();
    });
  });

  document.querySelectorAll(".site-chrome__logo").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (!isOpen()) return;
      e.preventDefault();
      const href = link.getAttribute("href") || "#top";
      closeMenu(() => requestAnimationFrame(() => navigateToHero(href)));
    });
  });

  menu.querySelectorAll(".menu__toolbar-logo").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu(() => requestAnimationFrame(() => navigateToHero(link.getAttribute("href") || "#top")));
    });
  });

  menu
    .querySelectorAll(
      ".menu__dest-property--active, .menu__links a, .menu__destinations-label"
    )
    .forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeMenu();
  });

  menu.addEventListener("click", (e) => {
    if (e.target === menu) closeMenu();
  });
}
