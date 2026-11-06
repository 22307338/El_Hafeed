import { sanityFetch } from "./sanity.js";
import { initServicesSection } from "./services.js";

const TEAM_PAGE_QUERY = `*[_id == "teamPage"][0]{
  ..., intro, director{..., "photoUrl": photo.asset->url},
  members[]{..., "photoUrl": photo.asset->url}, services
}`;
const SERVICES_QUERY = `*[_type == "service"] | order(order asc, title asc){
  "id": coalesce(id, slug.current, _id),
  "label": coalesce(label, title),
  "imageUrl": image.asset->url,
  alt, tagline, intro, details, prestations
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

function setTextKeepIcon(element, value) {
  if (!element || value === undefined || value === null) return;
  const icon = element.querySelector("i, svg");
  element.textContent = value;
  if (icon) element.prepend(icon);
}

function applyTeamPage(data) {
  const intro = data.intro || {};
  setText(document.querySelector(".team-page-intro .team-eyebrow"), intro.eyebrow);
  setText(document.querySelector("#team-page-title"), intro.title);
  setText(document.querySelector("#team-page-intro-copy"), intro.description);
  (intro.highlights || []).forEach((item, index) => {
    const row = document.querySelectorAll(".team-intro-highlights li")[index];
    const icon = row?.querySelector("i");
    if (!row || !item.label) return;
    row.textContent = item.label;
    if (icon) row.prepend(icon);
  });

  const director = data.director || {};
  const directorRoot = document.querySelector(".director-editorial-card");
  setText(directorRoot?.querySelector(".director-identity h3"), director.name);
  const [roleLead, roleTail] = String(director.role || "").split(/\s*[·|]\s*/, 2);
  setText(directorRoot?.querySelector(".director-identity .team-eyebrow"), director.title || roleTail || director.role);
  setText(directorRoot?.querySelector(".director-identity .director-role"), director.speciality || (roleTail ? roleLead : undefined));
  setTextKeepIcon(directorRoot?.querySelector(".director-location"), director.locations);
  setText(directorRoot?.querySelector(".director-biography"), director.biography);
  setText(directorRoot?.querySelector(".director-quote p"), director.quote ? `« ${director.quote} »` : undefined);
  const directorImage = directorRoot?.querySelector(".director-portrait-frame img");
  if (directorImage && director.photo) {
    directorImage.src = director.photoUrl || director.photo;
    directorImage.alt = director.photoAlt || director.name || "";
  }
  setText(document.querySelector(".team-members-heading .team-eyebrow"), data.membersEyebrow);
  setText(document.querySelector("#team-members-title"), data.membersTitle);
  setText(document.querySelector(".team-members-heading > p:last-child"), data.membersIntro);

  const cards = document.querySelectorAll(".team-member-card");
  window.teamMissionsData = Object.fromEntries((data.members || []).map((member, index) => [
    ["youssef", "zahra", "amina", "leila", "fatimazahra"][index],
    { name: member.name || "", role: member.role || "", pole: member.speciality || member.specialty || "", points: member.missions || [] },
  ]).filter(([key]) => key));
  (data.members || []).forEach((member, index) => {
    const card = cards[index];
    if (!card) return;
    setText(card.querySelector(".team-member-capsule-heading h3"), member.name);
    setText(card.querySelector(".team-member-capsule-heading p"), member.role);
    setText(card.querySelector(".team-member-role"), member.speciality || member.specialty);
    setText(card.querySelector(".team-member-copy > p"), member.description);
    const image = card.querySelector(".team-member-photo img");
    if (image && (member.photoUrl || member.photo)) {
      image.src = member.photoUrl || member.photo;
      image.alt = member.photoAlt || member.name || "";
    }
  });
  if (data.metaTitle) document.title = data.metaTitle;
  if (data.metaDescription) document.querySelector('meta[name="description"]')?.setAttribute("content", data.metaDescription);
}

async function initTeamContent() {
  const [page, sanityServices] = await Promise.all([
    loadContent(TEAM_PAGE_QUERY, "./content/team-page.json"),
    loadContent(SERVICES_QUERY, "./content/services.json"),
  ]);
  applyTeamPage(page);
  const services = Array.isArray(sanityServices) ? sanityServices : [];
  if (services.length) initServicesSection(services);
  else console.warn("No services were returned by Sanity or the local fallback.");

  const serviceCopy = page.services || {};
  setText(document.querySelector(".equipe-services .hs-intro > p"), serviceCopy.eyebrow);
  setText(document.querySelector(".equipe-services .hs-intro > span"), serviceCopy.intro);
  window.lucide?.createIcons();
}

initTeamContent().catch((error) => {
  console.error("Unable to apply Notre équipe content.", error);
});
