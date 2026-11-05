const PARTIALS = {
  header: new URL("../partials/header.html", import.meta.url),
  footer: new URL("../partials/footer.html", import.meta.url),
};

const ROUTES = {
  home: "index.html",
  team: "notre-equipe.html",
  articles: "articles.html",
  faq: "questions_reponses.html",
};

const CLASSES = {
  desktopActive: "transition-colors duration-200 bg-secondary-container text-on-secondary-container font-semibold rounded-full px-4 py-2",
  desktopInactive: "font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors duration-200 py-2 px-3 rounded-full hover:bg-surface-container-high",
  mobileActive: "font-label-lg text-label-lg text-primary px-4 py-3 rounded-xl bg-secondary-container",
  mobileInactive: "font-label-lg text-label-lg text-on-surface-variant hover:text-primary px-4 py-3 rounded-xl hover:bg-surface-container-high transition-colors",
};

async function renderPartial(selector, url) {
  const placeholder = document.querySelector(selector);
  if (!placeholder) return;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load " + url.pathname + ": " + response.status);

  const template = document.createElement("template");
  template.innerHTML = (await response.text()).trim();
  placeholder.replaceWith(template.content);
}

function setActiveNavigation() {
  const pathname = window.location.pathname;
  const page = pathname.split("/").filter(Boolean).pop() || "index.html";
  const activeRoute = Object.entries(ROUTES).find(([, route]) => route === page)?.[0] || "home";

  document.querySelectorAll("[data-site-nav]").forEach((link) => {
    const isActive = link.dataset.siteNav === activeRoute;
    const isMobile = Boolean(link.closest("#mobile-drawer"));
    link.className = isMobile
      ? (isActive ? CLASSES.mobileActive : CLASSES.mobileInactive)
      : (isActive ? CLASSES.desktopActive : CLASSES.desktopInactive);

    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

try {
  await Promise.all([
    renderPartial("[data-site-header]", PARTIALS.header),
    renderPartial("[data-site-footer]", PARTIALS.footer),
  ]);
  setActiveNavigation();
  window.lucide?.createIcons();
  window.dispatchEvent(new CustomEvent("site-shell:ready"));
} catch (error) {
  console.error("El-Hafeed shared header/footer failed to load.", error);
}
