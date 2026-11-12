const root = document.querySelector(".team-carousel");

if (root) {
  const viewport = root.querySelector(".team-carousel-viewport");
  const track = root.querySelector(".team-carousel-track");
  const thumbsList = root.querySelector(".team-carousel-thumbs");
  const previous = root.querySelector(".team-carousel-arrow--prev");
  const next = root.querySelector(".team-carousel-arrow--next");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let index = 0;
  let slides = [];
  let thumbs = [];
  let autoplayTimer;
  let pointerStartX = null;

  function showSlide(requestedIndex) {
    if (!slides.length) return;
    index = (requestedIndex + slides.length) % slides.length;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = slides[0].getBoundingClientRect().width + gap;
    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
    track.style.transform = `translateX(${-Math.min(index * step, maxOffset)}px)`;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    thumbs.forEach((thumb, thumbIndex) => {
      thumb.setAttribute("aria-current", String(thumbIndex === index));
    });
  }

  function stopAutoplay() {
    window.clearInterval(autoplayTimer);
  }

  function restartAutoplay() {
    stopAutoplay();
    if (!reduceMotion.matches && slides.length > 1) {
      autoplayTimer = window.setInterval(() => showSlide(index + 1), 5000);
    }
  }

  function refreshSlides() {
    slides = [...track.children];
    thumbsList.replaceChildren();
    thumbs = slides.map((slide, slideIndex) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const image = document.createElement("img");

      button.type = "button";
      button.className = "team-carousel-thumb";
      button.setAttribute("aria-label", `Afficher l’image ${slideIndex + 1}`);
      image.src = slide.querySelector("img").src;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      button.append(image);
      button.addEventListener("click", () => {
        showSlide(slideIndex);
        restartAutoplay();
      });
      item.append(button);
      thumbsList.append(item);
      return button;
    });

    previous.hidden = slides.length < 2;
    next.hidden = slides.length < 2;
    thumbsList.hidden = slides.length < 2;
    track.style.transform = "";
    index = 0;
    showSlide(index);
    restartAutoplay();
  }

  previous.addEventListener("click", () => {
    showSlide(index - 1);
    restartAutoplay();
  });
  next.addEventListener("click", () => {
    showSlide(index + 1);
    restartAutoplay();
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      showSlide(index - 1);
      restartAutoplay();
    } else if (event.key === "ArrowRight") {
      showSlide(index + 1);
      restartAutoplay();
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
  });
  viewport.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    if (Math.abs(distance) > 40) {
      showSlide(index + (distance < 0 ? 1 : -1));
      restartAutoplay();
    }
    pointerStartX = null;
  });
  viewport.addEventListener("pointercancel", () => {
    pointerStartX = null;
  });

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", restartAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) restartAutoplay();
  });
  window.addEventListener("resize", () => showSlide(index));
  reduceMotion.addEventListener?.("change", restartAutoplay);
  document.addEventListener("team-carousel:content-updated", refreshSlides);

  refreshSlides();
}
