/** Autoplay Beyond card videos when visible (Safari-friendly). */
export function initBeyond() {
  const videos = [...document.querySelectorAll(".beyond__video")];
  if (!videos.length) return;

  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");

    function play() {
      const p = video.play();
      if (p?.catch) p.catch(() => {});
    }

    function pause() {
      if (!video.paused) video.pause();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) play();
          else pause();
        });
      },
      { threshold: 0.25, rootMargin: "0px" }
    );

    observer.observe(video);

    const rect = video.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      play();
    }
  });
}
