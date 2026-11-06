const teamMissions = {
  youssef: {
    name: "Équipe infirmière",
    role: "Infirmier Coordinateur Référent",
    pole: "Pôle Soins Médicaux",
    points: [
      "Suivi global de la santé et coordination des besoins médicaux et paramédicaux.",
      "Lien régulier avec les proches désignés et les professionnels concernés.",
      "Observation de l’état général et transmission des changements utiles à l’équipe.",
      "Organisation des sorties hebdomadaires avec l’orthophoniste lorsque le projet le prévoit.",
    ],
  },
  zahra: {
    name: "Kinésithérapie",
    role: "Kinésithérapeute à domicile & ergonomie",
    pole: "Pôle Rééducation",
    points: [
      "Évaluation de la mobilité et des capacités physiques de la personne.",
      "Accompagnement de l’équilibre et des déplacements selon les besoins évalués.",
      "Contribution à la prévention des chutes et à l’accompagnement des douleurs chroniques.",
      "Coordination avec l’équipe pour adapter les activités au rythme de la personne.",
    ],
  },
  amina: {
    name: "Orthophonie",
    role: "Orthophoniste spécialiste de la déglutition",
    pole: "Pôle Langage & Déglutition",
    points: [
      "Accompagnement de la communication et des exercices cognitifs adaptés.",
      "Contribution à la prévention des fausses routes selon les besoins évalués.",
      "Lien avec l’infirmier coordinateur pour intégrer les exercices au quotidien.",
      "Adaptation des propositions aux capacités et au rythme de la personne.",
    ],
  },
  leila: {
    name: "Psychologie",
    role: "Psychologue clinicienne & écoute des aidants",
    pole: "Pôle Soutien Émotionnel",
    points: [
      "Écoute des bouleversements psychiques liés à la perte d’autonomie et aux changements de vie.",
      "Soutien aux proches confrontés au sentiment d’impuissance ou à l’épuisement.",
      "Accompagnement des situations de refus de soins et des questions liées à l’identité.",
      "Temps d’analyse des pratiques pour soutenir les équipes, dans un cadre sans jugement.",
    ],
  },
  fatimazahra: {
    name: "Équipe aides-soignantes",
    role: "Accompagnement au quotidien",
    pole: "Soins et activités adaptés",
    points: [
      "Accompagnement de l’hygiène et du confort le matin.",
      "Aide à l’habillage et aux repas selon les habitudes de la personne.",
      "Activités cognitives adaptées au programme de l’après-midi.",
      "Lien avec l’orthophoniste pour intégrer les exercices au quotidien.",
    ],
  },
};

const missionDialog = document.getElementById("team-mission-modal");
const missionList = document.getElementById("team-mission-points");

window.toggleMissionModal = function (memberKey) {
  if (!missionDialog) return;

  if (!memberKey) {
    missionDialog.close();
    document
      .querySelectorAll(".team-member-mission-button[aria-expanded='true']")
      .forEach((button) => button.setAttribute("aria-expanded", "false"));
    return;
  }

  const member = window.teamMissionsData?.[memberKey] || teamMissions[memberKey];
  if (!member) return;

  document.getElementById("team-mission-pole").textContent = member.pole;
  document.getElementById("team-mission-title").textContent = member.name;
  document.getElementById("team-mission-role").textContent = member.role;
  missionList.replaceChildren(
    ...member.points.map((point) => {
      const item = document.createElement("li");
      const check = document.createElement("span");
      const text = document.createElement("span");
      check.className = "team-mission-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      text.textContent = point;
      item.append(check, text);
      return item;
    }),
  );

  document
    .querySelectorAll(".team-member-mission-button")
    .forEach((button) => button.setAttribute("aria-expanded", "false"));
  document
    .querySelector(`.team-member-card[data-member-key="${memberKey}"] .team-member-mission-button`)
    ?.setAttribute("aria-expanded", "true");

  if (!missionDialog.open) missionDialog.showModal();
};

missionDialog?.addEventListener("click", (event) => {
  if (event.target === missionDialog) window.toggleMissionModal();
});
missionDialog?.addEventListener("close", () => {
  document
    .querySelectorAll(".team-member-mission-button[aria-expanded='true']")
    .forEach((button) => button.setAttribute("aria-expanded", "false"));
});
