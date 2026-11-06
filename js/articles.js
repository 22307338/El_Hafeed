import { sanityFetch } from "./sanity.js";

const ARTICLES_QUERY = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
  title,
  "slug": slug.current,
  excerpt,
  "category": category->title,
  publishedAt,
  metaTitle,
  metaDescription,
  "imageUrl": mainImage.asset->url,
  mainImageAlt,
  "media": media[]{type, "imageUrl": image.asset->url, "posterUrl": poster.asset->url, videoUrl, alt, caption},
  body[]{..., "imageUrl": asset->url}
}`;
const ARTICLE_PAGE_QUERY = `*[_id == "articlePage"][0]`;
const CATEGORIES_QUERY = `*[_type == "articleCategory"] | order(title asc){title}`;
let articles = [];
let categories = ["Tous les sujets"];
let pageContent = {};

const listing = document.querySelector("#articles-listing");
const detail = document.querySelector("#article-detail");
const articlesHero = document.querySelector("#articles-hero");
const topicsSection = document.querySelector("#article-topics");
const featured = document.querySelector("#featured-article");
const cardGrid = document.querySelector("#article-card-grid");
const filters = document.querySelector("#article-filters");
const searchForm = document.querySelector("#article-search");
const searchInput = document.querySelector("#article-search-input");
const resultCount = document.querySelector("#article-count");
let activeCategory = categories[0];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function safeContentUrl(value, fallback = "#contact") {
  const url = String(value || "").trim();
  return /^(https?:|mailto:|tel:|\/|#|\.)/i.test(url) ? url : fallback;
}

// ---------------------------------------------------------------------------
// Portable Text (Sanity rich text) -> HTML
// ---------------------------------------------------------------------------
function spansToHtml(block) {
  const defs = Object.fromEntries(
    (block.markDefs || []).map((d) => [d._key, d]),
  );
  return (block.children || [])
    .map((child) => {
      let text = escapeHtml(child.text || "").replace(/\n/g, "<br>");
      (child.marks || []).forEach((mark) => {
        if (mark === "strong") text = `<strong>${text}</strong>`;
        else if (mark === "em") text = `<em>${text}</em>`;
        else if (mark === "underline") text = `<u>${text}</u>`;
        else if (
          defs[mark]?.href &&
          /^(https?:|mailto:|tel:|\/)/.test(defs[mark].href)
        ) {
          text = `<a href="${escapeHtml(defs[mark].href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
      });
      return text;
    })
    .join("");
}

function portableTextToHtml(blocks = []) {
  let html = "";
  let openList = null;
  const closeList = () => {
    if (openList) html += `</${openList}>`;
    openList = null;
  };

  blocks.forEach((block) => {
    if (block._type === "image") {
      closeList();
      if (!block.imageUrl) return;
      const caption = block.caption
        ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
        : "";
      html += `<figure class="article-media-item"><img src="${escapeHtml(block.imageUrl)}?w=1200&auto=format" alt="${escapeHtml(block.alt || "")}" loading="lazy" decoding="async">${caption}</figure>`;
      return;
    }
    if (block._type !== "block") return;

    if (block.listItem) {
      const tag = block.listItem === "number" ? "ol" : "ul";
      if (openList !== tag) {
        closeList();
        html += `<${tag}>`;
        openList = tag;
      }
      html += `<li>${spansToHtml(block)}</li>`;
      return;
    }

    closeList();
    const inner = spansToHtml(block);
    if (!inner.trim()) return;
    if (block.style === "h2" || block.style === "h3") {
      html += `<h2>${inner}</h2>`;
    } else if (block.style === "h4") {
      html += `<h3>${inner}</h3>`;
    } else if (block.style === "blockquote") {
      html += `<aside class="article-callout">${inner}</aside>`;
    } else {
      html += `<p>${inner}</p>`;
    }
  });
  closeList();
  return html;
}

function normalizeArticle(raw) {
  const body = raw.body || [];
  const text = body
    .filter((block) => block._type === "block")
    .map((block) => (block.children || []).map((child) => child.text).join(" "))
    .join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const imageUrl = raw.imageUrl || raw.mainImage || "resources/logo-cropped.webp";
  const cover = /^https?:/.test(imageUrl) ? `${imageUrl}?w=1200&auto=format` : imageUrl;
  const supplementaryMedia = (raw.media || []).map((item) => ({
    type: item.type === "video" ? "video" : "image",
    src: item.type === "video" ? item.videoUrl : (item.imageUrl || item.image),
    poster: item.posterUrl || item.poster || "",
    alt: item.alt || raw.title,
    caption: item.caption || "",
  })).filter((item) => item.src);

  return {
    slug: raw.slug?.current || raw.slug,
    title: raw.title,
    excerpt: raw.excerpt || "",
    category: typeof raw.category === "string" ? raw.category : (raw.category?.title || "Autres sujets"),
    minutes: Math.max(1, Math.ceil(words / 200)),
    date: raw.publishedAt
      ? new Date(raw.publishedAt).toLocaleDateString("fr-FR", {day: "numeric", month: "long", year: "numeric"})
      : "",
    media: [{type: "image", src: cover, alt: raw.mainImageAlt || raw.title}, ...supplementaryMedia],
    bodyHtml: portableTextToHtml(body),
  };
}

async function loadLocalArticleCopy() {
  const response = await fetch("./content/articles.json");
  if (!response.ok) throw new Error(`Website content ${response.status}`);
  const localArticles = await response.json();
  return localArticles.map(normalizeArticle);
}

async function loadPageContent() {
  try {
    const result = await sanityFetch(ARTICLE_PAGE_QUERY);
    if (result) return result;
  } catch (error) {
    console.warn("Using the local Articles page copy while Sanity is unavailable.", error);
  }
  const response = await fetch("./content/articles-page.json");
  if (!response.ok) throw new Error(`Website page content ${response.status}`);
  return response.json();
}

async function loadCategories() {
  try {
    const result = await sanityFetch(CATEGORIES_QUERY);
    if (result?.length) return result.map((item) => item.title).filter(Boolean);
  } catch (error) {
    console.warn("Using article categories as filters while Sanity is unavailable.", error);
  }
  return [...new Set(articles.map((article) => article.category).filter(Boolean))];
}

function applyPageContent() {
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  };
  setText(".articles-eyebrow", pageContent.eyebrow);
  setText("#articles-title", pageContent.title);
  setText(".articles-hero > p:not(.articles-eyebrow)", pageContent.intro);
  setText("#article-topics-title", pageContent.filtersHeading);
  setText("#article-list-title", pageContent.featuredHeading);
  setText("#articles-listing .articles-section-heading:nth-of-type(2) h2", pageContent.otherArticlesHeading);
  setText("#articles-listing .articles-help h2", pageContent.contactTitle);
  setText("#articles-listing .articles-help p", pageContent.contactText);
  const search = document.querySelector("#article-search-input");
  if (search) {
    if (pageContent.searchPlaceholder) search.placeholder = pageContent.searchPlaceholder;
    if (pageContent.searchLabel) search.setAttribute("aria-label", pageContent.searchLabel);
  }
  setText("#article-search button", pageContent.searchButtonLabel);
  const contact = document.querySelector("#articles-listing .articles-help .article-button");
  if (contact) {
    contact.href = safeContentUrl(pageContent.contactButtonUrl, "index.html#contact");
    const icon = contact.querySelector("i");
    contact.textContent = pageContent.contactButtonLabel || "Parlons-en";
    if (icon) contact.append(icon);
  }
  if (pageContent.metaTitle) document.title = pageContent.metaTitle;
  if (pageContent.metaDescription) document.querySelector('meta[name="description"]')?.setAttribute("content", pageContent.metaDescription);
}

async function loadArticles() {
  try {
    const result = await sanityFetch(ARTICLES_QUERY);
    if (result?.length) return result.map(normalizeArticle);
  } catch (error) {
    console.warn("Using the Website article copy while Sanity is unavailable.", error);
  }
  return loadLocalArticleCopy();
}
// Rendering (unchanged design)
// ---------------------------------------------------------------------------
function getVideoEmbedUrl(value = "") {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v") || url.pathname.match(/^\/embed\/([^/]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {}
  return "";
}
function mediaMarkup(
  media,
  className = "article-cover",
  { loading = "lazy", priority = false } = {},
) {
  const alt = escapeHtml(media.alt || "Illustration de l’article");
  if (media.type === "video") {
    const poster = media.poster ? ` poster="${escapeHtml(media.poster)}"` : "";
    return `<video class="${className}" controls playsinline preload="metadata"${poster} aria-label="${alt}"><source src="${escapeHtml(media.src)}" type="${escapeHtml(media.mime || "video/mp4")}">Votre navigateur ne peut pas lire cette vidéo.</video>`;
  }
  return `<img class="${className}" src="${escapeHtml(media.src)}" alt="${alt}" loading="${loading}" decoding="async"${priority ? ' fetchpriority="high"' : ""}>`;
}

function cardCoverMarkup(media) {
  if (media.type !== "video") return mediaMarkup(media);
  return `<img class="article-cover" src="${escapeHtml(media.poster || "resources/logo-cropped.webp")}" alt="Aperçu vidéo : ${escapeHtml(media.alt || "illustration de l’article")}" loading="lazy">`;
}

function articleLink(article, className = "article-read-link") {
  return `<a class="${className}" href="articles.html?article=${encodeURIComponent(article.slug)}" data-article-link="${escapeHtml(article.slug)}">${escapeHtml(pageContent.readArticleLabel || "Lire la réponse")} <i data-lucide="arrow-up-right" class="site-icon" aria-hidden="true"></i></a>`;
}

function articleMeta(article) {
  return `<div class="article-meta"><span class="article-category">${escapeHtml(article.category)}</span><span>${article.minutes} min de lecture</span></div>`;
}

function renderFeatured(article) {
  const cover = article.media[0];
  featured.innerHTML = `
    <a class="article-card-link" href="articles.html?article=${encodeURIComponent(article.slug)}" data-article-link="${escapeHtml(article.slug)}" aria-label="Lire : ${escapeHtml(article.title)}">
      ${cardCoverMarkup(cover)}
    </a>
    <div class="article-featured-copy">
      ${articleMeta(article)}
      <h3><a class="article-card-link" href="articles.html?article=${encodeURIComponent(article.slug)}" data-article-link="${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a></h3>
      <p>${escapeHtml(article.excerpt)}</p>
      ${articleLink(article)}
    </div>`;
}

function renderCard(article) {
  const cover = article.media[0];
  return `<article class="article-card">
    <a class="article-card-link" href="articles.html?article=${encodeURIComponent(article.slug)}" data-article-link="${escapeHtml(article.slug)}" aria-label="Lire : ${escapeHtml(article.title)}">
      ${cardCoverMarkup(cover)}
    </a>
    <div class="article-card-copy">
      ${articleMeta(article)}
      <h3><a class="article-card-link" href="articles.html?article=${encodeURIComponent(article.slug)}" data-article-link="${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a></h3>
      <p>${escapeHtml(article.excerpt)}</p>
      ${articleLink(article)}
    </div>
  </article>`;
}

function renderListing() {
  const query = searchInput.value.trim().toLocaleLowerCase("fr");
  cardGrid.classList.toggle("is-filtered", activeCategory !== categories[0]);
  const matches = articles.filter((article) => {
    const inCategory =
      activeCategory === categories[0] || article.category === activeCategory;
    const searchable =
      `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase(
        "fr",
      );
    return inCategory && (!query || searchable.includes(query));
  });
  const [featuredArticle, ...otherArticles] = matches;

  featured.hidden = !featuredArticle;
  if (featuredArticle) renderFeatured(featuredArticle);
  cardGrid.hidden = otherArticles.length === 0 && matches.length > 0;
  cardGrid.innerHTML = otherArticles.length
    ? otherArticles.map(renderCard).join("")
    : matches.length
      ? ""
      : `<p class="articles-empty">${escapeHtml(pageContent.emptySearchText || "Aucun article ne correspond à votre recherche. Essayez un autre mot-clé.")}</p>`;
  resultCount.textContent = `${matches.length} article${matches.length > 1 ? "s" : ""}`;
  window.lucide?.createIcons();
}

function renderFilters() {
  filters.innerHTML = categories
    .map(
      (category) =>
        `<button class="article-filter" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category === categories[0] ? (pageContent.allCategoriesLabel || category) : category)}</button>`,
    )
    .join("");
}

function renderDetail(article) {
  const media = article.media
    .map((item, index) => {
      const content = mediaMarkup(item, "", {
        loading: "eager",
        priority: index === 0,
      });
      const caption = item.caption
        ? `<figcaption>${escapeHtml(item.caption)}</figcaption>`
        : "";
      return `<figure class="article-media-item">${content}${caption}</figure>`;
    })
    .join("");

  detail.innerHTML = `
    <header class="article-detail-header">
      ${articleMeta(article)}
      <h1>${escapeHtml(article.title)}</h1>
      <p class="article-excerpt">${escapeHtml(article.excerpt)}</p>
      <div class="article-author"><span class="article-author-mark"><i data-lucide="heart-handshake" class="site-icon" aria-hidden="true"></i></span><span>${escapeHtml(pageContent.articleAuthorLabel || "La rédaction El-Hafeed")} · ${escapeHtml(article.date)} · ${article.minutes} min de lecture</span></div>
    </header>
    <div class="article-media-grid" data-count="${article.media.length}" aria-label="Médias de l’article">${media}</div>
    <div class="article-body">${article.bodyHtml}
      <aside class="article-callout">${escapeHtml(pageContent.articleDisclaimer || "Chaque situation est différente. Les informations de cet article sont générales : échangez avec l’équipe de santé qui accompagne votre proche pour obtenir un avis adapté.")}</aside>
    </div>
    <div class="article-detail-footer">
      <a class="article-back-link" href="articles.html" data-articles-back><i data-lucide="arrow-left" class="site-icon" aria-hidden="true"></i>${escapeHtml(pageContent.backToArticlesLabel || "Retour aux articles")}</a>
      <a class="article-button" href="${escapeHtml(safeContentUrl(pageContent.contactButtonUrl, "index.html#contact"))}">${escapeHtml(pageContent.detailContactLabel || "Parler à notre équipe")}<i data-lucide="arrow-up-right" class="site-icon" aria-hidden="true"></i></a>
    </div>`;
  window.lucide?.createIcons();
}

function showCurrentPage({ scroll = false } = {}) {
  const slug = new URLSearchParams(window.location.search).get("article");
  const article = articles.find((item) => item.slug === slug);
  if (article) {
    listing.hidden = true;
    articlesHero.hidden = true;
    topicsSection.hidden = true;
    detail.classList.add("is-visible");
    renderDetail(article);
    document.title = article.metaTitle || `${article.title} — El-Hafeed`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", article.metaDescription || article.excerpt);
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  detail.classList.remove("is-visible");
  articlesHero.hidden = false;
  topicsSection.hidden = false;
  listing.hidden = false;
  renderListing();
  applyPageContent();
  if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------------------------
// Startup: load from Sanity, then render
// ---------------------------------------------------------------------------
async function init() {
  featured.hidden = true;
  cardGrid.hidden = false;
  cardGrid.innerHTML = `<p class="articles-empty">Chargement des articles…</p>`;

  articles = await loadArticles();
  pageContent = await loadPageContent();
  applyPageContent();

  if (articles.length === 0) {
    cardGrid.innerHTML = `<p class="articles-empty">${escapeHtml(pageContent.emptyArticlesText || "Les premiers articles arrivent bientôt.")}</p>`;
    resultCount.textContent = "";
    return;
  }

  const found = await loadCategories();
  const allLabel = pageContent.allCategoriesLabel || "Tous les sujets";
  categories = [allLabel, ...found.filter((item) => item !== allLabel)];
  activeCategory = categories[0];
  renderFilters();
  showCurrentPage();
}

init();

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  filters.querySelectorAll("[data-category]").forEach((item) => {
    item.setAttribute("aria-pressed", String(item === button));
  });
  renderListing();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderListing();
});

searchInput.addEventListener("input", renderListing);

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-article-link]");
  if (link) {
    event.preventDefault();
    history.pushState({}, "", link.href);
    showCurrentPage({ scroll: true });
    return;
  }

  if (event.target.closest("[data-articles-back]")) {
    event.preventDefault();
    history.pushState({}, "", "articles.html");
    showCurrentPage({ scroll: true });
  }
});

window.addEventListener("popstate", () => showCurrentPage({ scroll: true }));

// ---------------------------------------------------------------------------
// Site UI (menu, tooltips, toast) — unchanged
// ---------------------------------------------------------------------------
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const drawer = document.querySelector("#mobile-drawer");
  if (target.dataset.action === "mobile-menu-toggle") {
    const willOpen = drawer?.classList.contains("hidden");
    drawer?.classList.toggle("hidden", !willOpen);
    target.setAttribute("aria-expanded", String(Boolean(willOpen)));
  }
  if (target.dataset.action === "mobile-menu-close") {
    drawer?.classList.add("hidden");
    document
      .querySelector('[data-action="mobile-menu-toggle"]')
      ?.setAttribute("aria-expanded", "false");
  }
  if (target.dataset.action === "toast-close") {
    document.querySelector("#notice-toast")?.classList.add("hidden");
  }
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-tooltip-trigger]");
  if (!trigger) return;
  const tooltip = trigger.nextElementSibling;
  if (!tooltip) return;
  const willOpen = tooltip.classList.contains("hidden");
  tooltip.classList.toggle("hidden", !willOpen);
  trigger.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) {
    window.setTimeout(() => {
      tooltip.classList.add("hidden");
      trigger.setAttribute("aria-expanded", "false");
    }, 2500);
  }
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-toast-trigger]");
  if (!trigger) return;
  event.preventDefault();
  const messages = {
    linkedin: "Le compte LinkedIn sera connecté très prochainement.",
    instagram: "Le compte Instagram sera connecté très prochainement.",
    facebook: "Le compte Facebook sera connecté très prochainement.",
    callback: "Pour organiser un échange, contactez directement l’équipe El-Hafeed.",
    legal: "Document en cours d’actualisation.",
    privacy: "La politique de confidentialité sera bientôt disponible.",
  };
  const toast = document.querySelector("#notice-toast");
  const text = document.querySelector("#notice-toast-text");
  if (!toast || !text) return;
  text.textContent =
    messages[trigger.dataset.toastTrigger] || "Information bientôt disponible.";
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 4000);
});

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener("load", () => window.lucide?.createIcons(), {
    once: true,
  });
}

