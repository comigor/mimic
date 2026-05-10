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

  // Spiral-ish track: start tile, repeating P-O-A-D-L-T sequence, finish tile.
  const TILE_SEQUENCE = ["P", "O", "A", "D", "L", "T"];
  const BOARD_LENGTH = 36; // category tiles between INÍCIO and FIM

  const screens = {
    home: document.getElementById("screen-home"),
    board: document.getElementById("screen-board"),
    reveal: document.getElementById("screen-reveal"),
    timer: document.getElementById("screen-timer"),
    timeup: document.getElementById("screen-timeup"),
    win: document.getElementById("screen-win"),
  };

  const els = {
    timerInput: document.getElementById("timer-input"),
    btnStartGame: document.getElementById("btn-start-game"),
    btnFreePlay: document.getElementById("btn-free-play"),
    teamCountBtns: document.querySelectorAll(".team-count-btn"),

    btnShowCard: document.getElementById("btn-show-card"),
    btnCancel: document.getElementById("btn-cancel"),
    btnStartTimer: document.getElementById("btn-start-timer"),
    btnStop: document.getElementById("btn-stop"),
    btnFinish: document.getElementById("btn-finish"),
    btnBackHome: document.getElementById("btn-back-home"),
    btnQuitGame: document.getElementById("btn-quit-game"),
    btnRoll: document.getElementById("btn-roll"),
    btnDrawCard: document.getElementById("btn-draw-card"),
    btnNewGame: document.getElementById("btn-new-game"),

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

    turnPawn: document.getElementById("turn-pawn"),
    turnLabel: document.getElementById("turn-label"),
    turnBanner: document.getElementById("turn-banner"),
    boardTrack: document.getElementById("board-track"),
    dice: document.getElementById("dice"),
    boardRollState: document.getElementById("board-roll-state"),
    boardCardState: document.getElementById("board-card-state"),
    landedCatBadge: document.getElementById("landed-cat-badge"),
    landedCatName: document.getElementById("landed-cat-name"),
    winTeamLabel: document.getElementById("win-team-label"),
  };

  const state = {
    teamCount: 2,
    teams: [],
    currentTeam: 0,
    boardTiles: [],
    currentCard: null,
    recent: [],
    intervalId: null,
    endsAt: 0,
    audioCtx: null,
    durationSec: 60,
    freePlay: false,
    forcedCategory: null,
  };

  // ---------- Board ----------

  function buildBoard() {
    const tiles = ["START"];
    for (let i = 0; i < BOARD_LENGTH; i++) {
      tiles.push(TILE_SEQUENCE[i % TILE_SEQUENCE.length]);
    }
    tiles.push("FINISH");
    state.boardTiles = tiles;
  }

  function renderBoard() {
    els.boardTrack.innerHTML = "";
    state.boardTiles.forEach((cat, idx) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      if (cat === "START") {
        tile.classList.add("tile-start");
        tile.textContent = "INÍCIO";
      } else if (cat === "FINISH") {
        tile.classList.add("tile-finish");
        tile.textContent = "FIM";
      } else {
        tile.classList.add("tile-" + cat);
        tile.textContent = cat;
      }
      tile.dataset.idx = idx;
      const pawnsBox = document.createElement("div");
      pawnsBox.className = "pawns";
      pawnsBox.dataset.idx = idx;
      tile.appendChild(pawnsBox);
      els.boardTrack.appendChild(tile);
    });
    redrawPawns();
  }

  function redrawPawns() {
    els.boardTrack.querySelectorAll(".pawns").forEach((b) => (b.innerHTML = ""));
    state.teams.forEach((t, i) => {
      const box = els.boardTrack.querySelector(`.pawns[data-idx="${t.position}"]`);
      if (!box) return;
      const p = document.createElement("span");
      p.className = "pawn pawn-" + (i + 1);
      box.appendChild(p);
    });
  }

  function scrollToCurrentTeam() {
    const t = state.teams[state.currentTeam];
    if (!t) return;
    const tile = els.boardTrack.querySelector(`.tile[data-idx="${t.position}"]`);
    if (tile && tile.scrollIntoView) {
      tile.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  function updateTurnBanner() {
    const i = state.currentTeam;
    els.turnPawn.className = "pawn pawn-" + (i + 1);
    els.turnLabel.textContent = `Vez do Time ${i + 1}`;
  }

  // ---------- Setup ----------

  function startGame() {
    state.freePlay = false;
    state.teams = [];
    for (let i = 0; i < state.teamCount; i++) {
      state.teams.push({ position: 0 });
    }
    state.currentTeam = 0;
    state.recent = [];
    buildBoard();
    renderBoard();
    updateTurnBanner();
    showRollState();
    show("board");
    setTimeout(scrollToCurrentTeam, 50);
  }

  function showRollState() {
    els.boardRollState.classList.remove("hidden");
    els.boardCardState.classList.add("hidden");
    els.dice.textContent = "🎲";
    els.dice.classList.remove("rolling");
    els.btnRoll.disabled = false;
    state.forcedCategory = null;
  }

  function showCardState(cat) {
    els.boardRollState.classList.add("hidden");
    els.boardCardState.classList.remove("hidden");
    els.landedCatBadge.className = "cat cat-" + cat;
    els.landedCatBadge.textContent = cat;
    els.landedCatName.textContent = CATEGORY_LABELS[cat] || "—";
    state.forcedCategory = cat;
  }

  // ---------- Dice ----------

  function rollDice() {
    primeAudio();
    els.btnRoll.disabled = true;
    els.dice.classList.add("rolling");
    let ticks = 10;
    const interval = setInterval(() => {
      els.dice.textContent = String(Math.floor(Math.random() * 6) + 1);
      ticks--;
      if (ticks <= 0) {
        clearInterval(interval);
        const result = Math.floor(Math.random() * 6) + 1;
        els.dice.textContent = String(result);
        els.dice.classList.remove("rolling");
        finishRoll(result);
      }
    }, 70);
  }

  function finishRoll(n) {
    const team = state.teams[state.currentTeam];
    const lastIdx = state.boardTiles.length - 1;
    const target = Math.min(lastIdx, team.position + n);
    team.position = target;
    redrawPawns();
    scrollToCurrentTeam();

    const cat = state.boardTiles[target];
    if (cat === "FINISH") {
      setTimeout(handleWin, 400);
      return;
    }
    showCardState(cat);
  }

  function handleWin() {
    els.winTeamLabel.textContent = `Time ${state.currentTeam + 1}`;
    show("win");
  }

  // ---------- Card pick ----------

  function activeCategories() {
    return Array.from(els.catCheckboxes)
      .filter((c) => c.checked)
      .map((c) => c.dataset.cat);
  }

  function pickCard() {
    const allowedFromUI = new Set(activeCategories());
    let pool;
    if (state.forcedCategory && !state.freePlay) {
      pool = (window.MIMIC_WORDS || []).filter((w) => w.category === state.forcedCategory);
    } else {
      pool = (window.MIMIC_WORDS || []).filter((w) => allowedFromUI.has(w.category));
    }
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

  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
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

  function showCardOnReveal() {
    if (!state.currentCard) return;
    renderCardInto(els.cardCat, els.cardCatLabel, els.cardAllPlay, els.cardWord, state.currentCard);
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

    renderCardInto(els.timerCat, els.timerCatLabel, els.timerAllPlay, els.timerWord, state.currentCard);
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
    afterRound();
  }

  function cancelBackToBoardOrHome() {
    stopTimer();
    if (state.freePlay) show("home");
    else show("board");
  }

  function afterRound() {
    if (state.freePlay) {
      show("home");
      return;
    }
    nextTurn();
  }

  function nextTurn() {
    state.currentTeam = (state.currentTeam + 1) % state.teams.length;
    updateTurnBanner();
    showRollState();
    show("board");
    setTimeout(scrollToCurrentTeam, 50);
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

    const now = ctx.currentTime;
    [0, 0.35, 0.7].forEach((t) => beep(ctx, now + t, 0.18, 880, 0.4));
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

  els.teamCountBtns.forEach((b) => {
    b.addEventListener("click", () => {
      els.teamCountBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.teamCount = parseInt(b.dataset.count, 10);
      localStorage.setItem("mimic.teamCount", String(state.teamCount));
    });
  });

  els.btnStartGame.addEventListener("click", () => {
    primeAudio();
    startGame();
  });
  els.btnFreePlay.addEventListener("click", () => {
    primeAudio();
    state.freePlay = true;
    state.forcedCategory = null;
    drawAndGoToReveal();
  });
  els.btnRoll.addEventListener("click", rollDice);
  els.btnDrawCard.addEventListener("click", drawAndGoToReveal);
  els.btnShowCard.addEventListener("click", showCardOnReveal);
  els.btnCancel.addEventListener("click", cancelBackToBoardOrHome);
  els.btnStartTimer.addEventListener("click", startTimer);
  els.btnStop.addEventListener("click", cancelBackToBoardOrHome);
  els.btnFinish.addEventListener("click", finishEarly);
  els.btnBackHome.addEventListener("click", afterRound);
  els.btnQuitGame.addEventListener("click", () => {
    stopTimer();
    show("home");
  });
  els.btnNewGame.addEventListener("click", () => show("home"));

  // Persist settings
  const savedTimer = localStorage.getItem("mimic.timer");
  if (savedTimer) els.timerInput.value = savedTimer;
  els.timerInput.addEventListener("change", () => {
    localStorage.setItem("mimic.timer", String(getDurationSec()));
    els.timerInput.value = String(getDurationSec());
  });

  const savedTeamCount = parseInt(localStorage.getItem("mimic.teamCount"), 10);
  if ([2, 3, 4].includes(savedTeamCount)) {
    state.teamCount = savedTeamCount;
    els.teamCountBtns.forEach((b) => {
      b.classList.toggle("active", parseInt(b.dataset.count, 10) === savedTeamCount);
    });
  }

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

  els.wordCount.textContent = (window.MIMIC_WORDS || []).length + " palavras";

  show("home");
})();
