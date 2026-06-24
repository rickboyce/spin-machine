window.SpinMachine = (() => {
  const TEAM_STORAGE_KEY = "spin-machine-team-v2";
  const DEFAULT_TEAM_SIZE = 6;
  const teamPalette = ["#ef4444", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#eab308"];
  const wordLeft = ["Cosmic", "Velvet", "Turbo", "Lucky", "Neon", "Brave", "Jolly", "Mighty", "Zesty", "Sparkle", "Fizzy", "Golden", "Pixel", "Nimble", "Sunny", "Daring"];
  const wordRight = ["Pancake", "Comet", "Pickle", "Wizard", "Rocket", "Muffin", "Socks", "Noodle", "Badger", "Button", "Waffle", "Beacon", "Disco", "Banjo", "Taco", "Crumpet"];
  const state = {
    context: null,
    muted: false,
    playingLoop: false
  };

  function initAudio() {
    if (!state.context) {
      state.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.context.state === "suspended") {
      state.context.resume();
    }
    return state.context;
  }

  function setMuted(muted) {
    state.muted = muted;
    if (muted) state.playingLoop = false;
    return state.muted;
  }

  function beep(freq = 440, type = "sine", duration = 0.1, volume = 0.06) {
    if (state.muted) return;
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function fanfare(notes = [523.25, 659.25, 783.99, 1046.5]) {
    notes.forEach((freq, index) => {
      setTimeout(() => beep(freq, "triangle", 0.35, 0.06), index * 90);
    });
  }

  function startLoop(durationMs) {
    if (state.muted) return;
    const ctx = initAudio();
    const notes = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
    const start = ctx.currentTime;
    const total = durationMs / 1000;
    let index = 0;
    state.playingLoop = true;

    function schedule() {
      if (!state.playingLoop || state.muted) return;
      const elapsed = ctx.currentTime - start;
      if (elapsed >= total) {
        state.playingLoop = false;
        return;
      }
      const progress = elapsed / total;
      const interval = 0.08 + progress * 0.22;
      beep(notes[index % notes.length] * (1 - progress * 0.15), "sine", Math.max(0.04, interval - 0.01), 0.03);
      index += 1;
      setTimeout(schedule, interval * 1000);
    }

    schedule();
  }

  function stopLoop() {
    state.playingLoop = false;
  }

  function qs(id) {
    return document.getElementById(id);
  }

  function timeLabel(date = new Date()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function randomWordPair(usedPairs = new Set()) {
    const maxAttempts = wordLeft.length * wordRight.length;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const left = wordLeft[Math.floor(Math.random() * wordLeft.length)];
      const right = wordRight[Math.floor(Math.random() * wordRight.length)];
      const pair = `${left} ${right}`;
      if (!usedPairs.has(pair)) {
        usedPairs.add(pair);
        return pair;
      }
    }

    const left = wordLeft[usedPairs.size % wordLeft.length];
    const right = wordRight[Math.floor(usedPairs.size / wordLeft.length) % wordRight.length];
    return `${left} ${right}`;
  }

  function teamMember(index, usedPairs = new Set()) {
    const pairs = usedPairs instanceof Set ? usedPairs : new Set();
    const name = randomWordPair(pairs);
    return {
      id: `${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      color: teamPalette[index % teamPalette.length],
      active: true,
      included: true
    };
  }

  function defaultTeam() {
    const usedPairs = new Set();
    return Array.from({ length: DEFAULT_TEAM_SIZE }, (_, index) => teamMember(index, usedPairs));
  }

  function normalizeTeam(rawTeam) {
    if (!Array.isArray(rawTeam) || rawTeam.length === 0) {
      return defaultTeam();
    }

    return rawTeam.map((person, index) => {
      if (typeof person === "string") return { ...teamMember(index), name: person };
      const fallback = teamMember(index);
      return {
        id: person.id || fallback.id,
        name: String(person.name || person.wordPair || fallback.name).trim() || fallback.name,
        color: person.color || teamPalette[index % teamPalette.length],
        active: person.active !== false,
        included: person.included !== false
      };
    });
  }

  function getTeam() {
    try {
      return normalizeTeam(JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY)));
    } catch (error) {
      return normalizeTeam();
    }
  }

  function saveTeam(team) {
    const normalized = normalizeTeam(team);
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function resizeTeam(size, currentTeam = getTeam()) {
    const count = Math.max(1, Math.min(24, Number(size) || DEFAULT_TEAM_SIZE));
    const normalized = normalizeTeam(currentTeam);
    const included = normalized.filter((person) => person.included);
    if (included.length >= count) {
      let remaining = count;
      return saveTeam(normalized.map((person) => {
        if (!person.included) return person;
        remaining -= 1;
        return { ...person, included: remaining >= 0 };
      }));
    }

    const usedPairs = new Set();
    normalized.forEach((person) => usedPairs.add(person.name));
    let needed = count - included.length;
    const restored = normalized.map((person) => {
      if (person.included || needed <= 0) return person;
      needed -= 1;
      return { ...person, included: true };
    });
    const additions = Array.from({ length: needed }, (_, index) => teamMember(restored.length + index, usedPairs));
    return saveTeam([...restored, ...additions]);
  }

  function capsuleSvg(color, size = 45) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M25 5C13.95 5 5 13.95 5 25C5 26.5 5.5 28 6.5 29.5L25 25L43.5 29.5C44.5 28 45 26.5 45 25C45 13.95 36.05 5 25 5Z" fill="${color}"/>
        <path d="M25 45C36.05 45 45 36.05 45 25L25 25L5 25C5 36.05 13.95 45 25 45Z" fill="#cbd5e1"/>
        <circle cx="25" cy="25" r="4" fill="white"/>
      </svg>
    `;
  }

  return {
    beep,
    capsuleSvg,
    fanfare,
    getTeam,
    initAudio,
    isMuted: () => state.muted,
    qs,
    resizeTeam,
    saveTeam,
    setMuted,
    startLoop,
    stopLoop,
    timeLabel
  };
})();
