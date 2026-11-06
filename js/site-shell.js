import { sanityFetch } from "./sanity.js";

const PARTIALS = {
  header: new URL("../partials/header.html", import.meta.url),
  footer: new URL("../partials/footer.html", import.meta.url),
};

const SITE_SETTINGS_QUERY = `*[_id == "siteSettings"][0]{
  brand{name, tagline, "logoUrl": logo.asset->url, logoAlt},
  navigation[]{label, href}, contactButtonLabel, contactButtonUrl,
  phone, whatsapp, email, address, mapUrl,
  footerDescription, familySupportTitle, familySupportText, copyrightText,
  socialLinks[]{network, label, url}
}`;

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
  const rendered = template.content.firstElementChild;
  placeholder.replaceWith(template.content);
  return rendered;
}

async function loadSiteSettings() {
  try {
    const data = await sanityFetch(SITE_SETTINGS_QUERY);
    if (data) return data;
  } catch (error) {
    console.warn("Using local site settings while Sanity is unavailable.", error);
  }

  try {
    const response = await fetch("./content/site-settings.json");
    if (response.ok) return response.json();
  } catch (error) {
    console.warn("Unable to load local site settings.", error);
  }
  return null;
}

function setText(root, selector, value) {
  const element = root?.querySelector(selector);
  if (element && value !== undefined && value !== null && value !== "") {
    element.textContent = value;
  }
}

function safeSiteUrl(value, schemes = ["https:", "mailto:", "tel:"]) {
  const url = String(value || "").trim();
  if (/^(\.\/|\/(?!\/)|#)/.test(url)) return url;
  if (!/^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  try {
    const parsed = new URL(url, window.location.href);
    return schemes.includes(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}

function routeForHref(href) {
  try {
    const pathname = new URL(href, window.location.href).pathname.split("/").pop() || "index.html";
    return Object.entries(ROUTES).find(([, route]) => route === pathname)?.[0] || "";
  } catch {
    return "";
  }
}

function renderNavigation(header, navigation = []) {
  if (!Array.isArray(navigation) || !navigation.length) return;
  const desktop = header?.querySelector(".primary-nav");
  const mobile = header?.querySelector("#mobile-drawer nav");
  const desktopLinks = desktop ? Array.from(desktop.querySelectorAll("[data-site-nav]")) : [];
  const mobileLinks = mobile ? Array.from(mobile.querySelectorAll("[data-site-nav]")) : [];
  const desktopClasses = desktopLinks[0]?.className || CLASSES.desktopInactive;
  const mobileClasses = mobileLinks[0]?.className || CLASSES.mobileInactive;

  const makeLink = (item, isMobile) => {
    const href = safeSiteUrl(item?.href, []);
    if (!item?.label || !href) return null;
    const link = document.createElement("a");
    link.href = href;
    link.textContent = item.label;
    link.className = isMobile ? mobileClasses : desktopClasses;
    const route = routeForHref(href);
    if (route) link.dataset.siteNav = route;
    if (isMobile) link.dataset.action = "mobile-menu-close";
    return link;
  };

  if (desktop) {
    const links = navigation.map((item) => makeLink(item, false)).filter(Boolean);
    if (links.length) desktop.replaceChildren(...links);
  }
  if (mobile) {
    const contact = mobile.querySelector('[data-site-setting="contact-cta"]');
    const links = navigation.map((item) => makeLink(item, true)).filter(Boolean);
    if (contact) links.push(contact);
    if (links.length) mobile.replaceChildren(...links);
  }
}

function applySiteSettings(settings, header, footer) {
  if (!settings) return;
  const brand = settings.brand || {};
  setText(header, '[data-site-setting="brand-name"]', brand.name);
  setText(header, '[data-site-setting="brand-tagline"]', brand.tagline);
  setText(footer, '[data-site-setting="footer-description"]', settings.footerDescription);
  setText(footer, '[data-site-setting="family-support-title"]', settings.familySupportTitle);
  setText(footer, '[data-site-setting="family-support-text"]', settings.familySupportText);

  const brandImage = header?.querySelector('[data-site-setting="brand-logo"]');
  const logoUrl = brand.logoUrl || brand.logo;
  if (brandImage && logoUrl) {
    brandImage.src = logoUrl;
    brandImage.alt = brand.logoAlt || "";
  }
  const footerBrandImage = footer?.querySelector('[data-site-setting="footer-logo"]');
  if (footerBrandImage && logoUrl) {
    footerBrandImage.src = logoUrl;
    footerBrandImage.alt = brand.logoAlt || brand.name || "";
  }

  renderNavigation(header, settings.navigation);
  const contactUrl = safeSiteUrl(settings.contactButtonUrl);
  document.querySelectorAll('[data-site-setting="contact-cta"]').forEach((link) => {
    if (settings.contactButtonLabel) link.textContent = settings.contactButtonLabel;
    if (contactUrl) link.href = contactUrl;
  });

  const email = footer?.querySelector('[data-site-setting="email"]');
  if (email && settings.email) {
    email.textContent = settings.email;
    email.href = `mailto:${settings.email}`;
  }
  const phone = footer?.querySelector('[data-site-setting="phone"]');
  if (phone && settings.phone) {
    phone.textContent = settings.phone;
    const digits = String(settings.whatsapp || settings.phone).replace(/\D/g, "");
    if (digits) phone.href = `https://wa.me/${digits}`;
  }
  const address = footer?.querySelector('[data-site-setting="address"]');
  if (address && settings.address) address.textContent = settings.address;
  const mapLink = footer?.querySelector("[data-site-map-link]");
  const mapUrl = safeSiteUrl(settings.mapUrl, ["https:"]);
  if (mapLink && mapUrl) {
    mapLink.href = mapUrl;
    mapLink.textContent = settings.address || mapLink.textContent;
  }

  const copyright = footer?.querySelector('[data-site-setting="copyright"]');
  if (copyright && settings.copyrightText) {
    copyright.textContent = `© ${new Date().getFullYear()} ${brand.name || "El-Hafeed"}. ${settings.copyrightText} Tous droits réservés.`;
  }

  const socialContainer = footer?.querySelector('[data-site-setting="social-links"]');
  if (socialContainer && Array.isArray(settings.socialLinks)) {
    const iconNames = {Instagram: "instagram", Facebook: "facebook", LinkedIn: "linkedin", Autre: "globe"};
    socialContainer.replaceChildren(...settings.socialLinks.map((item) => {
      const url = safeSiteUrl(item.url, ["https:"]);
      if (!url) return null;
      const link = document.createElement("a");
      link.className = "w-10 h-10 rounded-full bg-surface-container-lowest/10 hover:bg-secondary hover:text-on-secondary flex items-center justify-center transition-all text-inverse-on-surface";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", item.label || item.network || "Réseau social El-Hafeed");
      link.title = item.network || "Réseau social";
      const icon = document.createElement("i");
      icon.dataset.lucide = iconNames[item.network] || "globe";
      icon.className = "w-5 h-5 site-icon";
      icon.setAttribute("aria-hidden", "true");
      link.append(icon);
      return link;
    }).filter(Boolean));
  }
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
  const [header, footer, settings] = await Promise.all([
    renderPartial("[data-site-header]", PARTIALS.header),
    renderPartial("[data-site-footer]", PARTIALS.footer),
    loadSiteSettings(),
  ]);
  applySiteSettings(settings, header, footer);
  setActiveNavigation();
  window.lucide?.createIcons();
  window.dispatchEvent(new CustomEvent("site-shell:ready"));
} catch (error) {
  console.error("El-Hafeed shared header/footer failed to load.", error);
}
