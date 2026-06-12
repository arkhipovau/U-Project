/**
 * Hero uses Swiper (swiper@11): cards swiper is master; background follows realIndex.
 */
import Swiper from "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs";
import { COMING_SOON_PAGE } from "./coming-soon.js";
import { HERO_LOCATIONS } from "./data.js";
import { loadBackgroundImage, prefetchImage } from "./lazy-media.js";

/** Figma hero location card — 314×420 */
const HERO_CARD_DESIGN_W = 314;
const HERO_CARD_DESIGN_H = 420;

const HERO_START_INDEX = Math.min(1, HERO_LOCATIONS.length - 1);

/** Background swiper — one full-bleed slide at a time. */
const HERO_BG_SWIPER = {
  slidesPerView: 1,
  loop: true,
  loopAdditionalSlides: 2,
  speed: 400,
};

/** Cards swiper — centered active card with side peeks (contours). */
const HERO_CARDS_SWIPER = {
  slidesPerView: "auto",
  centeredSlides: true,
  loop: true,
  loopAdditionalSlides: 2,
  speed: 400,
  spaceBetween: 14,
};

function heroCardWidthPx() {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const appW = parseFloat(styles.getPropertyValue("--app-width")) || window.innerWidth;
  const peek = parseFloat(styles.getPropertyValue("--hero-card-peek")) || 36;
  return Math.min(HERO_CARD_DESIGN_W, Math.max(260, Math.round(appW - peek * 2)));
}

function applyHeroCardMetrics() {
  const w = heroCardWidthPx();
  const h = Math.round((w * HERO_CARD_DESIGN_H) / HERO_CARD_DESIGN_W);
  const root = document.documentElement;
  root.style.setProperty("--hero-card-width", `${w}px`);
  root.style.setProperty("--hero-card-height", `${h}px`);
}

export function initHero(parallax) {
  const section = document.querySelector(".hero");
  if (!section) return;

  const bgSwiperEl = section.querySelector(".hero__bg-swiper");
  const cardsSwiperEl = section.querySelector(".hero__cards-swiper");
  const bgWrapper = bgSwiperEl?.querySelector(".swiper-wrapper");
  const cardsWrapper = cardsSwiperEl?.querySelector(".swiper-wrapper");
  if (!bgSwiperEl || !cardsSwiperEl || !bgWrapper || !cardsWrapper) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionMs = reducedMotion ? 0 : HERO_BG_SWIPER.speed;

  applyHeroCardMetrics();

  function loadHeroSlidesAround(realIndex) {
    const count = HERO_LOCATIONS.length;
    for (let offset = -1; offset <= 1; offset += 1) {
      const i = (realIndex + offset + count) % count;
      section.querySelectorAll(`.hero__bg-layer[data-bg-index="${i}"]`).forEach((layer) => {
        loadBackgroundImage(layer, layer.dataset.bg, null);
      });
    }
    const next = (realIndex + 2) % count;
    const prev = (realIndex - 2 + count) % count;
    prefetchImage(HERO_LOCATIONS[next]?.bg);
    prefetchImage(HERO_LOCATIONS[prev]?.bg);
  }

  HERO_LOCATIONS.forEach((loc, i) => {
    const bgSlide = document.createElement("div");
    bgSlide.className = "swiper-slide";
    const layer = document.createElement("div");
    layer.className = "hero__bg-layer";
    layer.dataset.parallax = "bg";
    layer.dataset.bg = loc.bg;
    layer.dataset.bgIndex = String(i);
    bgSlide.appendChild(layer);
    bgWrapper.appendChild(bgSlide);
    parallax?.register?.(layer);

    const cardSlide = document.createElement("div");
    cardSlide.className = "swiper-slide";
    cardSlide.setAttribute("role", "listitem");

    const card = document.createElement("a");
    card.className = "location-card";
    card.href = COMING_SOON_PAGE;
    card.innerHTML = `
      <div class="location-card__label">
        <span>${loc.label}</span>
        <img src="../assets/chevron.svg" alt="" width="12" height="12" draggable="false" />
      </div>
    `;
    cardSlide.appendChild(card);
    cardsWrapper.appendChild(cardSlide);
  });

  /** Loop duplicates break index-based matching — use the active slide only. */
  function syncCenterCard(cardsSwiper) {
    section.querySelectorAll(".hero__cards-swiper .location-card").forEach((card) => {
      card.classList.remove("is-center");
    });
    const activeSlide = cardsSwiper.slides[cardsSwiper.activeIndex];
    activeSlide?.querySelector(".location-card")?.classList.add("is-center");
  }

  function syncBgFromCards(cardsSwiper, speed = transitionMs) {
    const idx = cardsSwiper.realIndex;
    if (bgSwiper.realIndex === idx && !cardsSwiper.animating) return;
    bgSwiper.slideToLoop(idx, speed);
  }

  function syncHero(cardsSwiper, speed = transitionMs) {
    syncBgFromCards(cardsSwiper, speed);
    syncCenterCard(cardsSwiper);
    loadHeroSlidesAround(cardsSwiper.realIndex);
  }

  const bgSwiper = new Swiper(bgSwiperEl, {
    slidesPerView: HERO_BG_SWIPER.slidesPerView,
    loop: HERO_BG_SWIPER.loop,
    loopAdditionalSlides: HERO_BG_SWIPER.loopAdditionalSlides,
    initialSlide: HERO_START_INDEX,
    allowTouchMove: false,
    effect: "fade",
    fadeEffect: { crossFade: true },
    speed: transitionMs,
    watchSlidesProgress: true,
  });

  const cardsSwiper = new Swiper(cardsSwiperEl, {
    slidesPerView: HERO_CARDS_SWIPER.slidesPerView,
    centeredSlides: HERO_CARDS_SWIPER.centeredSlides,
    loop: HERO_CARDS_SWIPER.loop,
    loopAdditionalSlides: HERO_CARDS_SWIPER.loopAdditionalSlides,
    spaceBetween: HERO_CARDS_SWIPER.spaceBetween,
    speed: transitionMs,
    slideToClickedSlide: true,
    grabCursor: true,
    initialSlide: HERO_START_INDEX,
    watchSlidesProgress: true,
    touchAngle: 40,
    threshold: 6,
    touchStartPreventDefault: false,
    resistanceRatio: 0.72,
    observer: true,
    observeParents: true,
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
    on: {
      init(swiper) {
        applyHeroCardMetrics();
        swiper.update();
        syncHero(swiper, 0);
      },
      slideChange(swiper) {
        syncHero(swiper);
      },
    },
  });

  const reflowHeroCards = () => {
    applyHeroCardMetrics();
    cardsSwiper.update();
    syncHero(cardsSwiper, 0);
  };

  window.addEventListener("resize", reflowHeroCards, { passive: true });
  window.addEventListener("orientationchange", reflowHeroCards, { passive: true });

  return { cardsSwiper, bgSwiper };
}
