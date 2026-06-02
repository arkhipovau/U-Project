import { initViewport } from "./viewport.js";
import { initHero } from "./hero.js";
import { initLocations } from "./locations.js";
import { initOpening } from "./opening.js";
import { initExperiences } from "./experiences.js";
import { initMenu } from "./menu.js";
import { initParallax } from "./parallax.js";

document.addEventListener("DOMContentLoaded", () => {
  initViewport();
  const parallax = initParallax();

  initHero(parallax);
  initLocations();
  initOpening();
  initExperiences();
  initMenu();
});
