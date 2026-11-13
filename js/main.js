import { sanityFetch, sanityImageUrl, applyPageMetadata } from "./sanity.js";

const HOME_PAGE_QUERY = `*[_id == "homePage"][0]{
  hero{title,description,supportingText,valuesTitle,values[]{title,description,icon},"desktopBackgroundUrl":desktopBackground.asset->url,"mobileBackgroundUrl":mobileBackground.asset->url,"brandSymbolUrl":brandSymbol.asset->url,brandSymbolAlt},
  legitimacy{eyebrow,title,intro,videoTitle,videoDescription,video{asset->{playbackId}},"videoPosterUrl":videoPoster.asset->url,videoPosterAlt,stories[]{title,description,photoAltTexts,"photos":photos[].asset->url}},
  approach{eyebrow,title,intro,steps[]{eyebrow,title,description,videoId,video{asset->{playbackId}},"coverUrl":cover.asset->url,coverAlt}},
  closing{eyebrow,title,intro,founderName,founderRole,message,values[],founderPortraitAlt,"portraitUrl":founderPortrait.asset->url},metaTitle,metaDescription,"ogImageUrl":ogImage.asset->url
}`;
let muxPlayerLoadPromise;
let activeInlineVideo = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function homepageImageUrl(value, width = 1600, height) {
  if (!value) return "";
  if (/^https:\/\/cdn\.sanity\.io\//i.test(value)) return sanityImageUrl(value, {width, height, fit: height ? "crop" : "max"});
  if (/^(\.\/)?resources\/[\w./-]+$/i.test(value)) return new URL(value, document.baseURI).href;
  return "";
}

function setImage(image, value, alt, {priority = false, width = 1200, height} = {}) {
  const src = homepageImageUrl(value, width, height);
  if (!image || !src) return;
  image.src = src;
  image.loading = priority ? "eager" : "lazy";
  if (priority) image.fetchPriority = "high";
  image.decoding = "async";
  if (alt !== undefined) image.alt = alt;
}

function setBackgroundImage(element, property, value) {
  const src = homepageImageUrl(value, 1920);
  if (!element || !src) return;
  element.style.setProperty(property, `url("${src.replaceAll('"', "%22")}")`);
}

function renderHomepageStories(stories = []) {
  const container = document.querySelector(".legitimacy-stories");
  if (!container || !Array.isArray(stories)) return;
  container.innerHTML = stories.map((story) => {
    const photos = (story.photos || []).map((photo) => homepageImageUrl(photo, 960)).filter(Boolean);
    const slides = photos.map((src, index) => `
      <figure class="legitimacy-carousel-slide${index === 0 ? " is-active" : ""}"${index ? ' hidden aria-hidden="true"' : ' aria-hidden="false"'}>
        <img src="${escapeHtml(src)}" alt="${escapeHtml(story.photoAltTexts?.[index] || story.title || "Rencontre professionnelle El-Hafeed")}" loading="lazy" decoding="async">
      </figure>`).join("");
    const carousel = `
      <div class="legitimacy-carousel" role="group" aria-roledescription="carrousel" aria-label="Photos : ${escapeHtml(story.title || "rencontre professionnelle")}">
        <div class="legitimacy-carousel-slides">${slides}</div>
        ${photos.length > 1 ? `<div class="legitimacy-carousel-controls">
          <button class="legitimacy-carousel-arrow" type="button" data-carousel-direction="-1" aria-label="Photo précédente"><i data-lucide="arrow-left" class="site-icon" aria-hidden="true"></i></button>
          <span class="legitimacy-carousel-counter" data-carousel-index aria-live="polite">1/${photos.length}</span>
          <button class="legitimacy-carousel-arrow" type="button" data-carousel-direction="1" aria-label="Photo suivante"><i data-lucide="arrow-right" class="site-icon" aria-hidden="true"></i></button>
        </div>` : ""}
      </div>`;
    return `<article class="legitimacy-story${photos.length < 2 ? " legitimacy-story-single" : ""}"${photos.length > 1 ? " data-legitimacy-carousel" : ""}>${carousel}
      <div class="legitimacy-story-copy"><span>${escapeHtml(story.title || "")}</span><p>${escapeHtml(story.description || "")}</p></div>
    </article>`;
  }).join("");
}

function updateApproachSteps(steps = []) {
  const list = document.querySelector("#decouvrez .space-y-space-lg");
  if (!list || !Array.isArray(steps)) return;
  const templates = Array.from(list.children);
  while (list.children.length < steps.length) {
    const index = list.children.length;
    list.append(templates[index % templates.length].cloneNode(true));
  }
  Array.from(list.children).forEach((row, index) => {
    const step = steps[index];
    row.hidden = !step;
    if (!step) return;
    const videoTrigger = row.querySelector("[data-video-trigger]");
    const cover = videoTrigger?.querySelector("img");
    const videoId = step.videoId || `approach-${index + 1}`;
    if (videoTrigger) {
      videoTrigger.dataset.videoTrigger = videoId;
      videoTrigger.dataset.videoContainer = videoId;
      videoTrigger.setAttribute("aria-label", `Visionner : ${step.title || "Capsule El-Hafeed"}`);
    }
    setImage(cover, step.coverUrl || step.cover, step.coverAlt || step.title || "Capsule El-Hafeed");
    const videoLabel = videoTrigger?.querySelector(".absolute.bottom-3");
    if (videoLabel) videoLabel.textContent = step.eyebrow || `Capsule ${String(index + 1).padStart(2, "0")}`;
    const copy = row.querySelector(".md\\:col-span-7");
    const heading = copy?.querySelector("span.font-label-sm");
    const title = copy?.querySelector("h3");
    const description = copy?.querySelector("p");
    if (heading) heading.textContent = step.eyebrow || "";
    if (title) title.textContent = step.title || "";
    if (description) description.textContent = step.description || "";
    videoContent[videoId] = {
      title: step.title || "El-Hafeed",
      description: step.description || "",
      playbackId: step.video?.asset?.playbackId || "",
    };
  });
}

async function loadHomepageContent() {
  let data;
  try {
    data = await sanityFetch(HOME_PAGE_QUERY);
  } catch (error) {
    console.warn("Using the local homepage copy while Sanity is unavailable.", error);
  }
  if (!data) {
    try {
      const response = await fetch("./content/home-page.json");
      if (response.ok) data = await response.json();
    } catch (error) {
      console.error("Unable to load local homepage content.", error);
    }
  }
  if (!data) return;

  const hero = data.hero || {};
  const heroSection = document.querySelector(".hero-section");
  setBackgroundImage(heroSection, "--hero-image-desktop", hero.desktopBackgroundUrl || hero.desktopBackground);
  setBackgroundImage(heroSection, "--hero-image-mobile", hero.mobileBackgroundUrl || hero.mobileBackground);
  const heroTitle = document.querySelector(".hero-title");
  const heroDescription = document.querySelector(".hero-description");
  if (heroTitle && hero.title) heroTitle.textContent = hero.title;
  if (heroDescription) heroDescription.textContent = [hero.description, hero.supportingText].filter(Boolean).join("\n");
  setImage(document.querySelector(".hero-brand-symbol img"), hero.brandSymbolUrl || hero.brandSymbol, hero.brandSymbolAlt || "Symbole El-Hafeed", {priority: true});
  const valuesTitle = document.querySelector("#hero-values-title");
  if (valuesTitle && hero.valuesTitle) valuesTitle.textContent = hero.valuesTitle;
  const valueCards = Array.from(document.querySelectorAll(".hero-value-card"));
  if (Array.isArray(hero.values) && hero.values.length) {
    const templates = valueCards.slice();
    while (valueCards.length < hero.values.length && templates.length) {
      const card = templates[valueCards.length % templates.length].cloneNode(true);
      templates[0].parentElement.append(card);
      valueCards.push(card);
    }
    hero.values.forEach((value, index) => {
      const card = valueCards[index];
      if (!card) return;
      card.hidden = false;
      const title = card.querySelector(".hero-value-title");
      const description = card.querySelector(".hero-value-description");
      const icon = card.querySelector(".hero-value-icon [data-lucide]");
      if (title) title.textContent = value.title || "";
      if (description) description.textContent = value.description || "";
      if (icon && value.icon) icon.dataset.lucide = value.icon;
    });
    valueCards.slice(hero.values.length).forEach((card) => card.hidden = true);
  }

  const legitimacy = data.legitimacy || {};
  const legitimacyHeading = document.querySelector(".legitimacy-heading");
  if (legitimacyHeading) {
    const eyebrow = legitimacyHeading.querySelector(".legitimacy-eyebrow");
    const title = legitimacyHeading.querySelector("h2");
    const intro = legitimacyHeading.querySelector("p:last-child");
    if (eyebrow) eyebrow.textContent = legitimacy.eyebrow || "";
    if (title) title.textContent = legitimacy.title || "";
    if (intro) intro.textContent = legitimacy.intro || "";
  }
  const videoImage = document.querySelector(".legitimacy-video-frame img");
  setImage(videoImage, legitimacy.videoPosterUrl || legitimacy.videoPoster, legitimacy.videoPosterAlt || legitimacy.videoTitle || "Présentation El-Hafeed", {width: 1200});
  const videoCopy = document.querySelector(".legitimacy-video-copy");
  if (videoCopy) {
    const [kicker, title, description] = [videoCopy.querySelector(".legitimacy-kicker"), videoCopy.querySelector("h3"), videoCopy.querySelector("p:last-child")];
    if (kicker) kicker.textContent = legitimacy.eyebrow || "Notre approche";
    if (title) title.textContent = legitimacy.videoTitle || "";
    if (description) description.textContent = legitimacy.videoDescription || "";
  }
  const legitimacyButton = document.querySelector('.legitimacy-video-frame [data-video-trigger="salon"]');
  if (legitimacyButton) legitimacyButton.setAttribute("aria-label", legitimacy.videoTitle || "Voir la présentation El-Hafeed");
  videoContent.salon = {
    title: legitimacy.videoTitle || "El-Hafeed",
    description: legitimacy.videoDescription || "",
    playbackId: legitimacy.video?.asset?.playbackId || "",
  };
  renderHomepageStories(legitimacy.stories || []);

  const approach = data.approach || {};
  const approachHeading = document.querySelector("#decouvrez .text-center.max-w-3xl");
  if (approachHeading) {
    const eyebrow = approachHeading.querySelector(".inline-flex");
    const title = approachHeading.querySelector("h2");
    const intro = approachHeading.querySelector("p");
    if (eyebrow) {
      const icon = eyebrow.querySelector("i,svg");
      eyebrow.textContent = approach.eyebrow || "";
      if (icon) eyebrow.prepend(icon);
    }
    if (title) title.textContent = approach.title || "";
    if (intro) intro.textContent = approach.intro || "";
  }
  updateApproachSteps(approach.steps || []);

  const closing = data.closing || {};
  const founderSection = document.querySelector(".founder-engagement");
  if (founderSection) {
    const eyebrow = founderSection.querySelector(".founder-engagement-eyebrow");
    const title = founderSection.querySelector(".founder-engagement-title");
    const intro = founderSection.querySelector(".founder-engagement-intro");
    const message = founderSection.querySelector(".founder-message-text");
    const placeholderLabel = founderSection.querySelector(".founder-message-placeholder-label");
    const portrait = founderSection.querySelector(".founder-portrait-image");

    if (eyebrow && closing.eyebrow) eyebrow.textContent = closing.eyebrow;
    if (title && closing.title) title.textContent = closing.title;
    if (intro && closing.intro) intro.textContent = closing.intro;
    if (message && closing.message) {
      message.textContent = "« " + closing.message + " »";
      if (placeholderLabel) placeholderLabel.hidden = !closing.message.trim().startsWith("[");
    }
    if (portrait) {
      setImage(
        portrait,
        closing.portraitUrl || closing.founderPortrait,
        closing.founderPortraitAlt || "Portrait de " + (closing.founderName || "la fondatrice d’El-Hafeed"),
        {width: 900},
      );
    }

    if (closing.founderName) {
      founderSection.querySelectorAll(".founder-name").forEach((name) => {
        name.textContent = closing.founderName;
      });
      if (portrait && !closing.founderPortraitAlt) portrait.alt = "Portrait de " + closing.founderName + ", fondatrice et directrice d’El-Hafeed";
    }
    if (closing.founderRole) {
      founderSection.querySelectorAll(".founder-role").forEach((role) => {
        role.textContent = closing.founderRole;
      });
    }

    const valueItems = Array.from(founderSection.querySelectorAll(".founder-value-label"));
    if (Array.isArray(closing.values) && closing.values.length) {
      valueItems.forEach((item, index) => {
        const listItem = item.closest("li");
        if (closing.values[index]) {
          item.textContent = closing.values[index];
          if (listItem) listItem.hidden = false;
        } else if (listItem) {
          listItem.hidden = true;
        }
      });
    }
  }
  applyPageMetadata({title: data.metaTitle, description: data.metaDescription, image: data.ogImageUrl || data.ogImage});
  window.lucide?.createIcons();
}

const videoContent = {
  mission: {
    title: "Le Projet d’Accompagnement à Domicile",
    description:
      "Une évaluation prend en compte l’histoire, les habitudes, la mobilité, l’autonomie et les besoins de la personne.",
  },
  services: {
    title: "Un accompagnement coordonné et personnalisé",
    description:
      "Les interventions s’organisent selon le projet de la personne et les besoins évalués, en lien avec les proches et les professionnels concernés.",
  },
  families: {
    title: "Une place pour les proches",
    description:
      "La coordination et la psychologue offrent aux familles un espace d’échange face aux bouleversements et à l’épuisement.",
  },
  vision: {
    title: "Préserver les repères et les capacités",
    description:
      "L’accompagnement respecte les choix, le rythme, l’histoire et l’autonomie résiduelle de chaque personne.",
  },
  salon: {
    title: "Notre approche de l’accompagnement à domicile",
    description:
      "El-Hafeed construit un accompagnement personnalisé avec la personne, ses proches et les professionnels concernés.",
  },
};

const noticeMessages = {
  linkedin: "Le compte LinkedIn sera connecté très prochainement.",
  instagram: "Le compte Instagram sera connecté très prochainement.",
  facebook: "Le compte Facebook sera connecté très prochainement.",
  callback:
    "Pour organiser un échange, contactez directement l’équipe El-Hafeed.",
  legal: "Les informations légales seront communiquées par El-Hafeed.",
  privacy: "Les informations confiées à l’équipe sont traitées avec confidentialité.",
};

let toastTimer;
const tooltipTimers = new WeakMap();
let inlineVideoVolume = 0.9;

function ensureMuxPlayerLoaded() {
  if (customElements.get("mux-player")) return Promise.resolve();
  if (muxPlayerLoadPromise) return muxPlayerLoadPromise;

  muxPlayerLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mux/mux-player@3.14.1/dist/mux-player.min.js";
    script.async = true;
    script.onload = () => customElements.whenDefined("mux-player").then(resolve, reject);
    script.onerror = () => {
      muxPlayerLoadPromise = null;
      reject(new Error("Unable to load the Mux Player component."));
    };
    document.head.append(script);
  });

  return muxPlayerLoadPromise;
}

// Load the custom element before a visitor clicks so playback can start synchronously
// inside the click handler and retain the browser's user-activation permission.
ensureMuxPlayerLoaded().catch((error) => {
  console.error("Unable to load the Mux Player component.", error);
});

function restoreActiveInlineVideo() {
  const active = activeInlineVideo;
  if (!active) return;
  const player = active.container.querySelector("mux-player");
  if (player && !player.muted && Number.isFinite(player.volume)) {
    inlineVideoVolume = player.volume;
  }
  activeInlineVideo = null;

  active.container.removeAttribute("data-inline-video-active");
  active.container.style.aspectRatio = active.inlineAspectRatio;
  active.attributes.forEach(([name, value]) => {
    if (value === null) active.container.removeAttribute(name);
    else active.container.setAttribute(name, value);
  });
  active.container.replaceChildren(...active.children);
}

function playInlineVideo(videoId) {
  const video = videoContent[videoId];
  const container = Array.from(document.querySelectorAll("[data-video-container]"))
    .find((element) => element.dataset.videoContainer === videoId);
  if (!video?.playbackId || !container) {
    console.warn(`No Mux playback ID is configured for "${videoId}".`);
    return;
  }
  if (activeInlineVideo?.container === container) return;
  restoreActiveInlineVideo();
  if (!customElements.get("mux-player")) {
    console.warn("Mux Player is still loading; the video can be opened once it is ready.");
    return;
  }

  const thumbnailFrame = container.querySelector(".aspect-video");
  const ratioSource = thumbnailFrame || container;
  const computedRatio = getComputedStyle(ratioSource).aspectRatio;
  const rect = container.getBoundingClientRect();
  const inlineAspectRatio = container.style.aspectRatio;
  const attributes = ["data-video-trigger", "role", "tabindex", "aria-haspopup", "aria-controls"]
    .map((name) => [name, container.getAttribute(name)]);
  const active = {
    videoId,
    container,
    children: Array.from(container.childNodes),
    attributes,
    inlineAspectRatio,
  };
  activeInlineVideo = active;
  container.setAttribute("data-inline-video-active", "");
  container.style.aspectRatio = computedRatio && computedRatio !== "auto"
    ? computedRatio
    : `${rect.width} / ${rect.height}`;
  attributes.forEach(([name]) => container.removeAttribute(name));

  const player = document.createElement("mux-player");
  player.setAttribute("playsinline", "");
  player.setAttribute("controls", "");
  player.setAttribute("autoplay", "");
  player.setAttribute("disable-tracking", "");
  player.style.setProperty("--cast-button", "none");
  // Configure preferences and volume before playback-id initializes the asset.
  player.setAttribute("no-volume-pref", "");
  player.setAttribute("no-muted-pref", "");
  player.setAttribute("volume", String(inlineVideoVolume));
  player.setAttribute("title", video.title || "Vidéo El-Hafeed");
  player.muted = false;
  player.volume = inlineVideoVolume;
  player.addEventListener("volumechange", () => {
    if (!player.muted && Number.isFinite(player.volume)) {
      inlineVideoVolume = player.volume;
    }
  });
  player.setAttribute("playback-id", video.playbackId);
  container.replaceChildren(player);
  player.removeAttribute("muted");
  player.muted = false;
  player.volume = inlineVideoVolume;

  // Mux's autoplay waits for its media source to initialize. A second, immediate
  // player.play() races that load and can reject with AbortError.
}

function showNoticeToast(message) {
  const toast = document.getElementById("notice-toast");
  const text = document.getElementById("notice-toast-text");
  if (!toast || !text) return;

  text.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.add("hidden"), 4000);
}

function toggleTooltip(button) {
  const tooltip = button.nextElementSibling;
  if (!tooltip) return;

  const willOpen = tooltip.classList.contains("hidden");
  tooltip.classList.toggle("hidden", !willOpen);
  button.setAttribute("aria-expanded", String(willOpen));
  window.clearTimeout(tooltipTimers.get(button));

  if (willOpen) {
    tooltipTimers.set(
      button,
      window.setTimeout(() => {
        tooltip.classList.add("hidden");
        button.setAttribute("aria-expanded", "false");
      }, 2500),
    );
  }
}

document.addEventListener("click", (event) => {
  const eventElement = event.target instanceof Element
    ? event.target
    : event.target instanceof Node ? event.target.parentElement : null;
  const target = eventElement?.closest(
    "[data-action], [data-video-trigger], [data-toast-trigger], [data-tooltip-trigger]",
  );
  const triggeredVideoId = target?.dataset.videoTrigger;
  const clickedInsideActiveVideo = activeInlineVideo?.container.contains(eventElement);
  if (activeInlineVideo && !clickedInsideActiveVideo && triggeredVideoId !== activeInlineVideo.videoId) {
    restoreActiveInlineVideo();
  }
  if (!target) return;

  if (target.hasAttribute("data-video-trigger")) {
    if (activeInlineVideo?.videoId !== target.dataset.videoTrigger) {
      playInlineVideo(target.dataset.videoTrigger);
    }
    return;
  }

  if (target.hasAttribute("data-toast-trigger")) {
    if (target instanceof HTMLAnchorElement) event.preventDefault();
    showNoticeToast(noticeMessages[target.dataset.toastTrigger]);
    return;
  }

  if (target.hasAttribute("data-tooltip-trigger")) {
    toggleTooltip(target);
    return;
  }

  switch (target.dataset.action) {
    case "mobile-menu-toggle": {
      const drawer = document.getElementById("mobile-drawer");
      const willOpen = drawer?.classList.contains("hidden");
      drawer?.classList.toggle("hidden", !willOpen);
      target.setAttribute("aria-expanded", String(Boolean(willOpen)));
      break;
    }
    case "mobile-menu-close": {
      document.getElementById("mobile-drawer")?.classList.add("hidden");
      document
        .querySelector('[data-action="mobile-menu-toggle"]')
        ?.setAttribute("aria-expanded", "false");
      break;
    }
    case "toast-close":
      document.getElementById("notice-toast")?.classList.add("hidden");
      break;
  }
});

document.addEventListener("keydown", (event) => {
  const videoTrigger = event.target instanceof Element ? event.target.closest(
    '[data-video-trigger][role="button"]',
  ) : null;
  if (videoTrigger && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    playInlineVideo(videoTrigger.dataset.videoTrigger);
    return;
  }

  if (event.key === "Escape") {
    if (activeInlineVideo) {
      event.preventDefault();
      restoreActiveInlineVideo();
    }

    const drawer = document.getElementById("mobile-drawer");
    if (drawer && !drawer.classList.contains("hidden")) {
      drawer.classList.add("hidden");
      document
        .querySelector('[data-action="mobile-menu-toggle"]')
        ?.setAttribute("aria-expanded", "false");
    }
  }
});

function initLegitimacyCarousels() {
  document.querySelectorAll("[data-legitimacy-carousel]").forEach((carousel) => {
    const slides = Array.from(
      carousel.querySelectorAll(".legitimacy-carousel-slide"),
    );
    if (slides.length < 2) return;

    const current = carousel.querySelector("[data-carousel-index]");
    const slideFrame = carousel.querySelector(".legitimacy-carousel-slides");
    let activeIndex = 0;

    const showSlide = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.hidden = false;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });
      if (current) current.textContent = `${activeIndex + 1}/${slides.length}`;
    };

    carousel.querySelectorAll("[data-carousel-direction]").forEach((button) => {
      button.addEventListener("click", () => {
        showSlide(activeIndex + Number(button.dataset.carouselDirection));
      });
    });

    let touchStartX = null;
    slideFrame?.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
    }, { passive: true });
    slideFrame?.addEventListener("touchend", (event) => {
      if (touchStartX === null) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(deltaX) > 40) showSlide(activeIndex + (deltaX < 0 ? 1 : -1));
    }, { passive: true });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    showSlide(0);
  });
}
loadHomepageContent().catch((error) => {
  console.error("Unable to apply homepage content.", error);
}).finally(() => {
  initLegitimacyCarousels();
  window.lucide?.createIcons();
});

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener(
    "load",
    () => window.lucide?.createIcons(),
    { once: true },
  );
}
