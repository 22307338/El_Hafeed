import { sanityFetch } from "./sanity.js";

const TEAM_PAGE_QUERY = `*[_id == "teamPage"][0]{
  intro{title,description},
  carouselImages[]{_key,alt,"imageUrl":image.asset->url},
  membersHeading{eyebrow,title,description},
  multidisciplinary{eyebrow,title,overview,explanation},
  members[]{_key,name,speciality,description,missions},
  homeCareJourney{title,steps[]{label,title,description}},
  metaTitle,metaDescription
}`;

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Website content ${response.status}`);
  return response.json();
}

async function loadContent(query, fallback) {
  try {
    const result = await sanityFetch(query);
    if (result && (!Array.isArray(result) || result.length)) return result;
  } catch (error) {
    console.warn("Using local team page content while Sanity is unavailable.", error);
  }
  return loadJson(fallback);
}

function setText(element, value) {
  if (element && value !== undefined && value !== null) element.textContent = value;
}

function renderJourney(journey) {
  const section = document.querySelector(".team-homecare-timeline-section");
  const list = section?.querySelector(".team-homecare-timeline");
  if (!section || !list || !journey) return;
  setText(section.querySelector(".team-homecare-timeline-title"), journey.title);
  if (!Array.isArray(journey.steps)) return;
  list.replaceChildren(...journey.steps.map((step) => {
    const item = document.createElement("li");
    item.className = "team-homecare-timeline-item";
    const dot = document.createElement("span");
    dot.className = "team-homecare-timeline-dot";
    dot.setAttribute("aria-hidden", "true");
    const label = document.createElement("p");
    label.className = "team-homecare-timeline-step";
    label.textContent = step.label || "";
    const card = document.createElement("article");
    card.className = "team-homecare-timeline-card";
    const heading = document.createElement("h3");
    heading.textContent = step.title || "";
    const description = document.createElement("p");
    description.textContent = step.description || "";
    card.append(heading, description);
    item.append(dot, label, card);
    return item;
  }));
}

function renderCarouselImages(images) {
  const section = document.querySelector(".team-carousel-section");
  const track = section?.querySelector(".team-carousel-track");
  if (!section || !track || !Array.isArray(images)) return;

  const usableImages = images.filter((item) => item.imageUrl || item.image);
  section.hidden = usableImages.length === 0;
  track.replaceChildren(...usableImages.map((item, index) => {
    const imageUrl = item.imageUrl || item.image;
    const slide = document.createElement("li");
    slide.className = `team-carousel-slide${index === 0 ? " is-active" : ""}`;
    slide.setAttribute("aria-roledescription", "diapositive");
    slide.setAttribute("aria-label", `${index + 1} sur ${usableImages.length}`);
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = item.alt || "Photo de l’équipe et de l’accompagnement El-Hafeed";
    image.decoding = "async";
    if (index === 0) image.fetchPriority = "high";
    else image.loading = "lazy";
    slide.append(image);
    return slide;
  }));
  document.dispatchEvent(new CustomEvent("team-carousel:content-updated"));
}

const MEMBER_KEYS = [
  "coordinatrice", "aides-soignants", "psychologue", "orthophoniste",
  "kinesitherapeute", "nutritionniste", "psychomotricienne",
];
const MEMBER_STYLES = [
  "team-member-infirmary", "team-member-care", "team-member-psychology",
  "team-member-speech", "team-member-physio", "team-member-nutrition",
  "team-member-psychomotor",
];

function renderMembers(members) {
  const grid = document.querySelector(".team-members-grid");
  const template = grid?.querySelector(".team-member-card");
  if (!grid || !template || !Array.isArray(members)) return;
  const existingCards = [...grid.querySelectorAll(".team-member-card")];
  const cards = members.map((_, index) => existingCards[index] || template.cloneNode(true));
  grid.replaceChildren(...cards);

  const missions = {};
  members.forEach((member, index) => {
    const card = cards[index];
    const key = member._key || MEMBER_KEYS[index] || `member-${index + 1}`;
    card.dataset.memberKey = key;
    const capsule = card.querySelector(".team-member-capsule");
    MEMBER_STYLES.forEach((className) => capsule?.classList.remove(className));
    capsule?.classList.add(MEMBER_STYLES[index % MEMBER_STYLES.length]);
    setText(card.querySelector(".team-member-capsule-heading h3"), member.name);
    setText(card.querySelector(".team-member-role"), member.speciality || member.specialty);
    const missionPreview = card.querySelector(".team-member-missions-preview");
    if (missionPreview) {
      missionPreview.replaceChildren(...(Array.isArray(member.missions) ? member.missions : []).slice(0, 3).map((mission) => {
        const item = document.createElement("li");
        item.textContent = mission;
        return item;
      }));
    }
    const button = card.querySelector(".team-member-mission-button");
    if (button) {
      button.onclick = () => window.toggleMissionModal(key);
      button.setAttribute("aria-expanded", "false");
    }
    missions[key] = {
      name: member.name || "",
      pole: member.speciality || member.specialty || "",
      description: member.description || "",
      points: Array.isArray(member.missions) ? member.missions : [],
    };
  });
  window.teamMissionsData = missions;
}

function applyTeamPage(data) {
  const intro = data.intro || {};
  setText(document.querySelector("#team-page-title"), intro.title);
  setText(document.querySelector("#team-page-intro-copy"), intro.description);
  renderCarouselImages(data.carouselImages);

  const membersHeading = data.membersHeading || {eyebrow: data.membersEyebrow, title: data.membersTitle, description: data.membersIntro};
  setText(document.querySelector(".team-members-heading .team-eyebrow"), membersHeading.eyebrow);
  setText(document.querySelector("#team-members-title"), membersHeading.title);
  setText(document.querySelector(".team-members-heading > p:last-child"), membersHeading.description);

  const multidisciplinary = data.multidisciplinary || {};
  const multidisciplinarySection = document.querySelector(".team-multidisciplinary-section");
  setText(multidisciplinarySection?.querySelector(".team-multidisciplinary-heading .team-eyebrow"), multidisciplinary.eyebrow);
  setText(multidisciplinarySection?.querySelector("#team-multidisciplinary-title"), multidisciplinary.title);
  const approachParagraphs = multidisciplinarySection?.querySelectorAll(".team-multidisciplinary-copy p") || [];
  setText(approachParagraphs[0], multidisciplinary.overview);
  setText(approachParagraphs[1], multidisciplinary.explanation);
  renderMembers(data.members || []);
  renderJourney(data.homeCareJourney);
  if (data.metaTitle) document.title = data.metaTitle;
  if (data.metaDescription) document.querySelector('meta[name="description"]')?.setAttribute("content", data.metaDescription);
  window.lucide?.createIcons();
}

async function initTeamContent() {
  const [page, localTeamPage] = await Promise.all([
    loadContent(TEAM_PAGE_QUERY, "./content/team-page.json"),
    loadJson("./content/team-page.json"),
  ]);
  const resolvedPage = {
    ...localTeamPage,
    ...page,
    intro: page.intro ? {...localTeamPage.intro, ...page.intro} : localTeamPage.intro,
    carouselImages: Array.isArray(page.carouselImages)
      ? page.carouselImages
      : localTeamPage.carouselImages,
    membersHeading: page.membersHeading || localTeamPage.membersHeading,
    members: Array.isArray(page.members) ? page.members : localTeamPage.members,
    multidisciplinary: {
      ...localTeamPage.multidisciplinary,
      ...(page.multidisciplinary || {}),
    },
    homeCareJourney: {
      ...localTeamPage.homeCareJourney,
      ...(page.homeCareJourney || {}),
      steps: Array.isArray(page.homeCareJourney?.steps)
        ? page.homeCareJourney.steps
        : localTeamPage.homeCareJourney?.steps,
    },
  };
  applyTeamPage(resolvedPage);
}

initTeamContent().catch((error) => {
  console.error("Unable to apply Notre équipe content.", error);
});
