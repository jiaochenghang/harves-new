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

const playHeroVideo = (video) => {
  if (!video) return;
  const play = video.play();
  if (play?.catch) {
    play.catch(() => {
      if (video === heroIntroVideo && hero && heroLoopVideo) {
        hero.classList.add("hero-looping");
        playHeroVideo(heroLoopVideo);
      }
    });
  }
};

if (heroIntroVideo && heroLoopVideo) {
  heroIntroVideo.addEventListener("ended", () => {
    hero.classList.add("hero-looping");
    playHeroVideo(heroLoopVideo);
  });

  heroIntroVideo.addEventListener("error", () => {
    hero.classList.add("hero-looping");
    playHeroVideo(heroLoopVideo);
  });

  playHeroVideo(heroIntroVideo);
}

if (heroScrollVideo) {
  heroScrollVideo.pause();
  heroScrollVideo.currentTime = 0;
}

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
      const targetTime = Math.min(heroScrollVideo.duration - 0.04, heroScrollVideo.duration * heroProgress);
      if (Math.abs(heroScrollVideo.currentTime - targetTime) > 0.045) {
        heroScrollVideo.currentTime = targetTime;
      }
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

// Language switcher
const langToggle = document.querySelector("[data-lang-toggle]");
const i18n = {
  en: {
    title: "Harves Entertainment",
    nav: ["Home", "Brand", "Athlete", "Mall", "About Us"],
    toggle: "中文",
    heroTitle: "The<br />Future<br />Plays Here",
    heroCopy: "Connecting Global Sports and Entertainment with the Next Generation.",
    buildTitle: "What We Build",
    buildCards: ["IP Partner", "Player Agency", "HAI Park Mall"],
    brandTitle: "IP Partner of Manchester United, Burnley &amp; Real Madrid",
    locationLabel: "Project Location",
    theatre: "THEATRE OF DREAMS",
    brandLocations: [
      "Beijingfun, Qianmen &middot; Beijing",
      "Universal Beijing Resort &middot; Beijing",
      "Chengdu &middot; China",
      "Shenyang Pop-ups &middot; China",
      "Shenzhen Pop-ups &middot; China"
    ],
    brandCaptions: [
      ["Brand Portfolio", "Logo wall, trend-led products, sports lifestyle apparel, and hero merchandise for existing fan communities."],
      ["Retail Excellence", "Standardized store models, fast replication, pop-ups, mall formats, and event-ready offline retail systems."],
      ["E-commerce &amp; Operations", "Full-channel e-commerce operations, TP partner execution, content conversion, and official store management."]
    ],
    athleteTitle: "Player Agency",
    athleteCopy: "From Sporting Talent to Commercial Power. We provide full-cycle athlete management across contracts, commercial sponsorship, brand endorsement, China tours, Asia-Pacific projects, and long-term rights development.",
    roster: [
      "Jiaming Zhang <span>China U19 National Team Forward | Burnley U21 Player</span>",
      "Bin XU <span>China U23 National Team Captain | Wolves Player</span>",
      "TBD"
    ],
    mini: [
      ["Elite Player", "Pitch performance, media visibility, and sponsor-ready commercial positioning."],
      ["Trial Pathway", "Club-facing evaluation, overseas training windows, and structured recommendation opportunities."]
    ],
    spacesTitle: "Sports & Entertainment Mall",
    spacesHeading: "Sports, Retail, Food, Entertainment.",
    spacesCopy: "All in One Destination. Our model is asset-light: combine sports IP, legacy retail resources, premium operators, food and beverage partners, and cultural tourism platforms to build landmark sports entertainment spaces.",
    haiPark: "HAI PARK",
    haiAddress: "No. 168 Harbin Road, Shenhe District &middot; Shenyang",
    managementTitle: "Management",
    people: [
      ["Bo Zhang", "A Dude.", "Founder"],
      ["Cun Liu", "| Vice Chairman", "Strategy, coordination and key decisions."],
      ["Yebo Sun", "| HAI Mall Managing Director", "Project delivery, operations and execution."],
      ["Jing Sun", "| Head of Brands", "Emotionally loyal to football, professionally loyal to the P&amp;L."],
      ["Han Song", "| Head of Athlete Management", "Flying between clubs, players, sponsors and projects, making sure everyone eventually says yes."]
    ],
    footerTitle: "Build the next sports destination.",
    footerCopy: "Brand Operation / Licensed Products / Retail / Talent / Sponsorship / Mall",
    footerCities: "Hong Kong / Beijing / Shanghai"
  },
  zh: {
    title: "哈维斯娱乐",
    nav: ["首页", "品牌合作", "球员经纪", "商业空间", "关于我们"],
    toggle: "EN",
    heroTitle: "未来<br />在此<br />开场",
    heroCopy: "连接全球体育娱乐资源与下一代消费人群。",
    buildTitle: "我们构建什么",
    buildCards: ["IP 合作伙伴", "球员经纪", "HAI Park 商业综合体"],
    brandTitle: "曼联、伯恩利与皇家马德里 IP 合作伙伴",
    locationLabel: "项目地点",
    theatre: "梦剧场",
    brandLocations: [
      "北京坊，前门 &middot; 北京",
      "北京环球度假区 &middot; 北京",
      "成都 &middot; 中国",
      "沈阳快闪 &middot; 中国",
      "深圳快闪 &middot; 中国"
    ],
    brandCaptions: [
      ["品牌矩阵", "围绕成熟球迷社群，打造标识墙、趋势产品、运动生活服饰与核心周边商品。"],
      ["零售执行", "标准化门店模型、快速复制、快闪店、商场业态与适配活动场景的线下零售系统。"],
      ["电商与运营", "全渠道电商运营、TP 合作执行、内容转化与官方店铺管理。"]
    ],
    athleteTitle: "球员经纪",
    athleteCopy: "从竞技天赋到商业价值。我们提供覆盖合同、商业赞助、品牌代言、中国行、亚太项目与长期权益开发的全周期球员管理服务。",
    roster: [
      "张家铭 <span>中国 U19 国家队前锋 | 伯恩利 U21 球员</span>",
      "徐彬 <span>中国 U23 国家队队长 | 狼队球员</span>",
      "待定"
    ],
    mini: [
      ["精英球员", "竞技表现、媒体曝光与可商业化的赞助定位。"],
      ["试训通道", "面向俱乐部的评估、海外训练窗口与结构化推荐机会。"]
    ],
    spacesTitle: "体育娱乐商业综合体",
    spacesHeading: "体育、零售、餐饮、娱乐。",
    spacesCopy: "一站式目的地。我们采用轻资产模型，整合体育 IP、存量商业资源、优质运营方、餐饮伙伴与文旅平台，打造城市地标级体育娱乐空间。",
    haiPark: "HAI PARK",
    haiAddress: "沈阳市沈河区哈尔滨路 168 号",
    managementTitle: "管理团队",
    people: [
      ["张博", "创始人", "Founder"],
      ["刘存", "| 副董事长", "负责战略、协调与关键决策。"],
      ["孙业博", "| HAI Mall 董事总经理", "负责项目交付、运营与执行。"],
      ["孙婧", "| 品牌负责人", "热爱足球，也重视生意结果。"],
      ["宋涵", "| 球员管理负责人", "往返于俱乐部、球员、赞助商与项目之间，推动合作落地。"]
    ],
    footerTitle: "共建下一代体育目的地。",
    footerCopy: "品牌运营 / 授权产品 / 零售 / 人才 / 赞助 / 商业综合体",
    footerCities: "香港 / 北京 / 上海"
  }
};

const setHTML = (selector, value) => {
  const node = document.querySelector(selector);
  if (node) node.innerHTML = value;
};

const setText = (selector, value) => {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
};

const setList = (selector, values) => {
  document.querySelectorAll(selector).forEach((node, index) => {
    if (values[index] != null) node.innerHTML = values[index];
  });
};

const setArticles = (selector, values) => {
  document.querySelectorAll(selector).forEach((article, index) => {
    const item = values[index];
    if (!item) return;
    const heading = article.querySelector("h3, strong");
    const paragraph = article.querySelector("p");
    const role = article.querySelector("span");
    if (heading) heading.innerHTML = item[0];
    if (role && item.length === 3) role.innerHTML = item[1];
    if (paragraph) paragraph.innerHTML = item[item.length === 3 ? 2 : 1];
  });
};

const applyLanguage = (lang) => {
  const copy = i18n[lang] || i18n.en;
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.body.classList.toggle("lang-zh", lang === "zh");
  document.title = copy.title;

  setList(".site-nav a", copy.nav);
  if (langToggle) {
    langToggle.textContent = copy.toggle;
    langToggle.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
  }

  setHTML(".hero-copy h1", copy.heroTitle);
  setText(".hero-copy p", copy.heroCopy);
  setText(".build-title h2", copy.buildTitle);
  setList(".build-cards figcaption", copy.buildCards);
  setHTML(".brand-heading h2", copy.brandTitle);
  setList(".project-location span", [copy.locationLabel, copy.locationLabel]);
  setText(".project-location-on-red strong", copy.theatre);
  setList(".project-location-on-red li", copy.brandLocations);
  setArticles(".brand-captions article", copy.brandCaptions);
  setText(".athlete-copy h2", copy.athleteTitle);
  setText(".athlete-copy p", copy.athleteCopy);
  setList(".athlete-roster figcaption", copy.roster);
  setArticles(".mini-grid article", copy.mini);
  setHTML(".spaces-title h2", copy.spacesTitle);
  setText(".spaces-copy h3", copy.spacesHeading);
  setText(".spaces-copy > p", copy.spacesCopy);
  setText(".project-location-dark strong", copy.haiPark);
  setHTML(".project-location-dark li", copy.haiAddress);
  setText(".management-inner h2", copy.managementTitle);
  setArticles(".people-list article", copy.people);
  setText(".footer-inner h2", copy.footerTitle);
  setText(".footer-inner p", copy.footerCopy);
  setText(".footer-inner small", copy.footerCities);

  localStorage.setItem("harves-language", lang);
  updatePageState();
};

const savedLanguage = localStorage.getItem("harves-language") || "en";
applyLanguage(savedLanguage);

langToggle?.addEventListener("click", () => {
  const next = document.documentElement.lang === "zh-CN" ? "en" : "zh";
  applyLanguage(next);
});