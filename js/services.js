export function initServicesSection(services = []) {
  const section = document.querySelector(".equipe-services.hs-section");
  if (!section || !Array.isArray(services) || !services.length) return;
  services = services.map((service) => ({
    ...service,
    image: service.image || service.imageUrl || "",
    prestations: service.prestations || service.benefits || [],
  }));
  const layer = section.querySelector(".hs-bubbles");
  const director = section.querySelector("#hs-director");
  const directorCard = director?.querySelector(".hs-director-card");
  const flowerWrap = section.querySelector(".hs-flower-wrap");
  const flower = section.querySelector(".hs-flower");
  const details = section.querySelector("#hs-details");
  let order = services.map((s) => s.id);
  let bubbleSwapTimer;
  let detailSwapTimer;
  let servicePhotosReady = false;

  function loadSelectedDetailImage(service) {
    const image = details.querySelector("img[data-service-image]");
    if (!image || !service) return;
    image.src = /^https:\/\//i.test(service.image)
      ? service.image
      : "resources/healthcare-services-assets/" + service.image;
    image.loading = "eager";
    image.fetchPriority = "high";
    image.removeAttribute("data-src");
  }

  function activateServiceImages() {
    if (servicePhotosReady) return;
    servicePhotosReady = true;
    layer.querySelectorAll("image[data-src]").forEach((image) => {
      image.setAttribute("href", image.dataset.src);
      image.removeAttribute("data-src");
    });
    loadSelectedDetailImage(services.find((service) => service.id === details.dataset.service));
  }

  if ("IntersectionObserver" in window) {
    const serviceImageObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        activateServiceImages();
        serviceImageObserver.disconnect();
      }
    }, { rootMargin: "240px 0px" });
    serviceImageObserver.observe(section);
  } else {
    activateServiceImages();
  }
  function syncBubbleAttachment() {
    if (!directorCard || !window.matchMedia("(min-width: 1024px)").matches) {
      flowerWrap.style.removeProperty("--hs-flower-attach-offset");
      return;
    }
    const mainBubblePath = layer.querySelector(
      "#bulle-" + order[0] + " .hs-bubble-pop > path:first-of-type",
    );
    if (!mainBubblePath) return;

    const currentOffset =
      parseFloat(
        flowerWrap.style.getPropertyValue(
          "--hs-flower-attach-offset",
        ),
      ) || 0;
    const gap =
      directorCard.getBoundingClientRect().right -
      mainBubblePath.getBoundingClientRect().left;
    flowerWrap.style.setProperty(
      "--hs-flower-attach-offset",
      currentOffset + gap + "px",
    );
  }
  const scheduleBubbleAttachment = () =>
    requestAnimationFrame(syncBubbleAttachment);
  window.addEventListener("resize", scheduleBubbleAttachment, {
    passive: true,
  });
  if ("ResizeObserver" in window) {
    const bubbleLayoutObserver = new ResizeObserver(
      scheduleBubbleAttachment,
    );
    if (directorCard) bubbleLayoutObserver.observe(directorCard);
    if (flower) bubbleLayoutObserver.observe(flower);
  }
  const syncDirectorHeight = () => {
    if (!director) return;
    director.style.setProperty(
      "--hs-details-height",
      details.offsetHeight + "px",
    );
  };
  syncDirectorHeight();
  if ("ResizeObserver" in window) {
    new ResizeObserver(syncDirectorHeight).observe(details);
  }
               const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const check =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  const clock =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
  function renderDetails(s, animate = false) {
    const update = () => {
      details.dataset.service = s.id;
      details.innerHTML =
      '<div class="hs-photo"><img data-service-image data-src="' +
      esc(/^https:\/\//i.test(s.image) ? s.image : "resources/healthcare-services-assets/" + s.image) +
      '" alt="' +
      esc(s.alt) +
      '" loading="lazy" decoding="async"><span class="hs-pill">' +
      esc(s.label) +
      "</span></div>" +
      '<header class="hs-service-heading"><p class="hs-tagline">' +
      esc(s.tagline) +
      "</p><h2>" +
      esc(s.label) +
      "</h2></header>" +
      '<p class="hs-copy">' +
      esc(s.intro) +
      '</p><p class="hs-copy hs-copy-muted">' +
      esc(s.details) +
      "</p>" +
      '<section class="hs-prestations" aria-labelledby="hs-prestations-heading"><h3 id="hs-prestations-heading">Nos prestations</h3><ul>' +
      s.prestations
        .map(
          (x) =>
            '<li><span class="hs-check">' +
            check +
            "</span>" +
            esc(x) +
            "</li>",
        )
        .join("") +
      "</ul></section>";
      if (servicePhotosReady) loadSelectedDetailImage(s);
      syncDirectorHeight();
    };

    if (!animate) {
      update();
      return;
    }
    details.classList.add("is-changing");
    window.clearTimeout(detailSwapTimer);
    detailSwapTimer = window.setTimeout(() => {
      update();
      requestAnimationFrame(() =>
        details.classList.remove("is-changing"),
      );
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320);
  }
  function renderBubbles() {
    const angles = [-62, -21, 21, 62],
      distance = 352,
      satelliteShift = 56,
      petal =
        "M -112 0 C -78 -30 -62 -92 6 -96 C 68 -99 112 -56 112 0 C 112 56 68 99 6 96 C -62 92 -78 30 -112 0 Z";
    const mainRadius = 308,
      mainCutX = -mainRadius * 0.4,
      mainCutY = Math.sqrt(mainRadius ** 2 - mainCutX ** 2),
      mainCurve =
        `M ${mainCutX} ${-mainCutY} A ${mainRadius} ${mainRadius} 0 1 1 ${mainCutX} ${mainCutY}`,
      mainFill = `${mainCurve} L ${mainCutX} ${-mainCutY} Z`;
    const existing = new Map(
      Array.from(layer.children, (node) => [node.id, node]),
    );

    order
      .slice(1)
      .concat(order[0])
      .forEach((id) => {
        const s = services.find((x) => x.id === id),
          slot = order.indexOf(id),
          main = slot === 0;
        const angle = main ? 0 : angles[slot - 1],
          rad = (angle * Math.PI) / 180;
        const x = main ? 0 : distance * Math.cos(rad) + satelliteShift,
          y = main ? 380 : 380 + distance * Math.sin(rad);
        const imageSrc = /^https:\/\//i.test(s.image)
          ? s.image
          : "resources/healthcare-services-assets/" + s.image;
        const imageSourceAttribute = servicePhotosReady ? "href" : "data-src";
        const clipId = "hs-flower-clip-" + s.id;
        // The SVG viewBox starts at x=0, so keep the main label in its visible area.
        const labelX = main ? 12 : 124;
        const labelY = main ? -110 : 5;
        const shape = main
          ? `<g class="hs-bubble-pop">
              <defs>
                <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">
                <path d="${mainFill}" />
                </clipPath>
              </defs>
              <image ${imageSourceAttribute}="${imageSrc}" x="${mainCutX}" y="${-mainCutY}" width="${mainRadius - mainCutX}" height="${mainCutY * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
              <path d="${mainFill}" fill="var(--hs-bubble-color)" fill-opacity=".32" />
              <path d="${mainCurve}" fill="none" stroke="#fff" stroke-width="4" />
              
            </g>`
          : `<g class="hs-bubble-pop">
              <defs>
                <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">
                  <path d="${petal}" transform="rotate(${angle})" />
                </clipPath>
              </defs>
              <image ${imageSourceAttribute}="${imageSrc}" x="-112" y="-99" width="224" height="198" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
              <path d="${petal}" transform="rotate(${angle})" fill="var(--hs-bubble-color)" fill-opacity=".32" stroke="#fff" stroke-width="4" />
            </g>`;

        let bubble = existing.get("bulle-" + s.id);
        if (!bubble) {
          bubble = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
          );
          bubble.id = "bulle-" + s.id;
          bubble.dataset.service = s.id;
          bubble.innerHTML =
            '<g class="hs-bubble-transform"><g class="hs-bubble-pop"></g></g>';
          // bubble.addEventListener("mouseenter", () => {
          //   if (bubble.getAttribute("aria-checked") !== "true") {
          //     layer.appendChild(bubble);
          //   }
          // });
          // bubble.addEventListener("mouseleave", () => {
          //   const selectedBubble = layer.querySelector(
          //     ':scope > g[aria-checked="true"]',
          //   );
          //   if (selectedBubble) layer.appendChild(selectedBubble);
          // });
          // bubble.addEventListener("focus", () => layer.appendChild(bubble));
          // bubble.addEventListener("blur", () => {
          //   const selectedBubble = layer.querySelector(
          //     ':scope > g[aria-checked="true"]',
          //   );
          //   if (selectedBubble) layer.appendChild(selectedBubble);
          // });
        }

        bubble.setAttribute("role", "radio");
        bubble.setAttribute("aria-checked", String(main));
        bubble.setAttribute("aria-label", s.label);
        bubble.setAttribute("tabindex", main ? "0" : "-1");

        const movingBubble = bubble.firstElementChild;
        movingBubble.innerHTML =
          shape +
          `<text class="hs-bubble-title${main ? " hs-bubble-title-main" : ""}" x="${labelX}" y="${labelY}" text-anchor="start">${esc(s.label)}</text>`;
        if (
          main &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          movingBubble.addEventListener(
            "transitionend",
            (event) => {
              if (
                event.target === movingBubble &&
                event.propertyName === "transform"
              ) {
                scheduleBubbleAttachment();
              }
            },
            { once: true },
          );
        }
        movingBubble.style.transform =
          "translate(" + x + "px, " + y + "px)";
        layer.appendChild(bubble);
      });
    scheduleBubbleAttachment();
  }
  function select(id) {
    const slot = order.indexOf(id);
    if (slot > 0) order.unshift(order.splice(slot, 1)[0]);
    const s = services.find((x) => x.id === order[0]);
    if (director) director.dataset.service = s.id;
    if (directorCard) directorCard.dataset.service = s.id;

    layer.classList.add("is-changing");
    window.clearTimeout(bubbleSwapTimer);
    bubbleSwapTimer = window.setTimeout(() => {
      renderBubbles();
      requestAnimationFrame(() =>
        layer.classList.remove("is-changing"),
      );
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150);
    renderDetails(s, true);
    details.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
  layer.addEventListener("click", (e) => {
    const b = e.target.closest('[role="radio"]');
    if (b) select(b.id.slice(6));
  });
  layer.addEventListener("keydown", (e) => {
    const b = e.target.closest('[role="radio"]');
    if (!b) return;
    const id = b.id.slice(6);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(id);
      section.querySelector("#bulle-" + id).focus();
      return;
    }
    const step =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (step) {
      e.preventDefault();
      section
        .querySelector(
          "#bulle-" +
            order[
              (order.indexOf(id) + step + order.length) %
                order.length
            ],
        )
        .focus();
    }
  });
  if (director) director.dataset.service = services[0].id;
  if (directorCard) directorCard.dataset.service = services[0].id;
  renderBubbles();
  renderDetails(services[0]);
  }




