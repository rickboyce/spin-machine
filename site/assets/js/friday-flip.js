(() => {
  const { beep, capsuleSvg, fanfare, getTeam, initAudio, qs, saveTeam, setMuted, startLoop, stopLoop, timeLabel, weightedChoice } = window.SpinMachine;
  const categories = [
    { short: "Client HL", full: "Highlight of the Week on Client", icon: "🤝" },
    { short: "Pipeline HL", full: "Highlight of the Week on Pipeline", icon: "🚀" },
    { short: "Personal HL", full: "Highlight of the Week in Personal Life", icon: "🌟" },
    { short: "Lowlight", full: "Lowlight of the Week", icon: "📉" },
    { short: "Weekend Plans", full: "Plans for the Weekend", icon: "🏖️" },
    { short: "Key Lesson", full: "Key Lesson Learned this Week", icon: "🧠" },
    { short: "Media: Work", full: "Work-related Media Recommendation", icon: "🛠️" },
    { short: "Media: Life", full: "Life-related Media Recommendation", icon: "🍕" }
  ];
  const palette = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#fbbf24"];
  const fallbackQuestions = [
    "What tiny detail made that stand out more than the average weekly update?",
    "What would you do differently if the same situation showed up next Friday?",
    "What did this teach you that the rest of the team should steal immediately?",
    "What part of that story deserves a second look because it was quietly important?"
  ];

  let savedTeam = getTeam();
  let team = savedTeam.filter((person) => person.included);
  let activeTeam = team.filter((person) => person.active);
  let rotation = 0;
  let isSpinning = false;
  let lastResult = { personId: null, name: null, category: null, fullCategory: null };
  let spinHistory = [];
  let acceptedTurns = 0;
  const speakerStats = new Map(team.map((person) => [person.id, { spoken: 0, lastTurn: null }]));
  const categoryStats = new Map(categories.map((category) => [category.short, { landed: 0, lastSpin: null }]));
  let categorySpins = 0;

  function turnsSince(lastTurn, currentTurn) {
    return lastTurn === null ? Infinity : currentTurn - lastTurn;
  }

  function selectSpeaker() {
    return weightedChoice(activeTeam, (person) => {
      const stats = speakerStats.get(person.id) || { spoken: 0, lastTurn: null };
      const since = turnsSince(stats.lastTurn, acceptedTurns);
      const freshness = stats.lastTurn === null ? 3 : Math.min(3, 0.7 + since * 0.45);
      const underrepresented = 1 / (1 + stats.spoken);
      const cooldown = since <= 1 ? 0.12 : since === 2 ? 0.45 : 1;

      return freshness * underrepresented * cooldown;
    });
  }

  function selectCategory() {
    return weightedChoice(categories, (category) => {
      const stats = categoryStats.get(category.short) || { landed: 0, lastSpin: null };
      const since = turnsSince(stats.lastSpin, categorySpins);
      const freshness = stats.lastSpin === null ? 2 : Math.min(2.4, 0.65 + since * 0.35);
      const undercovered = 1 / (1 + stats.landed);
      const cooldown = since <= 1 ? 0.18 : since === 2 ? 0.55 : 1;

      return freshness * undercovered * cooldown;
    });
  }

  function targetRotationForCategory(category) {
    const segmentSize = 360 / categories.length;
    const index = categories.indexOf(category);
    const safeJitter = (Math.random() - 0.5) * segmentSize * 0.45;
    const desiredDeg = (360 - (index + 0.5) * segmentSize + safeJitter + 360) % 360;
    const currentDeg = ((rotation % 360) + 360) % 360;
    const delta = (desiredDeg - currentDeg + 360) % 360;

    return rotation + 1440 + Math.floor(Math.random() * 6) * 360 + delta;
  }

  function recordCategory(category) {
    const stats = categoryStats.get(category.short) || { landed: 0, lastSpin: null };
    stats.landed += 1;
    stats.lastSpin = categorySpins;
    categoryStats.set(category.short, stats);
  }

  function recordSpeaker(personId) {
    const stats = speakerStats.get(personId) || { spoken: 0, lastTurn: null };
    stats.spoken += 1;
    stats.lastTurn = acceptedTurns;
    speakerStats.set(personId, stats);
  }

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", x, y, "L", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
  }

  function renderWheel() {
    const wheelContent = qs("wheel-content");
    const angleStep = 360 / categories.length;
    wheelContent.innerHTML = "";

    categories.forEach((category, index) => {
      const startAngle = index * angleStep;
      const endAngle = (index + 1) * angleStep;
      const textAngle = startAngle + angleStep / 2;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", describeArc(250, 250, 240, startAngle, endAngle));
      path.setAttribute("fill", palette[index % palette.length]);
      path.setAttribute("stroke", "rgba(255,255,255,0.1)");
      wheelContent.appendChild(path);

      [
        { radius: 165, size: 13, value: category.short.toUpperCase(), weight: "800" },
        { radius: 215, size: 20, value: category.icon, weight: "400" }
      ].forEach((item) => {
        const pos = polarToCartesian(250, 250, item.radius, textAngle);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", pos.x);
        text.setAttribute("y", pos.y);
        text.setAttribute("fill", "white");
        text.setAttribute("font-size", item.size);
        text.setAttribute("font-weight", item.weight);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("transform", `rotate(${textAngle}, ${pos.x}, ${pos.y})`);
        text.textContent = item.value;
        wheelContent.appendChild(text);
      });
    });
  }

  function renderTeam() {
    qs("teamGrid").innerHTML = "";
    qs("teamCount").innerText = `${activeTeam.length}/${team.length} Present`;
    team.forEach((person) => {
      const isActive = activeTeam.some((candidate) => candidate.id === person.id);
      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = `team-person w-full text-left ${isActive ? "" : "is-inactive"}`;
      badge.setAttribute("aria-label", `${isActive ? "Deselect" : "Select"} ${person.name}`);

      const ball = document.createElement("span");
      ball.className = "team-ball";
      ball.innerHTML = capsuleSvg(person.color, 38);

      const pill = document.createElement("span");
      pill.className = "team-pill";

      const name = document.createElement("span");
      name.className = "team-name-label";
      name.innerText = person.name;

      const state = document.createElement("span");
      state.className = "team-presence";
      state.innerText = isActive ? "In" : "Out";

      pill.append(name, state);
      badge.append(ball, pill);
      badge.addEventListener("click", () => {
        if (isSpinning) return;
        savedTeam = saveTeam(savedTeam.map((candidate) => (
          candidate.id === person.id ? { ...candidate, active: !isActive } : candidate
        )));
        team = savedTeam.filter((candidate) => candidate.included);
        activeTeam = team.filter((candidate) => candidate.active);
        renderTeam();
        updateSpinButtonState();
      });
      qs("teamGrid").appendChild(badge);
    });
  }

  function updateSpinButtonState() {
    const spinBtn = qs("spinBtn");
    if (activeTeam.length === 0) {
      spinBtn.disabled = true;
      qs("aiCommentary").innerText = "Hold up. Mark at least one team member present before spinning.";
      return;
    }
    if (!isSpinning) {
      spinBtn.disabled = false;
      qs("aiCommentary").innerText = "Ready to wrap up the week? Give the wheel a whirl and let's see who's carrying the torch.";
    }
  }

  function animateWheelTicks(startRot, targetRot, durationMs) {
    const startTime = performance.now();
    let lastTickedRot = startRot;
    const segmentSize = 360 / categories.length;

    function update() {
      if (!isSpinning) return;
      const progress = Math.min((performance.now() - startTime) / durationMs, 1);
      const ease = 3 * (1 - progress) * (1 - progress) * progress * 0.15 + 3 * (1 - progress) * progress * progress * 0.85 + progress ** 3;
      const currentRot = startRot + (targetRot - startRot) * ease;
      if (Math.abs(currentRot - lastTickedRot) >= segmentSize) {
        beep(520, "triangle", 0.04, 0.045);
        lastTickedRot = currentRot;
      }
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function showResult(name, category) {
    qs("resultName").innerText = name;
    qs("resultCategory").innerText = category.full;
    qs("resultCard").classList.remove("hidden");
    qs("aiCommentary").innerText = `${name} has been chosen for ${category.short}. The floor is yours.`;
    setTimeout(() => qs("resultCard").scrollIntoView({ behavior: "smooth", block: "center" }), 200);
  }

  function spin() {
    if (isSpinning || activeTeam.length === 0) return;
    initAudio();
    isSpinning = true;
    qs("spinBtn").disabled = true;
    qs("resultCard").classList.add("hidden");
    qs("nominationPanel").classList.add("hidden");
    qs("aiPromptArea").classList.add("hidden");

    const durationMs = 5000;
    const chosenCategory = selectCategory();
    const targetRotation = targetRotationForCategory(chosenCategory);
    animateWheelTicks(rotation, targetRotation, durationMs);
    startLoop(durationMs);
    rotation = targetRotation;
    qs("wheel-svg").style.transform = `rotate(${rotation}deg)`;
    qs("aiCommentary").innerText = "The wheel is deciding the fate of the team...";

    setTimeout(() => {
      isSpinning = false;
      stopLoop();
      fanfare();
      const actualDeg = rotation % 360;
      const index = Math.floor(((360 - actualDeg) % 360) / (360 / categories.length));
      const category = categories[index] || chosenCategory;
      const winner = selectSpeaker();
      categorySpins += 1;
      recordCategory(category);
      lastResult = { personId: winner.id, name: winner.name, category: category.short, fullCategory: category.full };
      showResult(winner.name, category);
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: palette });
      }
    }, durationMs);
  }

  function toggleNomination() {
    qs("resultCard").classList.toggle("hidden");
    qs("nominationPanel").classList.toggle("hidden");
    const list = qs("nomineeList");
    list.innerHTML = "";
    activeTeam.filter((person) => person.name !== lastResult.name).forEach((person) => {
      const button = document.createElement("button");
      button.className = "rounded-xl border-2 border-slate-100 bg-white p-3 text-sm font-bold transition-all hover:border-indigo-500 hover:text-indigo-600";
      button.innerText = person.name;
      button.addEventListener("click", () => {
        lastResult.personId = person.id;
        lastResult.name = person.name;
        showResult(person.name, { short: lastResult.category, full: lastResult.fullCategory });
        qs("nominationPanel").classList.add("hidden");
      });
      list.appendChild(button);
    });
    if (activeTeam.length <= 1) {
      list.innerHTML = "<p class='col-span-2 py-2 text-center text-xs italic text-red-400'>Nobody else is present to nominate.</p>";
    }
  }

  function acceptTurn() {
    acceptedTurns += 1;
    recordSpeaker(lastResult.personId || lastResult.name);
    spinHistory.unshift({ name: lastResult.name, category: lastResult.category, time: timeLabel() });
    updateHistory();
    qs("resultCard").classList.add("hidden");
    qs("spinBtn").disabled = false;
    qs("aiCommentary").innerText = `Excellent response from ${lastResult.name}. Who is next?`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateHistory() {
    if (spinHistory.length === 0) return;
    qs("historyLog").innerHTML = spinHistory.map((item) => `
      <div class="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2">
        <span class="font-bold text-slate-700">${item.name}</span>
        <span class="text-[10px] font-medium italic text-indigo-500">${item.category}</span>
        <span class="text-slate-300">${item.time}</span>
      </div>
    `).join("");
  }

  function generateAiDeepDive() {
    qs("aiBtn").disabled = true;
    qs("aiBtn").innerHTML = "<span class='loader'></span>";
    setTimeout(() => {
      const question = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      qs("aiPromptText").innerText = `${lastResult.name}, ${question}`;
      qs("aiPromptArea").classList.remove("hidden");
      qs("aiBtn").disabled = false;
      qs("aiBtn").innerText = "Question Generated";
    }, 350);
  }

  function toggleMute() {
    const muted = setMuted(!window.SpinMachine.isMuted());
    qs("soundOnIcon").classList.toggle("hidden", muted);
    qs("soundOffIcon").classList.toggle("hidden", !muted);
  }

  renderWheel();
  renderTeam();
  updateSpinButtonState();
  qs("spinBtn").addEventListener("click", spin);
  qs("muteBtn").addEventListener("click", toggleMute);
  qs("acceptBtn").addEventListener("click", acceptTurn);
  qs("nominateBtn").addEventListener("click", toggleNomination);
  qs("cancelNominationBtn").addEventListener("click", toggleNomination);
  qs("aiBtn").addEventListener("click", generateAiDeepDive);
})();
