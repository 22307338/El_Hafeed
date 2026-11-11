const teamMissions = {
  coordinatrice: {
    name: "Infirmière coordinatrice",
    pole: "Coordination des soins",
    description: "Elle assure la coordination de l’accompagnement et veille à sa cohérence, en lien avec les professionnels de l’équipe, les familles et les médecins.",
    points: [
      "Veiller à la cohérence de l’accompagnement.",
      "Faire le lien entre l’équipe, les familles et les médecins.",
    ],
  },
  "aides-soignants": {
    name: "Aides-soignants, infirmiers auxiliaires et infirmiers polyvalents",
    pole: "Soins et autonomie",
    description: "Ils accompagnent votre proche dans les actes essentiels de la vie quotidienne : toilette, hygiène, repas, déplacements, sorties et activités de stimulation, tout en favorisant le maintien de son autonomie.",
    points: [
      "Accompagner la toilette, l’hygiène, les repas et les déplacements.",
      "Proposer sorties et activités qui soutiennent l’autonomie.",
    ],
  },
  psychologue: {
    name: "Psychologue clinicienne",
    pole: "Écoute et soutien",
    description: "Elle accompagne les personnes confrontées aux difficultés psychologiques liées au vieillissement, aux maladies neurodégénératives et aux troubles du comportement. Elle apporte également un soutien aux familles et aux équipes.",
    points: [
      "Accompagner les difficultés liées au vieillissement et aux troubles du comportement.",
      "Soutenir les familles et les équipes.",
    ],
  },
  orthophoniste: {
    name: "Orthophoniste",
    pole: "Langage et capacités cognitives",
    description: "Elle intervient dans la préservation des fonctions de communication, du langage et des capacités cognitives, ainsi que dans la prévention et l’accompagnement des troubles de la déglutition.",
    points: [
      "Préserver la communication, le langage et les capacités cognitives.",
      "Prévenir et accompagner les troubles de la déglutition.",
    ],
  },
  kinesitherapeute: {
    name: "Kinésithérapeutes",
    pole: "Mouvement et autonomie",
    description: "Leur accompagnement contribue au maintien des capacités motrices, de la mobilité et de la force musculaire afin de préserver le mouvement et l’autonomie.",
    points: [
      "Maintenir les capacités motrices, la mobilité et la force musculaire.",
      "Préserver le mouvement et l’autonomie.",
    ],
  },
  nutritionniste: {
    name: "Nutritionniste",
    pole: "Nutrition et santé",
    description: "Elle évalue les besoins nutritionnels et adapte les apports alimentaires à l’état de santé et à l’évolution des besoins de votre proche.",
    points: [
      "Évaluer les besoins nutritionnels.",
      "Adapter les apports à l’état de santé et à son évolution.",
    ],
  },
  psychomotricienne: {
    name: "Psychomotricienne",
    pole: "Corps et coordination",
    description: "Elle travaille sur l’équilibre, la coordination, la perception du corps et la sensorialité, en mobilisant les capacités motrices et cognitives de la personne.",
    points: [
      "Travailler l’équilibre, la coordination et la perception du corps.",
      "Mobiliser les capacités motrices et cognitives.",
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
  document.getElementById("team-mission-description").textContent = member.description || "";
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
