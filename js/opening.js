import Swiper from "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs";
import { OPENING_SLIDES } from "./data.js";

const OPENING_SWIPER = {
  slidesPerView: 1,
  loop: true,
  loopAdditionalSlides: 1,
  speed: 400,
  spaceBetween: 0,
};

function appendSlideMedia(slideEl, slide) {
  if (slide.video) {
    const video = document.createElement("video");
    video.className = "opening__bg-media";
    video.src = slide.video;
    video.poster = slide.image || "";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.style.width = `${slide.mediaWidth}px`;
    video.style.left = slide.mediaLeft;

    video.addEventListener(
      "error",
      () => {
        const img = document.createElement("img");
        img.className = "opening__bg-media";
        img.src = slide.image;
        img.alt = "";
        img.style.width = `${slide.mediaWidth}px`;
        img.style.left = slide.mediaLeft;
        video.replaceWith(img);
      },
      { once: true }
    );

    slideEl.appendChild(video);
    return video;
  }

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
    slideEl.appendChild(stack);
    return null;
  }

  const img = document.createElement("img");
  img.className = "opening__bg-media";
  img.src = slide.image;
  img.alt = "";
  img.style.width = `${slide.mediaWidth}px`;
  img.style.left = slide.mediaLeft;
  slideEl.appendChild(img);
  return null;
}

function syncVideos(slides, activeIndex) {
  slides.forEach(({ video }, i) => {
    if (!video) return;
    const active = i === activeIndex;
    if (active) {
      if (video.paused) {
        const p = video.play();
        if (p?.catch) p.catch(() => {});
      }
    } else if (!video.paused) {
      video.pause();
    }
  });
}

export function initOpening() {
  const section = document.querySelector(".opening");
  if (!section) return;

  const swiperEl = section.querySelector(".opening__slider");
  const wrapper = swiperEl?.querySelector(".swiper-wrapper");
  const prevBtn = section.querySelector(".opening__nav-btn--prev");
  const nextBtn = section.querySelector(".opening__nav-btn--next");
  if (!swiperEl || !wrapper) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slideEntries = [];

  OPENING_SLIDES.forEach((slide, i) => {
    const swiperSlide = document.createElement("div");
    swiperSlide.className = "swiper-slide";

    const inner = document.createElement("div");
    inner.className = `opening__bg-slide opening__bg-slide--${i}`;
    const video = appendSlideMedia(inner, slide);
    swiperSlide.appendChild(inner);
    wrapper.appendChild(swiperSlide);

    slideEntries.push({ video });
  });

  const openingSwiper = new Swiper(swiperEl, {
    slidesPerView: OPENING_SWIPER.slidesPerView,
    loop: OPENING_SWIPER.loop,
    loopAdditionalSlides: OPENING_SWIPER.loopAdditionalSlides,
    speed: reducedMotion ? 0 : OPENING_SWIPER.speed,
    spaceBetween: OPENING_SWIPER.spaceBetween,
    grabCursor: true,
    navigation: {
      prevEl: prevBtn,
      nextEl: nextBtn,
    },
    on: {
      init(swiper) {
        syncVideos(slideEntries, swiper.realIndex);
      },
      slideChange(swiper) {
        syncVideos(slideEntries, swiper.realIndex);
      },
    },
  });

  return openingSwiper;
}
