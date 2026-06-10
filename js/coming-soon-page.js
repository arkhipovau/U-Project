import { initViewport } from "./viewport.js";
import { initDestinationsNav } from "./destinations-nav.js";
import { initComingSoonLinks } from "./coming-soon.js";
import { initMenu } from "./menu.js";

document.addEventListener("DOMContentLoaded", () => {
  initViewport();
  initDestinationsNav();
  initComingSoonLinks();
  initMenu();
});
