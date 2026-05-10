(() => {
  "use strict";

  const CATEGORY_LABELS = {
    P: "Pessoa / Lugar / Animal",
    O: "Objeto",
    A: "Ação",
    D: "Difícil",
    L: "Lazer",
    T: "Todos jogam",
  };

  const screens = {
    home: document.getElementById("screen-home"),
    reveal: document.getElementById("screen-reveal"),
    timer: document.getElementById("screen-timer"),
    timeup: document.getElementById("screen-timeup"),
  };

  const els = {
    timerInput: document.getElementById("timer-input"),
    btnDraw: document.getElementById("btn-draw"),
    btnShowCard: document.getElementById("btn-show-card"),
    btnCancel: document.getElementById("btn-cancel"),
    btnStartTimer: document.getElementById("btn-start-timer"),
    btnRedraw: document.getElementById("btn-redraw"),
    btnStop: document.getElementById("btn-stop"),
    btnFinish: document.getElementById("btn-finish"),
    btnBackHome: document.getElementById("btn-back-home"),
    revealCover: document.querySelector(".reveal-cover"),
    revealCard: document.querySelector(".reveal-card"),
    cardCat: document.getElementById("card-cat"),
    cardCatLabel: document.getElementById("card-cat-label"),
    cardAllPlay: document.getElementById("card-allplay"),
    cardWord: document.getElementById("card-word"),
    timerCat: document.getElementById("timer-cat"),
    timerCatLabel: document.getElementById("timer-cat-label"),
    timerAllPlay: document.getElementById("timer-allplay"),
    timerWord: document.getElementById("timer-word"),
    timerDisplay: document.getElementById("timer-display"),
    timeupWord: document.getElementById("timeup-word"),
    wordCount: document.getElementById("word-count"),
    catCheckboxes: document.querySelectorAll('.categories input[type="checkbox"]'),
  };

  const state = {
    currentCard: null,
    recent: [], // ring buffer to avoid immediate repeats
    intervalId: null,
    endsAt: 0,
    audioCtx: null,
    durationSec: 60,
  };

  // ---------- Word selection ----------

  function activeCategories() {
    return Array.from(els.catCheckboxes)
      .filter((c) => c.checked)
      .map((c) => c.dataset.cat);
  }

  function pickCard() {
    const allowed = new Set(activeCategories());
    const pool = (window.MIMIC_WORDS || []).filter((w) => allowed.has(w.category));
    if (pool.length === 0) return null;

    const recentCap = Math.min(20, Math.floor(pool.length / 2));
    const filtered = pool.filter((w) => !state.recent.includes(w.word));
    const candidates = filtered.length > 0 ? filtered : pool;

    const card = candidates[Math.floor(Math.random() * candidates.length)];
    state.recent.push(card.word);
    if (state.recent.length > recentCap) state.recent.shift();
    return card;
  }

  // ---------- Screen routing ----------

  function show(screenName) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[screenName].classList.add("active");
  }

  function renderCardInto(elCat, elCatLabel, elAllPlay, elWord, card) {
    elCat.textContent = card.category;
    elCat.className = "cat cat-" + card.category;
    elCatLabel.textContent = CATEGORY_LABELS[card.category] || "—";
    elAllPlay.classList.toggle("hidden", !card.allPlay || card.category === "T");
    elWord.textContent = card.word;
  }

  // ---------- Reveal flow ----------

  function drawAndGoToReveal() {
    const card = pickCard();
    if (!card) {
      alert("Nenhuma carta disponível. Selecione ao menos uma categoria.");
      return;
    }
    state.currentCard = card;
    els.revealCover.classList.remove("hidden");
    els.revealCard.classList.add("hidden");
    show("reveal");
  }

  function showCard() {
    if (!state.currentCard) return;
    renderCardInto(
      els.cardCat,
      els.cardCatLabel,
      els.cardAllPlay,
      els.cardWord,
      state.currentCard,
    );
    els.revealCover.classList.add("hidden");
    els.revealCard.classList.remove("hidden");
  }

  // ---------- Timer ----------

  function getDurationSec() {
    const v = parseInt(els.timerInput.value, 10);
    if (Number.isFinite(v) && v >= 5 && v <= 3600) return v;
    return 60;
  }

  function fmt(secs) {
    const s = Math.max(0, Math.ceil(secs));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function startTimer() {
    if (!state.currentCard) return;
    state.durationSec = getDurationSec();
    state.endsAt = performance.now() + state.durationSec * 1000;

    renderCardInto(
      els.timerCat,
      els.timerCatLabel,
      els.timerAllPlay,
      els.timerWord,
      state.currentCard,
    );
    els.timerDisplay.textContent = fmt(state.durationSec);
    els.timerDisplay.classList.remove("warn", "danger");
    show("timer");
    primeAudio();

    if (state.intervalId) clearInterval(state.intervalId);
    tick();
    state.intervalId = setInterval(tick, 200);
  }

  function tick() {
    const remaining = (state.endsAt - performance.now()) / 1000;
    els.timerDisplay.textContent = fmt(remaining);
    els.timerDisplay.classList.toggle("warn", remaining <= 10 && remaining > 5);
    els.timerDisplay.classList.toggle("danger", remaining <= 5);
    if (remaining <= 0) finishByTimeout();
  }

  function stopTimer() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function finishByTimeout() {
    stopTimer();
    playAlarm();
    els.timeupWord.textContent = state.currentCard ? state.currentCard.word : "—";
    show("timeup");
  }

  function finishEarly() {
    stopTimer();
    show("home");
  }

  function cancelAll() {
    stopTimer();
    state.currentCard = null;
    show("home");
  }

  // ---------- Audio ----------

  function primeAudio() {
    if (state.audioCtx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) state.audioCtx = new Ctx();
    } catch (e) {
      state.audioCtx = null;
    }
  }

  function playAlarm() {
    primeAudio();
    const ctx = state.audioCtx;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    // 3 short beeps + one long tone — loud and obvious.
    const now = ctx.currentTime;
    const beepTimes = [0, 0.35, 0.7];
    beepTimes.forEach((t) => beep(ctx, now + t, 0.18, 880, 0.4));
    beep(ctx, now + 1.2, 1.2, 660, 0.5);
  }

  function beep(ctx, startAt, durSec, freq, gainAmp) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(gainAmp, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durSec);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + durSec + 0.05);
  }

  // ---------- Wire up ----------

  els.btnDraw.addEventListener("click", () => {
    primeAudio();
    drawAndGoToReveal();
  });
  els.btnShowCard.addEventListener("click", showCard);
  els.btnCancel.addEventListener("click", cancelAll);
  els.btnStartTimer.addEventListener("click", startTimer);
  els.btnRedraw.addEventListener("click", drawAndGoToReveal);
  els.btnStop.addEventListener("click", cancelAll);
  els.btnFinish.addEventListener("click", finishEarly);
  els.btnBackHome.addEventListener("click", () => {
    state.currentCard = null;
    show("home");
  });

  // Persist timer setting
  const savedTimer = localStorage.getItem("mimic.timer");
  if (savedTimer) els.timerInput.value = savedTimer;
  els.timerInput.addEventListener("change", () => {
    localStorage.setItem("mimic.timer", String(getDurationSec()));
    els.timerInput.value = String(getDurationSec());
  });

  // Persist category selections
  const savedCats = JSON.parse(localStorage.getItem("mimic.cats") || "null");
  if (savedCats && Array.isArray(savedCats)) {
    els.catCheckboxes.forEach((c) => {
      c.checked = savedCats.includes(c.dataset.cat);
    });
  }
  els.catCheckboxes.forEach((c) => {
    c.addEventListener("change", () => {
      localStorage.setItem("mimic.cats", JSON.stringify(activeCategories()));
    });
  });

  // Word count footer
  els.wordCount.textContent = (window.MIMIC_WORDS || []).length + " palavras";

  show("home");
})();
