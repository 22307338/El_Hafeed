// ---------------------------------------------------------------------------
// Sanity connection
// ---------------------------------------------------------------------------
const SANITY = {
  projectId: "pxacju14",
  dataset: "production",
  apiVersion: "2024-01-01",
  // "apicdn.sanity.io" = fast, cached (use in production)
  // "api.sanity.io"    = always fresh (handy while developing)
  host: "apicdn.sanity.io",
};

const ARTICLES_QUERY = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  "imageUrl": mainImage.asset->url,
  body[]{..., "imageUrl": asset->url}
}`;

let articles = [];
let categories = ["Tous les sujets"];

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
  const text = (raw.body || [])
    .filter((b) => b._type === "block")
    .map((b) => (b.children || []).map((c) => c.text).join(" "))
    .join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const cover = raw.imageUrl
    ? `${raw.imageUrl}?w=1200&auto=format`
    : "resources/logo-cropped.webp";

  return {
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt || "",
    category: raw.category || "Autres sujets",
    minutes: Math.max(1, Math.ceil(words / 200)),
    date: raw.publishedAt
      ? new Date(raw.publishedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "",
    media: [{ type: "image", src: cover, alt: raw.title }],
    bodyHtml: portableTextToHtml(raw.body),
  };
}

async function loadArticles() {
  const url = `https://${SANITY.projectId}.${SANITY.host}/v${SANITY.apiVersion}/data/query/${SANITY.dataset}?query=${encodeURIComponent(ARTICLES_QUERY)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity ${response.status}`);
  const { result } = await response.json();
  return (result || []).map(normalizeArticle);
}

// ---------------------------------------------------------------------------
// Rendering (unchanged design)
// ---------------------------------------------------------------------------
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
  return `<a class="${className}" href="articles.html?article=${encodeURIComponent(article.slug)}" data-article-link="${escapeHtml(article.slug)}">Lire la réponse <i data-lucide="arrow-up-right" class="site-icon" aria-hidden="true"></i></a>`;
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
      : `<p class="articles-empty">Aucun article ne correspond à votre recherche. Essayez un autre mot-clé.</p>`;
  resultCount.textContent = `${matches.length} article${matches.length > 1 ? "s" : ""}`;
  window.lucide?.createIcons();
}

function renderFilters() {
  filters.innerHTML = categories
    .map(
      (category) =>
        `<button class="article-filter" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category)}</button>`,
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
      <div class="article-author"><span class="article-author-mark"><i data-lucide="heart-handshake" class="site-icon" aria-hidden="true"></i></span><span>La rédaction El-Hafeed · ${escapeHtml(article.date)} · ${article.minutes} min de lecture</span></div>
    </header>
    <div class="article-media-grid" data-count="${article.media.length}" aria-label="Médias de l’article">${media}</div>
    <div class="article-body">${article.bodyHtml}
      <aside class="article-callout">Chaque situation est différente. Les informations de cet article sont générales : échangez avec l’équipe de santé qui accompagne votre proche pour obtenir un avis adapté.</aside>
    </div>
    <div class="article-detail-footer">
      <a class="article-back-link" href="articles.html" data-articles-back><i data-lucide="arrow-left" class="site-icon" aria-hidden="true"></i>Retour aux articles</a>
      <a class="article-button" href="index.html#contact">Parler à notre équipe<i data-lucide="arrow-up-right" class="site-icon" aria-hidden="true"></i></a>
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
    document.title = `${article.title} — El-Hafeed`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", article.excerpt);
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  detail.classList.remove("is-visible");
  articlesHero.hidden = false;
  topicsSection.hidden = false;
  listing.hidden = false;
  renderListing();
  document.title = "Articles et conseils — El-Hafeed";
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      "content",
      "Des repères pratiques et des conseils pour accompagner les personnes âgées et leurs proches au quotidien.",
    );
  if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------------------------
// Startup: load from Sanity, then render
// ---------------------------------------------------------------------------
async function init() {
  featured.hidden = true;
  cardGrid.hidden = false;
  cardGrid.innerHTML = `<p class="articles-empty">Chargement des articles…</p>`;

  try {
    articles = await loadArticles();
  } catch (error) {
    console.error(error);
    cardGrid.innerHTML = `<p class="articles-empty">Impossible de charger les articles pour le moment. Veuillez réessayer plus tard.</p>`;
    return;
  }

  if (articles.length === 0) {
    cardGrid.innerHTML = `<p class="articles-empty">Les premiers articles arrivent bientôt.</p>`;
    resultCount.textContent = "";
    return;
  }

  const found = [...new Set(articles.map((a) => a.category))];
  categories = ["Tous les sujets", ...found];
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
    callback:
      "Formulaire de rappel direct : un coordinateur vous contactera sous 24 h.",
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
