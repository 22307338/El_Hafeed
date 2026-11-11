import {
  sanityFetch,
  escapeHtml,
  safeUrl,
  portableTextToHtml,
} from "./sanity.js";

const QA_QUERY = `*[_id == "qaPage"][0]{
  eyebrow, title, intro, overviewHint,
  topics[]{ title, questions[]{ question, answer } },
  disclaimerTitle, disclaimerText,
  contactTitle, contactText, contactButtonLabel, contactButtonUrl,
  metaTitle, metaDescription
}`;

async function loadLocalQaContent() {
  const response = await fetch("./content/qa.json");
  if (!response.ok) throw new Error(`Website content ${response.status}`);
  return response.json();
}

const qaRoot = document.querySelector("#qa-root");

function plural(count, word) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

function renderTopic(topic, topicIndex) {
  const number = String(topicIndex + 1).padStart(2, "0");
  const topicId = `qa-topic-${topicIndex + 1}`;
  const items = (topic.questions || [])
    .map((item, itemIndex) => {
      const base = `${topicIndex + 1}-${itemIndex + 1}`;
      return `
            <article class="qa-item">
              <h3 class="qa-item-heading">
                <button class="qa-question" type="button" aria-expanded="false" aria-controls="qa-answer-${base}" id="qa-question-${base}">
                  <span>${escapeHtml(item.question)}</span>
                  <span class="qa-toggle-icon" aria-hidden="true"></span>
                </button>
              </h3>
              <div class="qa-answer" id="qa-answer-${base}" aria-hidden="true" inert>
                <div class="qa-answer-inner">${portableTextToHtml(item.answer)}</div>
              </div>
            </article>`;
    })
    .join("");

  return `
        <section class="qa-topic" aria-labelledby="${topicId}">
          <div class="qa-topic-heading"><span class="qa-topic-index" aria-hidden="true">${number}</span><h2 id="${topicId}">${escapeHtml(topic.title)}</h2></div>
          <div class="qa-list">${items}
          </div>
        </section>`;
}

function renderPage(data) {
  const topics = (data.topics || []).filter((t) => t?.title);
  const questionCount = topics.reduce(
    (sum, t) => sum + (t.questions?.length || 0),
    0,
  );
  const buttonUrl = safeUrl(data.contactButtonUrl);

  const disclaimer =
    data.disclaimerTitle || data.disclaimerText
      ? `<aside class="qa-disclaimer" aria-labelledby="qa-disclaimer-title"><span class="qa-disclaimer-mark" aria-hidden="true">i</span><div><h2 id="qa-disclaimer-title">${escapeHtml(data.disclaimerTitle)}</h2><p>${escapeHtml(data.disclaimerText)}</p></div></aside>`
      : "";


  qaRoot.innerHTML = `
        <section class="qa-hero" aria-labelledby="qa-title">
          ${data.eyebrow ? `<p class="qa-eyebrow">${escapeHtml(data.eyebrow)}</p>` : ""}
          <h1 id="qa-title">${escapeHtml(data.title)}</h1>
          ${data.intro ? `<p class="qa-intro">${escapeHtml(data.intro)}</p>` : ""}
        </section>
        <div class="qa-content">
          <div class="qa-overview"><p><strong>${plural(questionCount, "question")}</strong><span aria-hidden="true">·</span><strong>${plural(topics.length, "sujet")}</strong></p>${data.overviewHint ? `<p>${escapeHtml(data.overviewHint)}</p>` : ""}</div>
          ${topics.map(renderTopic).join("")}
          ${disclaimer}
        </div>`;

  if (data.metaTitle) document.title = data.metaTitle;
  if (data.metaDescription) {
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", data.metaDescription);
  }
  window.lucide?.createIcons();
}

async function initPage() {
  qaRoot.innerHTML = `<p class="qa-intro" style="padding:2rem 0">Chargement…</p>`;
  try {
    const data = await sanityFetch(QA_QUERY);
    renderPage(data || (await loadLocalQaContent()));
  } catch (error) {
    console.error(error);
    try {
      renderPage(await loadLocalQaContent());
    } catch (fallbackError) {
      console.error(fallbackError);
      qaRoot.innerHTML = `<p class="qa-intro" style="padding:2rem 0">Impossible de charger cette page pour le moment. Veuillez réessayer plus tard.</p>`;
    }
  }
}
initPage();

// ---------------------------------------------------------------------------
// Accordion + site UI (unchanged behaviour)
// ---------------------------------------------------------------------------
const faqPage = document.querySelector(".qa-page");
const faqToast = document.querySelector("#notice-toast");
let toastTimer;

faqPage?.addEventListener("click", (event) => {
  const button = event.target.closest(".qa-question");
  if (!button) return;

  const item = button.closest(".qa-item");
  const answer = document.getElementById(button.getAttribute("aria-controls"));
  if (!item || !answer) return;

  const isOpen = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isOpen));
  answer.setAttribute("aria-hidden", String(isOpen));
  answer.inert = isOpen;
  item.classList.toggle("is-open", !isOpen);
});

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (action) {
    const drawer = document.querySelector("#mobile-drawer");

    if (action.dataset.action === "mobile-menu-toggle") {
      const willOpen = drawer?.classList.contains("hidden");
      drawer?.classList.toggle("hidden", !willOpen);
      action.setAttribute("aria-expanded", String(Boolean(willOpen)));
    }

    if (action.dataset.action === "mobile-menu-close") {
      drawer?.classList.add("hidden");
      document
        .querySelector('[data-action="mobile-menu-toggle"]')
        ?.setAttribute("aria-expanded", "false");
    }

    if (action.dataset.action === "toast-close") {
      faqToast?.classList.add("hidden");
    }
  }

  const toastTrigger = event.target.closest("[data-toast-trigger]");
  if (toastTrigger && faqToast) {
    if (toastTrigger instanceof HTMLAnchorElement) event.preventDefault();
    const messages = {
      linkedin: "Le compte LinkedIn sera connecté très prochainement.",
      instagram: "Le compte Instagram sera connecté très prochainement.",
      facebook: "Le compte Facebook sera connecté très prochainement.",
      callback: "Pour organiser un échange, contactez directement l’équipe El-Hafeed.",
      legal: "Les informations légales seront communiquées par El-Hafeed.",
      privacy: "Les informations confiées à l’équipe sont traitées avec confidentialité.",
    };
    document.querySelector("#notice-toast-text").textContent =
      messages[toastTrigger.dataset.toastTrigger] ||
      "Information bientôt disponible.";
    faqToast.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(
      () => faqToast.classList.add("hidden"),
      4000,
    );
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const drawer = document.querySelector("#mobile-drawer");
  drawer?.classList.add("hidden");
  document
    .querySelector('[data-action="mobile-menu-toggle"]')
    ?.setAttribute("aria-expanded", "false");
  faqToast?.classList.add("hidden");
});

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener("load", () => window.lucide?.createIcons(), {
    once: true,
  });
}
