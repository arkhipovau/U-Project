export const COMING_SOON_PAGE = "coming-soon.html";

export function initComingSoonLinks() {
  document.querySelectorAll("[data-coming-soon]").forEach((el) => {
    if (el instanceof HTMLAnchorElement) {
      el.href = COMING_SOON_PAGE;
    }
  });
}
