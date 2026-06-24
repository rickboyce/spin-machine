window.SpinMachine = (() => {
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

  return {
    beep,
    fanfare,
    initAudio,
    isMuted: () => state.muted,
    qs,
    setMuted,
    startLoop,
    stopLoop,
    timeLabel
  };
})();
