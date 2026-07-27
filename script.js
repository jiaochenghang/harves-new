const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".site-nav");
const progress = document.querySelector(".progress span");
const sections = [...document.querySelectorAll(".block")];
const navLinks = [...document.querySelectorAll(".site-nav a")];
const hero = document.querySelector(".hero-block");
const buildBlock = document.querySelector(".build-block");
const heroVideo = document.querySelector(".hero-video-main");
const siteLoader = document.querySelector(".site-loader");
const siteLoaderAction = document.querySelector(".site-loader-action");
const HERO_INTRO_END = 5.04;
const HERO_LOOP_END = 9.08;
let ticking = false;
let heroState = "loading";
let pendingScrollTransition = false;
let blockedTarget = "intro";

const playHeroVideo = async () => {
  if (!heroVideo) return false;
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.setAttribute("muted", "");
  heroVideo.setAttribute("playsinline", "");
  heroVideo.setAttribute("webkit-playsinline", "");
  try {
    await heroVideo.play();
    return true;
  } catch {
    return false;
  }
};

const setHeroState = (state) => {
  heroState = state;
  hero?.classList.toggle("hero-scroll-ended", state === "content");
};

const hideLoader = () => {
  siteLoader?.classList.remove("is-blocked");
  document.body.classList.remove("is-loading");
};

const showPlaybackButton = (target) => {
  blockedTarget = target;
  setHeroState("blocked");
  siteLoader?.classList.add("is-blocked");
  document.body.classList.add("is-loading");
};

const startIntro = async () => {
  if (!heroVideo || heroState === "intro") return heroState === "intro";
  if (heroState === "loop" || heroState === "transition" || heroState === "content") return false;
  setHeroState("intro");
  heroVideo.currentTime = 0;
  const started = await playHeroVideo();
  if (started) {
    hideLoader();
    return true;
  }
  showPlaybackButton("intro");
  return false;
};

const startLoop = async ({ force = false } = {}) => {
  if (!heroVideo) return false;
  if (!force && (heroState === "transition" || heroState === "content")) return false;
  pendingScrollTransition = false;
  setHeroState("loop");
  if (heroVideo.currentTime < HERO_INTRO_END || heroVideo.currentTime >= HERO_LOOP_END) {
    heroVideo.currentTime = HERO_INTRO_END;
  }
  const started = await playHeroVideo();
  if (started) {
    hideLoader();
  } else {
    showPlaybackButton("loop");
  }
  return started;
};

const showBuildBlock = () => {
  setHeroState("content");
  window.requestAnimationFrame(() => {
    buildBlock?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

const startScrollTransition = async () => {
  if (!heroVideo || heroState === "transition" || heroState === "content") return false;
  if (heroState === "loading" || heroState === "blocked") {
    pendingScrollTransition = true;
    return false;
  }
  setHeroState("transition");
  heroVideo.currentTime = HERO_LOOP_END;
  const started = await playHeroVideo();
  if (!started) {
    pendingScrollTransition = true;
    showPlaybackButton("transition");
  }
  return started;
};

const waitUntilPlayable = (video) =>
  new Promise((resolve) => {
    if (!video || video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve();
      return;
    }

    const finish = () => {
      video.removeEventListener("canplay", finish);
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("error", finish);
      resolve();
    };

    video.addEventListener("canplay", finish, { once: true });
    video.addEventListener("loadeddata", finish, { once: true });
    video.addEventListener("error", finish, { once: true });
    video.load();
  });

const finishLoading = async () => {
  await Promise.race([
    waitUntilPlayable(heroVideo),
    new Promise((resolve) => window.setTimeout(resolve, 8000)),
  ]);
  if (heroState !== "loading") return;
  await startIntro();
};

if (heroVideo) {
  heroVideo.addEventListener("timeupdate", () => {
    if (heroState === "intro" && heroVideo.currentTime >= HERO_INTRO_END) {
      if (pendingScrollTransition) {
        pendingScrollTransition = false;
        startScrollTransition();
      } else {
        startLoop();
      }
    } else if (heroState === "loop" && heroVideo.currentTime >= HERO_LOOP_END - 0.05) {
      heroVideo.currentTime = HERO_INTRO_END;
      playHeroVideo();
    }
  });

  heroVideo.addEventListener("ended", () => {
    if (heroState !== "transition") return;
    heroVideo.pause();
    showBuildBlock();
  });

  heroVideo.addEventListener("error", () => {
    if (heroState === "transition") {
      showBuildBlock();
    } else {
      showPlaybackButton(heroState === "loop" ? "loop" : "intro");
    }
  });

  finishLoading();
} else {
  document.body.classList.remove("is-loading");
}

const retryHeroPlayback = async () => {
  if (heroState !== "blocked" && heroState !== "loading") return;
  let started = false;

  if (blockedTarget === "transition") {
    pendingScrollTransition = false;
    setHeroState("loop");
    started = await startScrollTransition();
  } else if (blockedTarget === "loop") {
    setHeroState("intro");
    started = await startLoop();
  } else {
    started = await startIntro();
  }

  if (started) hideLoader();
  if (started && pendingScrollTransition && blockedTarget !== "transition") {
    pendingScrollTransition = false;
    startScrollTransition();
  }
};

document.addEventListener("WeixinJSBridgeReady", retryHeroPlayback, { once: true });
siteLoaderAction?.addEventListener("click", retryHeroPlayback);

if (window.WeixinJSBridge) {
  retryHeroPlayback();
}

window.addEventListener("pageshow", () => {
  if (window.scrollY < window.innerHeight * 0.1) {
    if (heroState === "loop") {
      playHeroVideo();
    } else if (heroState === "blocked") {
      retryHeroPlayback();
    }
  }
});

const updatePageState = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  header.classList.toggle("scrolled", window.scrollY > 20);

  const mid = window.innerHeight * 0.5;
  const current = sections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= mid && rect.bottom >= mid;
  });

  header.classList.toggle("on-dark", current?.classList.contains("is-dark") || current?.classList.contains("brand-block"));
  navLinks.forEach((link) => {
    const id = link.getAttribute("href");
    const currentNav = current?.dataset.nav || current?.id;
    link.classList.toggle("active", current && id === `#${currentNav}`);
  });
};

updatePageState();

const updateMotion = () => {
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const range = window.innerHeight + rect.height;
    const value = Math.max(-1, Math.min(1, (window.innerHeight - rect.top) / range - 0.5));
    section.style.setProperty("--parallax", value.toFixed(3));
  });

  if (hero) {
    const rect = hero.getBoundingClientRect();
    const scrollDistance = Math.max(1, window.innerHeight * 0.92);
    const heroProgress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
    const heroExit = Math.max(0, Math.min(1, (-rect.top - window.innerHeight * 0.78) / (window.innerHeight * 0.28)));
    const buildBg = Math.max(0, Math.min(1, (heroProgress - 0.86) / 0.14));
    hero.style.setProperty("--hero-scroll", heroProgress.toFixed(3));
    hero.style.setProperty("--hero-scroll-video", Math.max(0, Math.min(1, heroProgress * 1.18)).toFixed(3));
    hero.style.setProperty("--hero-exit", heroExit.toFixed(3));
    buildBlock?.style.setProperty("--build-bg", buildBg.toFixed(3));
    hero.classList.toggle("hero-scrolling", heroProgress > 0.025);

    if (
      heroProgress <= 0.015 &&
      (heroState === "content" || heroState === "transition")
    ) {
      startLoop({ force: true });
    }

    if (heroProgress > 0.025 && heroState !== "transition" && heroState !== "content") {
      if (heroState === "intro") {
        pendingScrollTransition = true;
      } else if (heroState === "loop") {
        startScrollTransition();
      }
    }

  }

  ticking = false;
};

const onScroll = () => {
  updatePageState();
  if (!ticking) {
    requestAnimationFrame(updateMotion);
    ticking = true;
  }
};

updateMotion();
window.addEventListener("scroll", onScroll, { passive: true });

menuButton.addEventListener("click", () => {
  const open = !nav.classList.contains("open");
  nav.classList.toggle("open", open);
  menuButton.classList.toggle("open", open);
  header.classList.toggle("menu-active", open);
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.classList.remove("open");
    header.classList.remove("menu-active");
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll(".reveal").forEach((node, index) => {
  node.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
  observer.observe(node);
});

const playerVideoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (!entry.isIntersecting || video.dataset.played === "true") return;

      video.dataset.played = "true";
      video.currentTime = 0;
      video.classList.add("is-playing");
      const play = video.play();
      if (play?.catch) play.catch(() => video.classList.add("is-ended"));
    });
  },
  { threshold: 0.45 }
);

document.querySelectorAll(".player-video").forEach((video) => {
  video.addEventListener("ended", () => {
    video.classList.remove("is-playing");
    video.classList.add("is-ended");
  });
  playerVideoObserver.observe(video);
});
