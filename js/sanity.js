// Shared Sanity helpers for the whole website.
// Import with: import { sanityFetch, escapeHtml, portableTextToHtml } from "./sanity.js";

export const SANITY = {
  projectId: "pxacju14",
  dataset: "production",
  apiVersion: "2024-01-01",
  // Use the uncached API host so newly published CMS edits appear promptly.
  host: "api.sanity.io",
};

export async function sanityFetch(query, params = {}) {
  const search = new URLSearchParams({ query });
  Object.entries(params).forEach(([name, value]) => {
    search.set(`$${name}`, JSON.stringify(value));
  });
  const url = `https://${SANITY.projectId}.${SANITY.host}/v${SANITY.apiVersion}/data/query/${SANITY.dataset}?${search}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Sanity ${response.status}`);
  const { result } = await response.json();
  return result;
}

export function sanityImageUrl(value, options = {}) {
  if (!value) return "";
  let url;
  try {
    url = new URL(value, document.baseURI);
  } catch {
    return value;
  }
  if (url.hostname !== "cdn.sanity.io") return value;
  url.searchParams.set("auto", "format");
  if (options.width) url.searchParams.set("w", String(options.width));
  if (options.height) url.searchParams.set("h", String(options.height));
  if (options.fit) url.searchParams.set("fit", options.fit);
  return url.href;
}

export function applyPageMetadata({title, description, image} = {}) {
  if (title) document.title = title;
  if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);

  const setMeta = (selector, attribute, value) => {
    if (!value) return;
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      const [key, keyValue] = attribute;
      element.setAttribute(key, keyValue);
      document.head.append(element);
    }
    element.setAttribute("content", value);
  };

  const absoluteImage = image ? new URL(image, document.baseURI).href : "";
  const socialImage = absoluteImage ? sanityImageUrl(absoluteImage, {width: 1200, height: 630, fit: "crop"}) : "";
  setMeta('meta[property="og:title"]', ["property", "og:title"], title);
  setMeta('meta[property="og:description"]', ["property", "og:description"], description);
  setMeta('meta[property="og:image"]', ["property", "og:image"], socialImage);
  setMeta('meta[name="twitter:card"]', ["name", "twitter:card"], "summary_large_image");
  setMeta('meta[name="twitter:title"]', ["name", "twitter:title"], title);
  setMeta('meta[name="twitter:description"]', ["name", "twitter:description"], description);
  setMeta('meta[name="twitter:image"]', ["name", "twitter:image"], socialImage);
}

export function escapeHtml(value = "") {
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

// Only allow safe link schemes coming from the CMS.
export function safeUrl(url = "") {
  return /^(https?:|mailto:|tel:|\/)/.test(url) ? url : "";
}

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
        else if (defs[mark]?.href && safeUrl(defs[mark].href)) {
          text = `<a href="${escapeHtml(defs[mark].href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
      });
      return text;
    })
    .join("");
}

// Sanity rich text (Portable Text) -> HTML
export function portableTextToHtml(blocks = []) {
  let html = "";
  let openList = null;
  const closeList = () => {
    if (openList) html += `</${openList}>`;
    openList = null;
  };

  (blocks || []).forEach((block) => {
    if (block._type === "image") {
      closeList();
      if (!block.imageUrl) return;
      const caption = block.caption
        ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
        : "";
      html += `<figure class="article-media-item"><img src="${escapeHtml(sanityImageUrl(block.imageUrl, {width: 1200, fit: "max"}))}" alt="${escapeHtml(block.alt || "")}" loading="lazy" decoding="async">${caption}</figure>`;
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
