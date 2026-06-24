(() => {
  const { beep, fanfare, initAudio, qs, setMuted } = window.SpinMachine;
  const capsuleColors = ["#ef4444", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  const votes = [
    { id: "hype", label: "Spicy Topic", icon: "🔥", color: "text-indigo-400" },
    { id: "cozy", label: "Relatable", icon: "☕", color: "text-purple-400" },
    { id: "laugh", label: "Pure Gold", icon: "😂", color: "text-pink-400" },
    { id: "spooky", label: "Uh Oh", icon: "👀", color: "text-amber-400" }
  ];

  let themes = [
    { id: 1, title: "Driving Mishaps", category: "On the Road", icon: "🚗", prompt: "What is your worst driving mishap, speeding ticket story, or spectacular parking disaster?", helpers: ["Speeding tickets", "Parallel parking fails", "Road trip drama", "Driving test nightmares"] },
    { id: 2, title: "The Great Lie", category: "Confessions", icon: "🤫", prompt: "What ridiculous lie did you tell that you got away with, or got spectacularly busted for?", helpers: ["Fake illness", "Blaming siblings", "Homework excuses", "Faking hobbies"] },
    { id: 3, title: "Worst Job Ever", category: "Career Stories", icon: "💼", prompt: "What is the absolute worst, weirdest, or most soul-crushing job you've ever had?", helpers: ["Awful uniforms", "Horrible bosses", "Odd tasks", "Fast food disasters"] },
    { id: 4, title: "Fashion Crimes", category: "Teenage Years", icon: "👕", prompt: "What was your worst fashion phase, haircut choice, or trend you once thought was peak cool?", helpers: ["Emo phases", "DIY hair dye", "Old trends", "School photos"] },
    { id: 5, title: "Dumb Injuries", category: "Blunders", icon: "🤕", prompt: "What is the dumbest or most embarrassing way you have ever managed to injure yourself?", helpers: ["Stubbed toes", "Kitchen accidents", "Silly dares", "Tripping over nothing"] },
    { id: 6, title: "Awkward Encounters", category: "Confessions", icon: "😬", prompt: "Share a time you put your foot in your mouth, waved at a stranger, or forgot someone's name.", helpers: ["Accidental texts", "Awkward handshakes", "Mistaken identity", "Forgotten names"] },
    { id: 7, title: "School Trouble", category: "School Days", icon: "🏫", prompt: "What is the closest you ever got to getting suspended, expelled, or seriously grounded?", helpers: ["Class pranks", "Sneaking out", "Forged report cards", "Caught passing notes"] },
    { id: 8, title: "Purchasing Regrets", category: "Blunders", icon: "🛒", prompt: "What is the most useless, expensive, or absurd thing you bought on impulse?", helpers: ["Unused gadgets", "Gym equipment", "Collector items", "Regrettable clothes"] },
    { id: 9, title: "DIY Disasters", category: "Blunders", icon: "🔨", prompt: "What did you try to fix yourself that immediately became much worse?", helpers: ["Furniture assembly", "Leaks", "Superglue accidents", "Laptop repairs"] },
    { id: 10, title: "Kitchen Nightmares", category: "Confessions", icon: "🔥", prompt: "What is the worst meal you cooked, or the weirdest food combination you secretly enjoy?", helpers: ["Burnt dinners", "Polite swallowing", "Odd cravings", "Recipe experiments"] }
  ];

  let spinHistory = [];
  let isSpinning = false;
  let selectedTheme = null;
  let customVotes = { hype: 0, cozy: 0, laugh: 0, spooky: 0 };
  let timerInterval = null;
  let totalSeconds = 120;
  let timerRunning = false;

  function capsuleSvg(color, size = 45) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 5C13.95 5 5 13.95 5 25C5 26.5 5.5 28 6.5 29.5L25 25L43.5 29.5C44.5 28 45 26.5 45 25C45 13.95 36.05 5 25 5Z" fill="${color}"/>
        <path d="M25 45C36.05 45 45 36.05 45 25L25 25L5 25C5 36.05 13.95 45 25 45Z" fill="#cbd5e1"/>
        <circle cx="25" cy="25" r="4" fill="white"/>
      </svg>
    `;
  }

  function renderCapsules() {
    qs("capsules-chamber").innerHTML = capsuleColors.map((color, index) => {
      const animation = ["animate-float-slow", "animate-float-delayed", "animate-float-fast"][index % 3];
      return `<div class="${animation} capsule-glow cursor-pointer transition-transform duration-150 hover:scale-110">${capsuleSvg(color, 40 + index)}</div>`;
    }).join("");
    qs("dispatched-capsule").innerHTML = capsuleSvg("#ec4899");
  }

  function loadThemeList() {
    qs("theme-count").innerText = themes.length;
    qs("theme-list-count").innerText = themes.length;
    qs("theme-list").innerHTML = themes.map((theme) => `
      <div class="flex items-start justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-800 p-4">
        <div class="flex-1">
          <div class="mb-1 flex items-center space-x-2">
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-400">${theme.category}</span>
            <span class="text-xs font-bold text-slate-300">${theme.icon} ${theme.title}</span>
          </div>
          <p class="mb-2 text-[11px] leading-normal text-slate-200">"${theme.prompt}"</p>
          <div class="flex flex-wrap gap-1">${theme.helpers.map((helper) => `<span class="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-300">${helper}</span>`).join("")}</div>
        </div>
        <button data-delete-theme="${theme.id}" class="rounded p-1 text-red-400 transition hover:bg-red-500/10 hover:text-red-300" title="Delete theme">×</button>
      </div>
    `).join("");
  }

  function toggleThemeManager() {
    qs("theme-manager-panel").classList.toggle("translate-x-full");
    qs("overlay-backdrop").classList.toggle("hidden");
    loadThemeList();
    beep(330, "sine", 0.1);
  }

  function addCustomTheme() {
    const title = qs("new-title").value.trim();
    const prompt = qs("new-prompt").value.trim();
    if (!title || !prompt) {
      showToast("Title and prompt details are required.", "bg-red-600 border-red-500");
      beep(220, "sawtooth", 0.2);
      return;
    }
    themes.push({
      id: Date.now(),
      title,
      category: qs("new-category").value,
      icon: qs("new-icon").value,
      prompt,
      helpers: qs("new-helpers").value.split(",").map((item) => item.trim()).filter(Boolean)
    });
    if (!themes.at(-1).helpers.length) themes.at(-1).helpers = ["My experience", "How it felt", "What went wrong"];
    ["new-title", "new-prompt", "new-helpers"].forEach((id) => { qs(id).value = ""; });
    loadThemeList();
    showToast("Successfully added new storytelling theme.", "bg-emerald-600 border-emerald-500");
    beep(523, "triangle", 0.15);
  }

  function showToast(message, classes) {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-6 right-6 z-50 rounded-xl border-2 px-6 py-4 text-sm font-semibold text-white shadow-lg ${classes}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function triggerLuckyDip() {
    if (isSpinning) return;
    initAudio();
    isSpinning = true;
    qs("card-placeholder").classList.remove("hidden");
    qs("vibe-card").classList.add("hidden");
    qs("vibe-card").classList.remove("flex");
    qs("dispenser-door").style.transform = "";
    qs("dip-button").classList.add("pointer-events-none", "opacity-50");
    qs("machine").classList.add("animate-shake");
    qs("machine-glow").classList.add("bg-pink-500/40", "neon-glow-accent");

    const spinBeepInterval = setInterval(() => beep(Math.floor(Math.random() * 400) + 200, "triangle", 0.05, 0.05), 100);

    setTimeout(() => {
      clearInterval(spinBeepInterval);
      selectedTheme = themes[Math.floor(Math.random() * themes.length)];
      qs("machine").classList.remove("animate-shake");
      qs("machine-glow").classList.remove("bg-pink-500/40", "neon-glow-accent");
      qs("machine-glow").classList.add("bg-emerald-500/20", "neon-glow-primary");
      qs("dispenser-door").style.transform = "rotateX(-90deg) scaleY(0.1)";
      qs("dispatched-capsule").innerHTML = capsuleSvg(capsuleColors[Math.floor(Math.random() * capsuleColors.length)]);
      qs("dispatched-capsule").classList.remove("hidden");
      beep(180, "sine", 0.2);

      setTimeout(revealTheme, 400);
    }, 1800);
  }

  function revealTheme() {
    qs("card-placeholder").classList.add("hidden");
    qs("vibe-card").classList.remove("hidden");
    qs("vibe-card").classList.add("flex");
    qs("vibe-card").classList.add("animate-ticket-shoot");
    qs("theme-title").innerText = selectedTheme.title;
    qs("theme-category").innerText = selectedTheme.category;
    qs("theme-prompt").innerText = `"${selectedTheme.prompt}"`;
    qs("theme-icon").innerText = selectedTheme.icon || "★";
    qs("theme-helpers").innerHTML = selectedTheme.helpers.map((helper) => `<span class="rounded-full border border-slate-700/60 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">${helper}</span>`).join("");
    customVotes = { hype: 0, cozy: 0, laugh: 0, spooky: 0 };
    updateVotesUI();
    resetTimer();
    triggerConfetti();
    fanfare();
    if (!spinHistory.includes(selectedTheme.title)) {
      spinHistory.unshift(selectedTheme.title);
      if (spinHistory.length > 3) spinHistory.pop();
      updateHistoryUI();
    }
    qs("dip-button").classList.remove("pointer-events-none", "opacity-50");
    isSpinning = false;
  }

  function renderVotes() {
    qs("vote-grid").innerHTML = votes.map((vote) => `
      <button data-vote="${vote.id}" class="group flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-3 transition hover:border-indigo-500/40 hover:bg-indigo-950/40">
        <span class="mb-1 text-2xl transition-transform duration-150 group-hover:scale-125">${vote.icon}</span>
        <span class="text-center text-[10px] font-bold uppercase text-slate-400">${vote.label}</span>
        <span id="vote-count-${vote.id}" class="mt-1 text-xs font-bold ${vote.color}">0</span>
      </button>
    `).join("");
  }

  function castVote(type) {
    customVotes[type] += 1;
    updateVotesUI();
    beep({ hype: 600, cozy: 450, laugh: 550, spooky: 300 }[type], "sine", 0.1);
  }

  function updateVotesUI() {
    votes.forEach((vote) => {
      qs(`vote-count-${vote.id}`).innerText = customVotes[vote.id];
    });
  }

  function updateHistoryUI() {
    const wrapper = qs("spin-history");
    wrapper.classList.remove("hidden");
    wrapper.classList.add("flex");
    qs("history-container").innerHTML = spinHistory.map((title) => `<span class="max-w-[120px] truncate rounded-lg border border-slate-700/50 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-400">${title}</span>`).join("");
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    qs("timer-display").innerText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function adjustTimer(change) {
    if (timerRunning) return;
    totalSeconds = Math.max(15, totalSeconds + change);
    updateTimerDisplay();
    beep(350, "sine", 0.05);
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      qs("timer-btn").innerText = "▶ Resume";
      qs("timer-btn").className = "flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500";
      beep(300, "sine", 0.1);
      return;
    }
    timerRunning = true;
    qs("timer-btn").innerText = "⏸ Pause";
    qs("timer-btn").className = "flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500";
    timerInterval = setInterval(() => {
      if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        fanfare([523.25, 659.25, 783.99, 523.25, 659.25, 783.99]);
        resetTimer();
      } else {
        totalSeconds -= 1;
        updateTimerDisplay();
        if (totalSeconds <= 5) beep(880, "sine", 0.1);
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    totalSeconds = 120;
    updateTimerDisplay();
    qs("timer-btn").innerText = "▶ Start";
    qs("timer-btn").className = "flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500";
  }

  const canvas = qs("confetti-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function triggerConfetti() {
    particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 20,
      size: Math.random() * 8 + 4,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      speedX: Math.random() * 6 - 3,
      speedY: -Math.random() * 12 - 8,
      gravity: 0.25,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 4 - 2,
      opacity: 1
    }));
    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((particle) => particle.opacity > 0 && particle.y < canvas.height + 50);
    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.speedY += particle.gravity;
      particle.rotation += particle.rotationSpeed;
      if (particle.y > canvas.height) particle.opacity -= 0.02;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    });
    if (particles.length > 0) requestAnimationFrame(animateConfetti);
  }

  function toggleMute() {
    const muted = setMuted(!window.SpinMachine.isMuted());
    qs("sound-icon").innerText = muted ? "🔇" : "🔊";
    qs("sound-text").innerText = muted ? "Sound Off" : "Sound On";
  }

  renderCapsules();
  renderVotes();
  loadThemeList();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  qs("dip-button").addEventListener("click", triggerLuckyDip);
  qs("sound-toggle").addEventListener("click", toggleMute);
  qs("theme-manager-toggle").addEventListener("click", toggleThemeManager);
  qs("theme-manager-close").addEventListener("click", toggleThemeManager);
  qs("overlay-backdrop").addEventListener("click", toggleThemeManager);
  qs("add-theme-btn").addEventListener("click", addCustomTheme);
  qs("timer-minus").addEventListener("click", () => adjustTimer(-15));
  qs("timer-plus").addEventListener("click", () => adjustTimer(15));
  qs("timer-btn").addEventListener("click", toggleTimer);
  qs("vote-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-vote]");
    if (button) castVote(button.dataset.vote);
  });
  qs("theme-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-theme]");
    if (!button || themes.length <= 1) return;
    themes = themes.filter((theme) => theme.id !== Number(button.dataset.deleteTheme));
    loadThemeList();
    beep(290, "sine", 0.15);
  });
})();
