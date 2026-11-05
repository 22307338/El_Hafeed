const teamMissions = {
  youssef: {
    name: "Youssef El Amrani",
    role: "Infirmier Coordinateur Référent",
    pole: "Pôle Soins Médicaux",
    points: [
      "Supervision des pansements complexes, perfusions et traitements chroniques.",
      "Interface constante avec le médecin traitant et le gériatre référent.",
      "Mise en place de piluliers sécurisés et vérification de l’observance thérapeutique.",
      "Alerte précoce en cas d’altération subtile des paramètres vitaux.",
    ],
  },
  zahra: {
    name: "Zahra Berrada",
    role: "Kinésithérapeute à domicile & ergonomie",
    pole: "Pôle Rééducation",
    points: [
      "Exercices de proprioception et d’équilibre doux pour prévenir le risque de chute.",
      "Maintien de l’amplitude articulaire chez les personnes alitées ou sédentaires.",
      "Recommandations d’aménagement du domicile : barres de maintien, tapis et éclairage.",
      "Transmission des gestes et postures sûrs aux auxiliaires de vie familiales.",
    ],
  },
  amina: {
    name: "Amina El Fassi",
    role: "Orthophoniste spécialiste de la déglutition",
    pole: "Pôle Langage & Déglutition",
    points: [
      "Bilan précis de la déglutition pour éviter les fausses routes et pneumopathies.",
      "Adaptation des textures alimentaires et des postures lors des repas.",
      "Rééducation de l’expression orale après un AVC ou dans les troubles neuro-évolutifs.",
      "Stimulation douce du vocabulaire et de la mémoire sémantique.",
    ],
  },
  leila: {
    name: "Dr. Leila Mansouri",
    role: "Psychologue clinicienne & écoute des aidants",
    pole: "Pôle Soutien Émotionnel",
    points: [
      "Entretiens de soutien auprès de l’aîné pour valoriser son vécu et rompre l’isolement.",
      "Accompagnement psychologique des enfants et conjoints aidants.",
      "Ateliers personnalisés de réminiscence et stimulation cognitive douce.",
      "Médiation bienveillante lors des étapes de dépendance accrue.",
    ],
  },
  fatimazahra: {
    name: "Fatima Zahra Cherkaoui",
    role: "Diététicienne clinique gériatrique",
    pole: "Pôle Nutrition & Vitalité",
    points: [
      "Évaluation précise du statut nutritionnel et calcul des apports protéiques.",
      "Élaboration de menus marocains traditionnels équilibrés et réconfortants.",
      "Gestion des régimes sans sel, du diabète et de l’hydratation.",
      "Coordination avec l’aide ménagère pour la préparation sereine des repas.",
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

  const member = teamMissions[memberKey];
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