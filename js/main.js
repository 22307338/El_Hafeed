import { initServicesSection } from "./services.js";

const videoContent = {
  mission: {
    title: "Une mission tournée vers l'humain",
    description:
      "Découvrez la genèse d'El-Hafeed et nos principes d'écoute gériatrique à domicile.",
  },
  services: {
    title: "Un accompagnement coordonné et personnalisé",
    description:
      "Focus sur nos cinq pôles de prise en charge clinique et bien-être.",
  },
  families: {
    title: "Accompagner aussi ceux qui accompagnent",
    description:
      "L'aide concrète apportée aux enfants et proches aidants face aux situations complexes.",
  },
  vision: {
    title: "Faire de la dignité des aînés une priorité",
    description:
      "Notre plaidoyer institutionnel et gérontologique pour le Maroc et le continent africain.",
  },
  salon: {
    title: "Salon International de la Santé",
    description:
      "Emplacement de démonstration : la vidéo verticale et les contenus définitifs seront ajoutés dès réception des médias du client.",
  },
};

const noticeMessages = {
  linkedin: "Le compte LinkedIn sera connecté très prochainement.",
  instagram: "Le compte Instagram sera connecté très prochainement.",
  facebook: "Le compte Facebook sera connecté très prochainement.",
  callback:
    "Formulaire de rappel direct : un coordinateur vous contactera sous 24h.",
  legal: "Document en cours d'actualisation notariale.",
  privacy: "Protection des données médicales conforme aux standards CNDP.",
};

let toastTimer;
const tooltipTimers = new WeakMap();

function openVideoModal(videoId) {
  const video = videoContent[videoId];
  const modal = document.getElementById("video-modal");
  if (!video || !modal) return;

  document.getElementById("video-modal-title").textContent = video.title;
  document.getElementById("video-modal-desc").textContent = video.description;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeVideoModal() {
  const modal = document.getElementById("video-modal");
  if (!modal) return;

  modal.classList.add("hidden");
  document.body.style.overflow = "";
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
  const target = event.target.closest(
    "[data-action], [data-video-trigger], [data-toast-trigger], [data-tooltip-trigger]",
  );
  if (!target) return;

  if (target.hasAttribute("data-video-trigger")) {
    openVideoModal(target.dataset.videoTrigger);
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
    case "modal-close":
      closeVideoModal();
      break;
    case "toast-close":
      document.getElementById("notice-toast")?.classList.add("hidden");
      break;
  }
});

document.addEventListener("keydown", (event) => {
  const videoTrigger = event.target.closest(
    '[data-video-trigger][role="button"]',
  );
  if (videoTrigger && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openVideoModal(videoTrigger.dataset.videoTrigger);
    return;
  }

  if (event.key === "Escape") {
    const modal = document.getElementById("video-modal");
    if (modal && !modal.classList.contains("hidden")) closeVideoModal();

    const drawer = document.getElementById("mobile-drawer");
    if (drawer && !drawer.classList.contains("hidden")) {
      drawer.classList.add("hidden");
      document
        .querySelector('[data-action="mobile-menu-toggle"]')
        ?.setAttribute("aria-expanded", "false");
    }
  }
});

document.getElementById("video-modal")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeVideoModal();
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
      if (current) current.textContent = String(activeIndex + 1);
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
initLegitimacyCarousels();
initServicesSection();

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener(
    "load",
    () => window.lucide?.createIcons(),
    { once: true },
  );
}
