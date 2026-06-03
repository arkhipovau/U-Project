/**
 * Hero uses Swiper (swiper@11): cards swiper is master, background swiper follows via controller.
 * @see https://swiperjs.com/swiper-api#controller
 */
import Swiper from "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs";
import { HERO_LOCATIONS } from "./data.js";

export function initHero(parallax) {
  const section = document.querySelector(".hero");
  if (!section) return;

  const bgSwiperEl = section.querySelector(".hero__bg-swiper");
  const cardsSwiperEl = section.querySelector(".hero__cards-swiper");
  const bgWrapper = bgSwiperEl?.querySelector(".swiper-wrapper");
  const cardsWrapper = cardsSwiperEl?.querySelector(".swiper-wrapper");
  if (!bgSwiperEl || !cardsSwiperEl || !bgWrapper || !cardsWrapper) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  HERO_LOCATIONS.forEach((loc) => {
    const bgSlide = document.createElement("div");
    bgSlide.className = "swiper-slide";
    const layer = document.createElement("div");
    layer.className = "hero__bg-layer";
    layer.dataset.parallax = "bg";
    layer.style.backgroundImage = `url("${loc.bg}")`;
    bgSlide.appendChild(layer);
    bgWrapper.appendChild(bgSlide);
    parallax?.register?.(layer);

    const cardSlide = document.createElement("div");
    cardSlide.className = "swiper-slide";
    cardSlide.setAttribute("role", "listitem");

    const card = document.createElement("a");
    card.className = "location-card";
    card.href = loc.href;
    card.innerHTML = `
      <div class="location-card__label">
        <span>${loc.label}</span>
        <img src="assets/chevron.svg" alt="" width="12" height="12" draggable="false" />
      </div>
    `;
    cardSlide.appendChild(card);
    cardsWrapper.appendChild(cardSlide);
  });

  const cards = [...cardsWrapper.querySelectorAll(".location-card")];

  function syncCenterCard(swiper) {
    const idx = swiper.realIndex;
    cards.forEach((card, i) => card.classList.toggle("is-center", i === idx));
  }

  const bgSwiper = new Swiper(bgSwiperEl, {
    loop: true,
    allowTouchMove: false,
    effect: "fade",
    fadeEffect: { crossFade: true },
    speed: reducedMotion ? 0 : 1100,
    slidesPerView: 1,
    watchSlidesProgress: true,
  });

  const cardsSwiper = new Swiper(cardsSwiperEl, {
    loop: true,
    slidesPerView: "auto",
    centeredSlides: true,
    spaceBetween: 22,
    speed: reducedMotion ? 0 : 480,
    slideToClickedSlide: true,
    grabCursor: true,
    initialSlide: Math.min(1, HERO_LOCATIONS.length - 1),
    watchSlidesProgress: true,
    touchAngle: 40,
    threshold: 6,
    touchStartPreventDefault: false,
    resistanceRatio: 0.72,
    pagination: {
      el: cardsSwiperEl.querySelector(".swiper-pagination"),
      clickable: true,
    },
    navigation: {
      nextEl: cardsSwiperEl.querySelector(".swiper-button-next"),
      prevEl: cardsSwiperEl.querySelector(".swiper-button-prev"),
    },
    scrollbar: {
      el: cardsSwiperEl.querySelector(".swiper-scrollbar"),
      draggable: true,
    },
    ...(reducedMotion
      ? {}
      : {
          autoplay: {
            delay: 12000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
        }),
    controller: {
      control: bgSwiper,
      by: "slide",
    },
    on: {
      init(swiper) {
        syncCenterCard(swiper);
      },
      slideChange(swiper) {
        syncCenterCard(swiper);
      },
    },
  });

  return { cardsSwiper, bgSwiper };
}
