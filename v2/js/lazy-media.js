const ECOSYSTEM_GRADIENT =
  "linear-gradient(180deg, rgba(51, 47, 46, 0) 86.13%, #332f2e 108.21%)";

export const MEDIA_VERSION = "20260610-1330";

/** No re-encode — keeps full source bitrate (footer CTA). */
const SOURCE_ONLY_VIDEOS = new Set(["footer"]);

const loaded = new Map();

function cacheKey(url) {
  return url;
}

/** Mobile delivery — full-res JPEG in ../assets/opt/ (see scripts/optimize-media.sh). */
export function resolveImageUrl(url) {
  if (!url) return url;
  const [path] = url.split("?");
  const match = path.match(/^assets\/(.+)\.(png|jpe?g)$/i);
  if (!match) return url;
  return `../assets/opt/${match[1]}.jpg?v=${MEDIA_VERSION}`;
}

function applyBackground(el, deliveryUrl, gradient) {
  el.style.backgroundImage = gradient ? `${gradient}, url("${deliveryUrl}")` : `url("${deliveryUrl}")`;
  el.dataset.loadedUrl = deliveryUrl;
  el.classList.remove("is-loading");
  el.classList.add("is-ready");
}

/** Decode image off the critical path, then apply as CSS background. */
export function loadBackgroundImage(el, url, gradient = ECOSYSTEM_GRADIENT) {
  if (!el || !url) return Promise.resolve();

  const deliveryUrl = resolveImageUrl(url);
  const key = cacheKey(deliveryUrl);

  el.dataset.bgTarget = deliveryUrl;

  if (el.dataset.loadedUrl === deliveryUrl) {
    return Promise.resolve();
  }

  if (loaded.get(key) === "done") {
    if (el.dataset.bgTarget === deliveryUrl) {
      applyBackground(el, deliveryUrl, gradient);
    }
    return Promise.resolve();
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";

    const finish = (targetUrl) => {
      if (el.dataset.bgTarget !== targetUrl) {
        resolve();
        return;
      }
      applyBackground(el, targetUrl, gradient);
      loaded.set(cacheKey(targetUrl), "done");
      resolve();
    };

    img.onload = () => finish(deliveryUrl);

    img.onerror = () => {
      if (el.dataset.bgTarget !== deliveryUrl) {
        resolve();
        return;
      }
      if (deliveryUrl !== url) {
        loaded.delete(key);
        el.dataset.bgTarget = url;
        loadBackgroundImage(el, url, gradient).then(resolve);
        return;
      }
      el.classList.remove("is-loading");
      loaded.set(key, "error");
      resolve();
    };

    el.classList.add("is-loading");
    img.src = deliveryUrl;
  });

  loaded.set(key, "pending");
  loaded.set(`${key}:promise`, promise);
  return promise;
}

export function prefetchImage(url) {
  if (!url) return;
  const deliveryUrl = resolveImageUrl(url);
  const key = cacheKey(deliveryUrl);
  if (loaded.has(key)) return;
  loaded.set(key, "prefetch");
  const img = new Image();
  img.decoding = "async";
  img.onload = () => loaded.set(key, "done");
  img.onerror = () => loaded.delete(key);
  img.src = deliveryUrl;
}

export function prefetchImages(urls) {
  urls.forEach(prefetchImage);
}

export function resolveVideoUrl(url) {
  if (!url) return url;
  const [path] = url.split("?");
  const match = path.match(/^assets\/(.+)\.mp4$/i);
  if (!match) return url;
  if (SOURCE_ONLY_VIDEOS.has(match[1])) {
    return `${path}?v=${MEDIA_VERSION}`;
  }
  return `../assets/opt/${match[1]}.mp4?v=${MEDIA_VERSION}`;
}

export function ensureVideoSource(video, url) {
  if (!video || !url) return;
  const deliveryUrl = resolveVideoUrl(url);
  if (video.dataset.loadedUrl === deliveryUrl) return;

  video.src = deliveryUrl;
  video.dataset.loadedUrl = deliveryUrl;
  video.load();
}

export function clearVideoSource(video) {
  if (!video) return;
  video.pause();
  video.removeAttribute("src");
  delete video.dataset.loadedUrl;
  video.load();
}

/** Load video when near viewport; optional play when visible. */
export function attachLazyVideo(video, { rootMargin = "160px", threshold = 0.15, autoplay = true } = {}) {
  const rawSrc = video.dataset.src;
  if (!rawSrc) return;

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "true");
  video.preload = "none";

  const play = () => {
    ensureVideoSource(video, rawSrc);
    if (!autoplay) return;
    const p = video.play();
    if (p?.catch) p.catch(() => {});
  };

  const pause = () => {
    if (!video.paused) video.pause();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) play();
        else pause();
      });
    },
    { threshold, rootMargin }
  );

  observer.observe(video);
}

export { ECOSYSTEM_GRADIENT };
