import { DESTINATION_GROUPS, LOCATION_GROUPS } from "./data.js";
import { COMING_SOON_PAGE } from "./coming-soon.js";

export const ACTIVE_DESTINATION = "Jericoacoara";

export function collapseDestinations(container) {
  if (!container) return;
  container.querySelectorAll(".menu__dest-group.is-open").forEach((group) => {
    group.classList.remove("is-open");
    const list = group.querySelector(".menu__dest-properties");
    const toggle = group.querySelector(".menu__dest-toggle");
    if (list) list.hidden = true;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
}

export function initDestinationsNav() {
  document.querySelectorAll("[data-destinations-nav]").forEach((container) => {
    const idPrefix = container.dataset.destinationsIdPrefix || "dest";
    buildDestinationsList(container, { idPrefix });
  });
}

export function buildDestinationsList(container, { idPrefix = "dest" } = {}) {
  if (!container) return;

  container.innerHTML = "";
  container.className = "menu__dest-list";

  DESTINATION_GROUPS.forEach(({ id, label }) => {
    const locations = LOCATION_GROUPS[id] || [];
    const items = locations.length ? locations : [{ name: "Coming soon", country: "" }];
    const group = document.createElement("div");
    group.className = "menu__dest-group";
    group.dataset.group = id;

    const row = document.createElement("div");
    row.className = "menu__dest-row";

    const chevron = document.createElement("img");
    chevron.className = "menu__dest-chevron";
    chevron.src = "assets/chevron-dark.svg";
    chevron.alt = "";
    chevron.width = 12;
    chevron.height = 12;
    chevron.setAttribute("aria-hidden", "true");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "menu__dest-toggle";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-controls", `${idPrefix}-${id}`);

    const toggleLabel = document.createElement("span");
    toggleLabel.className = "menu__dest-toggle-label";
    toggleLabel.textContent = label;
    toggleBtn.append(toggleLabel, chevron);

    const list = document.createElement("ul");
    list.className = "menu__dest-properties";
    list.id = `${idPrefix}-${id}`;
    list.hidden = true;

    items.forEach((loc) => {
      const item = document.createElement("li");
      const text = loc.country ? `${loc.name}, ${loc.country}` : loc.name;

      if (loc.name === ACTIVE_DESTINATION) {
        const link = document.createElement("a");
        link.className = "menu__dest-property menu__dest-property--active";
        link.href = COMING_SOON_PAGE;
        link.textContent = text;
        item.appendChild(link);
      } else {
        const inactiveLabel = document.createElement("span");
        inactiveLabel.className = "menu__dest-property";
        inactiveLabel.textContent = text;
        item.appendChild(inactiveLabel);
      }

      list.appendChild(item);
    });

    const toggleGroup = () => {
      const open = !group.classList.contains("is-open");
      collapseDestinations(container);
      if (open) {
        group.classList.add("is-open");
        list.hidden = false;
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    };

    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleGroup();
    });

    row.append(toggleBtn);
    group.append(row, list);
    container.appendChild(group);
  });
}
