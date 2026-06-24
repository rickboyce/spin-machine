(() => {
  const { capsuleSvg, getTeam, qs, resizeTeam, saveTeam } = window.SpinMachine;

  let team = getTeam();

  function persist(nextTeam = team) {
    team = saveTeam(nextTeam);
    renderTeam();
  }

  function renderTeam() {
    const includedTeam = team.filter((person) => person.included);
    const activeCount = includedTeam.filter((person) => person.active).length;
    qs("homeTeamCount").innerText = `${activeCount}/${includedTeam.length} attending`;
    qs("quickTeamSize").value = includedTeam.length;
    qs("homeTeamList").innerHTML = "";

    includedTeam.forEach((person) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `team-person ${person.active ? "" : "is-inactive"}`;
      item.setAttribute("aria-label", `${person.active ? "Deselect" : "Select"} ${person.name}`);
      item.addEventListener("click", () => {
        persist(team.map((candidate) => (
          candidate.id === person.id ? { ...candidate, active: !candidate.active } : candidate
        )));
      });

      const ball = document.createElement("span");
      ball.className = "team-ball";
      ball.innerHTML = capsuleSvg(person.color, 42);

      const pill = document.createElement("span");
      pill.className = "team-pill";

      const input = document.createElement("input");
      input.className = "team-name-input";
      input.value = person.name;
      input.setAttribute("aria-label", `Name for team member ${person.name}`);
      input.addEventListener("click", (event) => event.stopPropagation());
      input.addEventListener("input", () => {
        team = team.map((candidate) => (
          candidate.id === person.id ? { ...candidate, name: input.value } : candidate
        ));
        saveTeam(team);
      });
      input.addEventListener("blur", () => {
        const fallbackName = person.name;
        persist(team.map((candidate) => (
          candidate.id === person.id ? { ...candidate, name: input.value.trim() || fallbackName } : candidate
        )));
      });

      const state = document.createElement("span");
      state.className = "team-presence";
      state.innerText = person.active ? "In" : "Out";

      pill.append(input, state);
      item.append(ball, pill);
      qs("homeTeamList").appendChild(item);
    });
  }

  qs("quickTeamBtn").addEventListener("click", () => {
    team = resizeTeam(qs("quickTeamSize").value, team);
    renderTeam();
  });

  qs("selectAllTeamBtn").addEventListener("click", () => {
    persist(team.map((person) => ({ ...person, active: person.included ? true : person.active })));
  });

  qs("deselectAllTeamBtn").addEventListener("click", () => {
    persist(team.map((person) => ({ ...person, active: person.included ? false : person.active })));
  });

  renderTeam();
})();
