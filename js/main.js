import { initViewport } from "./viewport.js";
import { initHero } from "./hero.js";
import { initLocations } from "./locations.js";
import { initOpening } from "./opening.js";
import { initBeyond } from "./beyond.js";
import { initCtaFinal } from "./cta-final.js";
import { initExperiences } from "./experiences.js";
import { initComingSoonLinks } from "./coming-soon.js";
import { initMenu } from "./menu.js";
import { initParallax } from "./parallax.js";
import { initReveal } from "./reveal.js";
import { initSiteLogo } from "./site-logo.js";

document.addEventListener("DOMContentLoaded", () => {
  initViewport();
  const parallax = initParallax();

  initSiteLogo();
  initReveal();
  initHero(parallax);
  initLocations();
  initComingSoonLinks();
  initOpening();
  initBeyond();
  initExperiences();
  initCtaFinal();
  initMenu();
});
