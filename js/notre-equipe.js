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

  const member = window.teamMissionsData?.[memberKey];
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
