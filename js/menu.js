import { DESTINATION_GROUPS, LOCATION_GROUPS } from "./data.js";
import { goToEcosystemLocation } from "./locations.js";

function scrollToDestinations() {
  const section = document.getElementById("destinations");
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildMenuDestinations(container, onNavigateGroup) {
  container.innerHTML = "";
  container.className = "menu__dest-list";

  DESTINATION_GROUPS.forEach(({ id, label }) => {
    const locations = LOCATION_GROUPS[id] || [];
    const group = document.createElement("div");
    group.className = "menu__dest-group";
    group.dataset.group = id;

    const row = document.createElement("div");
    row.className = "menu__dest-row";

    const title = document.createElement("span");
    title.className = "menu__dest-label";
    title.textContent = label;

    const chevronBtn = document.createElement("button");
    chevronBtn.type = "button";
    chevronBtn.className = "menu__dest-chevron-btn";
    chevronBtn.setAttribute("aria-expanded", "false");
    chevronBtn.innerHTML =
      '<img class="menu__dest-chevron" src="assets/chevron-dark.svg" alt="" width="12" height="12" />';

    row.append(title, chevronBtn);

    if (locations.length === 0) {
      chevronBtn.setAttribute("aria-label", `Go to ${label} — coming soon`);
      row.classList.add("menu__dest-row--nav");
      row.addEventListener("click", () => onNavigateGroup(id));
      group.append(row);
      container.appendChild(group);
      return;
    }

    chevronBtn.setAttribute("aria-label", `Show ${label} destinations`);
    title.classList.add("menu__dest-label--toggle");

    const list = document.createElement("ul");
    list.className = "menu__dest-properties";
    list.hidden = true;

    locations.forEach((loc, index) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "menu__dest-property";
      link.href = "#destinations";
      link.dataset.ecosystemGroup = id;
      link.dataset.ecosystemIndex = String(index);
      link.textContent = `${loc.name}, ${loc.country}`;
      item.appendChild(link);
      list.appendChild(item);
    });

    const toggleList = () => {
      const open = group.classList.toggle("is-open");
      chevronBtn.setAttribute("aria-expanded", open ? "true" : "false");
      list.hidden = !open;
    };

    chevronBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleList();
    });

    title.addEventListener("click", toggleList);

    group.append(row, list);
    container.appendChild(group);
  });
}

export function initMenu() {
  const menu = document.getElementById("site-menu");
  const toggle = document.querySelector(".dock__menu-toggle");
  if (!menu || !toggle) return;

  const destContainer = menu.querySelector("[data-menu-destinations]");

  function openMenu() {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
  }

  function isOpen() {
    return menu.classList.contains("is-open");
  }

  function navigateToProperty(group, index) {
    goToEcosystemLocation(group, index);
    scrollToDestinations();
    closeMenu();
  }

  function navigateToGroup(group) {
    goToEcosystemLocation(group, 0);
    scrollToDestinations();
    closeMenu();
  }

  if (destContainer) buildMenuDestinations(destContainer, navigateToGroup);

  toggle.addEventListener("click", () => {
    if (isOpen()) closeMenu();
    else openMenu();
  });

  menu.querySelectorAll(".menu__header a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  menu.querySelectorAll(".menu__links a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  menu.querySelectorAll("[data-ecosystem-group][data-ecosystem-index]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const group = link.dataset.ecosystemGroup;
      const index = Number.parseInt(link.dataset.ecosystemIndex, 10) || 0;
      if (!group) return;
      navigateToProperty(group, index);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeMenu();
  });

  menu.addEventListener("click", (e) => {
    if (e.target === menu) closeMenu();
  });
}
