import { LOCATION_GROUPS } from "./data.js";
import {
  loadBackgroundImage,
  prefetchImage,
  resolveImageUrl,
  ECOSYSTEM_GRADIENT,
} from "./lazy-media.js";

const ALPINE_PLACEHOLDER = "../assets/ecosystem-bg-alpine.png";

let ecosystemNavigate = null;

/** Jump to a destination group + property index (ecosystem carousel). */
export function goToEcosystemLocation(group, index = 0) {
  ecosystemNavigate?.(group, index);
}

export function initLocations() {
  const section = document.querySelector(".ecosystem");
  if (!section) return;

  const bg = section.querySelector(".ecosystem__bg");
  const pill = section.querySelector(".ecosystem__location-pill");
  const pillLabel = pill?.querySelector(".ecosystem__location-pill__label");
  const pillIsLink = pill?.tagName === "A";
  const tabs = [...section.querySelectorAll(".ecosystem__tab")];
  const prev = section.querySelector(".ecosystem__nav-btn--prev");
  const next = section.querySelector(".ecosystem__nav-btn--next");
  const media = section.querySelector(".ecosystem__media");

  let group = "tropical";
  let index = 0;
  let photosEnabled = false;
  const groupOrder = tabs.map((tab) => tab.dataset.group).filter(Boolean);

  function groupAt(offset) {
    if (!groupOrder.length) return group;
    const currentIdx = Math.max(0, groupOrder.indexOf(group));
    const nextIdx = (currentIdx + offset + groupOrder.length) % groupOrder.length;
    return groupOrder[nextIdx];
  }

  function stepForward() {
    const list = currentList();
    if (list.length && index < list.length - 1) {
      index += 1;
      return;
    }

    group = groupAt(1);
    index = 0;
  }

  function stepBackward() {
    const list = currentList();
    if (list.length && index > 0) {
      index -= 1;
      return;
    }

    group = groupAt(-1);
    const prevList = currentList();
    index = prevList.length ? prevList.length - 1 : 0;
  }

  function currentList() {
    return LOCATION_GROUPS[group] || [];
  }

  function prefetchEcosystemNeighbors() {
    const list = currentList();
    if (!list.length) return;
    const urls = [
      list[(index - 1 + list.length) % list.length]?.image,
      list[(index + 1) % list.length]?.image,
    ].filter(Boolean);
    urls.forEach(prefetchImage);
  }

  function applyEcosystemPhoto(url) {
    if (!bg || !url) return;
    bg.dataset.bgTarget = resolveImageUrl(url);
    if (!photosEnabled) {
      bg.style.backgroundImage = ECOSYSTEM_GRADIENT;
      bg.dataset.pendingImage = url;
      delete bg.dataset.loadedUrl;
      return;
    }
    loadBackgroundImage(bg, url);
    prefetchEcosystemNeighbors();
  }

  function enableEcosystemPhotos() {
    if (photosEnabled) return;
    photosEnabled = true;
    render();
  }

  ecosystemNavigate = (targetGroup, targetIndex = 0) => {
    enableEcosystemPhotos();
    group = targetGroup;
    const list = LOCATION_GROUPS[targetGroup] || [];
    index = list.length ? Math.min(Math.max(0, targetIndex), list.length - 1) : 0;
    render();
  };

  function render() {
    const list = currentList();
    const comingSoon = list.length === 0;

    section.classList.toggle("ecosystem--coming-soon", comingSoon);

    if (comingSoon) {
      const empty = "Coming soon";
      if (pillLabel) pillLabel.textContent = empty;
      else if (pill) pill.textContent = empty;
      if (pill) {
        pill.removeAttribute("title");
        pill.classList.add("ecosystem__location-pill--static");
      }
      if (pillIsLink) {
        pill.removeAttribute("href");
        pill.setAttribute("aria-disabled", "true");
      }
      if (bg) {
        applyEcosystemPhoto(ALPINE_PLACEHOLDER);
      }
    } else {
      const item = list[index];
      const label = `${item.name}, ${item.country}`;
      if (pillLabel) pillLabel.textContent = label;
      else if (pill) pill.textContent = label;
      if (pill) pill.classList.remove("ecosystem__location-pill--static");
      if (pillIsLink) {
        pill.href = "../coming-soon.html";
        pill.title = label;
        pill.removeAttribute("aria-disabled");
      }
      if (item.image) {
        applyEcosystemPhoto(item.image);
      }
    }

    tabs.forEach((tab) => {
      const isActive = tab.dataset.group === group;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        enableEcosystemPhotos();
        sectionObserver.disconnect();
      }
    },
    { rootMargin: "280px" }
  );
  sectionObserver.observe(section);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      enableEcosystemPhotos();
      const g = tab.dataset.group;
      if (!g) return;
      group = g;
      index = 0;
      render();
    });
  });

  prev?.addEventListener("click", () => {
    enableEcosystemPhotos();
    stepBackward();
    render();
  });

  next?.addEventListener("click", () => {
    enableEcosystemPhotos();
    stepForward();
    render();
  });

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let gestureLocked = false;
  let horizontalGesture = false;

  const SWIPE_MIN_X = 28;
  const SWIPE_LOCK_X = 8;
  const SWIPE_LOCK_Y = 8;

  media?.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    enableEcosystemPhotos();
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    gestureLocked = false;
    horizontalGesture = false;

    if (media.hasPointerCapture && !media.hasPointerCapture(e.pointerId)) {
      media.setPointerCapture(e.pointerId);
    }
  });

  media?.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!gestureLocked && (absX > SWIPE_LOCK_X || absY > SWIPE_LOCK_Y)) {
      gestureLocked = true;
      horizontalGesture = absX > absY * 1.1;
    }

    if (horizontalGesture) e.preventDefault();
  });

  function endSwipe(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (horizontalGesture && absX >= SWIPE_MIN_X && absX > absY) {
      if (dx < 0) stepForward();
      else stepBackward();
      render();
    }

    if (media?.hasPointerCapture?.(e.pointerId)) {
      media.releasePointerCapture(e.pointerId);
    }

    dragging = false;
    gestureLocked = false;
    horizontalGesture = false;
    pointerId = null;
  }

  media?.addEventListener("pointerup", endSwipe);
  media?.addEventListener("pointercancel", endSwipe);
  media?.addEventListener("pointerleave", endSwipe);

  render();
}
