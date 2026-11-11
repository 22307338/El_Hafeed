const teamMissions = {
  coordinatrice: {
    name: "L’infirmière coordinatrice",
    role: "Coordination de l’accompagnement",
    pole: "Coordination des soins",
    points: [
      "Elle assure la coordination de l’accompagnement et veille à sa cohérence.",
      "Elle travaille en lien avec les professionnels de l’équipe, les familles et les médecins.",
    ],
  },
  "aides-soignants": {
    name: "Nos aides-soignants à domicile",
    role: "Accompagnement au quotidien",
    pole: "Vie quotidienne et autonomie",
    points: [
      "Ils accompagnent la toilette, l’hygiène, les repas et les déplacements.",
      "Ils accompagnent les sorties et les activités de stimulation tout en favorisant le maintien de l’autonomie.",
    ],
  },
  psychologue: {
    name: "La psychologue",
    role: "Soutien psychologique",
    pole: "Écoute et soutien",
    points: [
      "Elle accompagne les difficultés psychologiques liées au vieillissement, aux maladies neurodégénératives et aux troubles du comportement.",
      "Elle apporte également un soutien aux familles et aux équipes.",
    ],
  },
  orthophoniste: {
    name: "L’orthophoniste",
    role: "Communication et déglutition",
    pole: "Langage et capacités cognitives",
    points: [
      "Elle intervient pour préserver les fonctions de communication, le langage et les capacités cognitives.",
      "Elle participe à la prévention et à l’accompagnement des troubles de la déglutition.",
    ],
  },
  kinesitherapeute: {
    name: "La kinésithérapeute",
    role: "Mobilité et capacités motrices",
    pole: "Mouvement et autonomie",
    points: [
      "Elle contribue au maintien des capacités motrices, de la mobilité et de la force musculaire.",
      "Elle agit afin de préserver le mouvement et l’autonomie.",
    ],
  },
  nutritionniste: {
    name: "La nutritionniste",
    role: "Équilibre nutritionnel",
    pole: "Nutrition et santé",
    points: [
      "Elle évalue les besoins nutritionnels.",
      "Elle adapte les apports alimentaires à l’état de santé et à l’évolution des besoins de votre proche.",
    ],
  },
  psychomotricienne: {
    name: "La psychomotricienne",
    role: "Équilibre et sensorialité",
    pole: "Corps et coordination",
    points: [
      "Elle travaille l’équilibre, la coordination, la perception du corps et la sensorialité.",
      "Elle mobilise les capacités motrices et cognitives de la personne.",
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
