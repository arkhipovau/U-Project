const ECOSYSTEM_GRADIENT =
  "linear-gradient(180deg, rgba(51, 47, 46, 0) 86.13%, #332f2e 108.21%)";

export const MEDIA_VERSION = "20260604-2000";

/** No re-encode — keeps full source bitrate (footer CTA). */
const SOURCE_ONLY_VIDEOS = new Set(["footer"]);

const loaded = new Map();

function cacheKey(url) {
  return url;
}

/** Mobile delivery — JPEG in ../assets/opt/ (see scripts/optimize-media.sh). */
export function resolveImageUrl(url) {
  if (!url) return url;
  const [path] = url.split("?");

  const optMatch = path.match(/(?:^|\.\.\/)assets\/opt\/(.+)\.(png|jpe?g)$/i);
  if (optMatch) {
    return `../assets/opt/${optMatch[1]}.jpg?v=${MEDIA_VERSION}`;
  }

  const sourceMatch = path.match(/(?:^|\.\.\/)assets\/(?!opt\/)(.+)\.(png|jpe?g)$/i);
  if (!sourceMatch) return url;

  return `../assets/opt/${sourceMatch[1]}.jpg?v=${MEDIA_VERSION}`;
}

export function resolvePosterUrl(url) {
  return resolveImageUrl(url);
}

function finishCardImage(img) {
  img.classList.remove("is-loading");
  img.classList.add("is-ready");
}

/** Card-sized image — opt JPEG with loading state. */
export function loadCardImage(img, url) {
  if (!img) return Promise.resolve();

  const source = url || img.dataset.src || img.getAttribute("src");
  const deliveryUrl = resolveImageUrl(source);
  if (!deliveryUrl) return Promise.resolve();

  img.dataset.loadedUrl = deliveryUrl;

  if (img.complete && img.naturalWidth > 0 && img.src.includes(deliveryUrl.split("?")[0])) {
    finishCardImage(img);
    return Promise.resolve();
  }

  img.classList.add("is-loading");

  return new Promise((resolve) => {
    const onDone = () => {
      finishCardImage(img);
      resolve();
    };

    img.decoding = "async";
    img.onload = onDone;
    img.onerror = () => {
      if (deliveryUrl !== source && source) {
        img.src = source;
        img.onload = onDone;
        img.onerror = () => {
          img.classList.remove("is-loading");
          resolve();
        };
        return;
      }
      img.classList.remove("is-loading");
      resolve();
    };
    img.src = deliveryUrl;
  });
}

/** Upgrade static card images (Days carousel, etc.) to opt delivery. */
export function initCardImages(root = document) {
  root.querySelectorAll("[data-card-media], .days__card img").forEach((img) => {
    loadCardImage(img);
  });
}

export function applyVideoPoster(video) {
  if (!video) return;
  const raw = video.dataset.poster || video.getAttribute("poster");
  if (!raw) return;
  video.poster = resolvePosterUrl(raw);
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

let supportsWebM;

/** Prefer VP9 WebM where supported; MP4 fallback elsewhere (older Safari). */
export function prefersWebMVideo() {
  if (supportsWebM !== undefined) return supportsWebM;

  const probe = document.createElement("video");
  supportsWebM =
    probe.canPlayType('video/webm; codecs="vp9"') !== "" ||
    probe.canPlayType("video/webm") !== "";

  return supportsWebM;
}

function parseVideoAsset(url) {
  if (!url) return null;

  const [path, query] = url.split("?");
  const match = path.match(/(?:^|\/)assets\/(.+)\.(mp4|webm)$/i);
  if (!match) return null;

  return {
    name: match[1],
    assetRoot: path.includes("../") ? "../assets" : "assets",
    query,
  };
}

export function resolveVideoUrl(url, { format } = {}) {
  const asset = parseVideoAsset(url);
  if (!asset) return url;

  const useWebM = format === "webm" || (format !== "mp4" && prefersWebMVideo());
  const ext = useWebM ? "webm" : "mp4";
  const { name, assetRoot, query } = asset;

  let delivery;
  if (SOURCE_ONLY_VIDEOS.has(name)) {
    delivery = `${assetRoot}/${name}.${ext}?v=${MEDIA_VERSION}`;
  } else {
    delivery = `${assetRoot}/opt/${name}.${ext}?v=${MEDIA_VERSION}`;
  }

  if (query && !query.includes("v=")) {
    delivery = `${delivery}&${query}`;
  }

  return delivery;
}

export function ensureVideoSource(video, url) {
  if (!video || !url) return;

  const primary = resolveVideoUrl(url);
  if (video.dataset.loadedUrl === primary) return;

  const applySource = (src) => {
    video.src = src;
    video.dataset.loadedUrl = src;
    video.load();
  };

  const onError = () => {
    video.removeEventListener("error", onError);
    const fallback = resolveVideoUrl(url, { format: "mp4" });
    if (fallback === primary || video.dataset.loadedUrl === fallback) return;
    applySource(fallback);
  };

  if (primary.includes(".webm")) {
    video.addEventListener("error", onError, { once: true });
  }

  applySource(primary);
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

    const tryPlay = () => {
      const p = video.play();
      if (p?.catch) p.catch(() => {});
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
      return;
    }

    const onReady = () => {
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("loadeddata", onReady);
      tryPlay();
    };

    video.addEventListener("canplay", onReady);
    video.addEventListener("loadeddata", onReady);
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
