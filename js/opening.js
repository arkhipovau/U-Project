import { OPENING_SLIDES } from "./data.js";

export function initOpening() {
  const section = document.querySelector(".opening");
  if (!section) return;

  const sticky = section.querySelector(".opening__sticky");
  const bgRoot = section.querySelector(".opening__bg");
  const label = section.querySelector(".opening__caption-label");
  const progressEl = section.querySelector(".opening__progress");

  OPENING_SLIDES.forEach((slide, i) => {
    const el = document.createElement("div");
    el.className = `opening__bg-slide opening__bg-slide--${i}` + (i === 0 ? " is-active" : "");

    if (slide.stacked && slide.layers) {
      const stack = document.createElement("div");
      stack.className = "opening__bg-stack";
      stack.style.left = slide.mediaLeft;
      stack.style.width = `${slide.mediaWidth}px`;
      slide.layers.forEach((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        stack.appendChild(img);
      });
      el.appendChild(stack);
    } else {
      const img = document.createElement("img");
      img.className = "opening__bg-media";
      img.src = slide.image;
      img.alt = "";
      img.style.width = `${slide.mediaWidth}px`;
      img.style.left = slide.mediaLeft;
      el.appendChild(img);
    }

    bgRoot?.appendChild(el);
  });

  const slides = [...section.querySelectorAll(".opening__bg-slide")];

  function update(scrollProgress) {
    const slideCount = slides.length;
    const scaled = scrollProgress * slideCount;
    const index = Math.min(slideCount - 1, Math.floor(scaled));
    const local = scaled - index;

    slides.forEach((s, i) => {
      if (i === index) {
        s.classList.add("is-active");
        s.style.opacity = String(1 - local * 0.35);
      } else if (i === index + 1) {
        s.classList.add("is-active");
        s.style.opacity = String(local * 0.85);
      } else {
        s.classList.remove("is-active");
        s.style.opacity = "";
      }
    });

    if (label) label.textContent = OPENING_SLIDES[index].label;
    if (progressEl) {
      progressEl.dataset.active = String(index);
      progressEl.querySelectorAll(".opening__progress-item").forEach((dot, i) => {
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }
  }

  function syncPinState() {
    if (!sticky) return;

    const vh = window.innerHeight;
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - vh;

    sticky.classList.remove("is-pinned", "is-ended");

    if (rect.top > 0) {
      sticky.style.width = "";
    } else if (scrollable > 0 && rect.bottom <= vh + 1) {
      sticky.classList.add("is-ended");
      sticky.style.width = "";
    } else {
      sticky.classList.add("is-pinned");
      const pinW = section.getBoundingClientRect().width;
      sticky.style.width = `${pinW}px`;
    }
  }

  function onScroll() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollable = section.offsetHeight - vh;

    syncPinState();

    if (scrollable <= 0) {
      update(0);
      return;
    }

    const p = Math.min(1, Math.max(0, -rect.top / scrollable));
    update(p);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}
