const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".site-nav");
const progress = document.querySelector(".progress span");
const sections = [...document.querySelectorAll(".block")];
const navLinks = [...document.querySelectorAll(".site-nav a")];
const hero = document.querySelector(".hero-block");
const buildBlock = document.querySelector(".build-block");
const heroIntroVideo = document.querySelector(".hero-video-intro");
const heroLoopVideo = document.querySelector(".hero-video-loop");
const heroScrollVideo = document.querySelector(".hero-video-scroll");
let ticking = false;
let heroIntroFinished = false;
let scrollVideoReady = false;
let scrollVideoUnlocked = false;
let pendingScrollTime = 0;

const prepareVideo = (video) => {
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("x5-playsinline", "true");
};

[heroIntroVideo, heroLoopVideo, heroScrollVideo].forEach(prepareVideo);

const safePlay = (video) => {
  if (!video) return Promise.resolve(false);
  prepareVideo(video);
  try {
    const result = video.play();
    if (result && typeof result.then === "function") {
      return result.then(() => true).catch(() => false);
    }
    return Promise.resolve(true);
  } catch (_) {
    return Promise.resolve(false);
  }
};

const startHeroLoop = () => {
  if (!hero || !heroLoopVideo) return;
  heroIntroFinished = true;
  hero.classList.add("hero-looping");
  safePlay(heroLoopVideo);
};

const startHeroIntro = async () => {
  if (!heroIntroVideo || heroIntroFinished) return;
  const started = await safePlay(heroIntroVideo);
  if (!started) {
    // Keep the poster visible. WeChat will retry after bridge-ready or first touch.
    hero?.classList.add("hero-awaiting-play");
  } else {
    hero?.classList.remove("hero-awaiting-play");
  }
};

if (heroIntroVideo && heroLoopVideo) {
  heroIntroVideo.addEventListener("ended", startHeroLoop);
  heroIntroVideo.addEventListener("error", startHeroLoop);
  startHeroIntro();
}

const applyScrollVideoTime = (time) => {
  if (!heroScrollVideo || !scrollVideoReady) return;
  const duration = heroScrollVideo.duration;
  if (!Number.isFinite(duration) || duration <= 0) return;
  const target = Math.max(0, Math.min(duration - 0.04, time));
  if (Math.abs(heroScrollVideo.currentTime - target) > 0.045) {
    try {
      heroScrollVideo.currentTime = target;
    } catch (_) {
      // Some WeChat builds reject seeking until the video has been unlocked.
    }
  }
};

const unlockScrollVideo = async () => {
  if (!heroScrollVideo || scrollVideoUnlocked) return;
  prepareVideo(heroScrollVideo);
  const started = await safePlay(heroScrollVideo);
  if (started) {
    heroScrollVideo.pause();
    scrollVideoUnlocked = true;
    applyScrollVideoTime(pendingScrollTime);
  }
};

if (heroScrollVideo) {
  heroScrollVideo.addEventListener("loadedmetadata", () => {
    scrollVideoReady = true;
    applyScrollVideoTime(pendingScrollTime);
  });
  heroScrollVideo.addEventListener("canplay", () => {
    scrollVideoReady = true;
  });
  heroScrollVideo.pause();
}

const resumeHeroPlayback = () => {
  if (!heroIntroFinished) {
    startHeroIntro();
  } else if (heroLoopVideo && !hero?.classList.contains("hero-scrolling")) {
    safePlay(heroLoopVideo);
  }
  unlockScrollVideo();
};

document.addEventListener("WeixinJSBridgeReady", resumeHeroPlayback, false);
["touchstart", "pointerdown", "click"].forEach((eventName) => {
  document.addEventListener(eventName, resumeHeroPlayback, { passive: true, once: true });
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) resumeHeroPlayback();
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

    if (heroScrollVideo && Number.isFinite(heroScrollVideo.duration) && heroScrollVideo.duration > 0) {
      pendingScrollTime = heroScrollVideo.duration * heroProgress;
      applyScrollVideoTime(pendingScrollTime);
    }

    if (heroLoopVideo) {
      if (heroProgress > 0.03) {
        heroLoopVideo.pause();
      } else if (hero.classList.contains("hero-looping")) {
        safePlay(heroLoopVideo);
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
