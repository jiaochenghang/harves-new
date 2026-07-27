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
let heroStarted = false;
let scrollVideoStarted = false;

const playHeroVideo = async (video) => {
  if (!video) return false;
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
};

const showHeroLoop = () => {
  if (!hero || !heroLoopVideo) return;
  hero.classList.add("hero-looping");
  playHeroVideo(heroLoopVideo);
};

const startHero = async () => {
  if (heroStarted || !heroIntroVideo) return;
  heroStarted = true;
  heroIntroVideo.currentTime = 0;
  const started = await playHeroVideo(heroIntroVideo);
  if (!started) heroStarted = false;
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
    Promise.all([
      waitUntilPlayable(heroIntroVideo),
      waitUntilPlayable(heroLoopVideo),
      waitUntilPlayable(heroScrollVideo),
    ]),
    new Promise((resolve) => window.setTimeout(resolve, 12000)),
  ]);
  document.body.classList.remove("is-loading");
  await startHero();
};

if (heroIntroVideo && heroLoopVideo) {
  heroIntroVideo.addEventListener("ended", showHeroLoop);

  heroIntroVideo.addEventListener("error", () => {
    heroStarted = true;
    document.body.classList.remove("is-loading");
    showHeroLoop();
  });

  heroLoopVideo.addEventListener("error", () => {
    hero.classList.add("hero-looping");
  });

  finishLoading();
} else {
  document.body.classList.remove("is-loading");
}

if (heroScrollVideo) {
  heroScrollVideo.pause();
  heroScrollVideo.currentTime = 0;
  heroScrollVideo.addEventListener("ended", () => {
    hero?.classList.remove("hero-scroll-playing");
    hero?.classList.add("hero-scroll-ended");
  });
}

const retryHeroPlayback = () => {
  if (!heroStarted && window.scrollY < window.innerHeight * 0.1) startHero();
};

document.addEventListener("WeixinJSBridgeReady", retryHeroPlayback, { once: true });
document.addEventListener("touchstart", retryHeroPlayback, { once: true, passive: true });

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

    if (heroScrollVideo && heroProgress > 0.025 && !scrollVideoStarted) {
      scrollVideoStarted = true;
      hero.classList.add("hero-scroll-playing");
      heroScrollVideo.currentTime = 0;
      playHeroVideo(heroScrollVideo).then((started) => {
        if (!started) {
          scrollVideoStarted = false;
          hero.classList.remove("hero-scroll-playing");
        }
      });
    }

    if (heroLoopVideo) {
      if (heroProgress > 0.03) {
        heroLoopVideo.pause();
      } else if (hero.classList.contains("hero-looping")) {
        playHeroVideo(heroLoopVideo);
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
