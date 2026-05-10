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

  // Rectangular spiral board: 6×6 grid = 36 tiles total.
  // Tile 0 = INÍCIO, tile 35 = FIM, tiles 1-34 cycle through P-O-A-D-L-T.
  const TILE_SEQUENCE = ["P", "O", "A", "D", "L", "T"];
  const BOARD_COLS = 6;
  const BOARD_ROWS = 6;

  const CAT_COLORS = {
    P: "#4aa3df",
    O: "#f1c40f",
    A: "#2ecc71",
    D: "#9b59b6",
    L: "#e67e22",
    T: "#e94560",
    START: "#ecf0f1",
    FINISH: "#f1c40f",
  };
  // Tiles whose category color is light enough to need dark text
  const CAT_TEXT_DARK = { O: true, A: true, START: true };
  const TEAM_COLORS = ["#e94560", "#4aa3df", "#f1c40f", "#2ecc71"];

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
    boardCanvas: document.getElementById("board-canvas"),
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
    boardTiles: [],    // ["START", "P", "O", ..., "FINISH"]
    spiralPath: [],    // [{x: col, y: row}, ...] same length as boardTiles
    currentCard: null,
    recent: [],
    intervalId: null,
    endsAt: 0,
    audioCtx: null,
    durationSec: 60,
    freePlay: false,
    forcedCategory: null,
    highlightIdx: -1,  // tile to highlight (last landed)
    animating: false,
  };

  // ---------- Board geometry ----------

  function generateSpiralPath(cols, rows) {
    const path = [];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let x = 0, y = 0;
    let dx = 1, dy = 0; // start moving right
    const total = cols * rows;
    for (let i = 0; i < total; i++) {
      path.push({ x, y });
      visited[y][x] = true;
      if (i === total - 1) break;
      let nx = x + dx, ny = y + dy;
      const blocked =
        nx < 0 || nx >= cols || ny < 0 || ny >= rows || visited[ny][nx];
      if (blocked) {
        // Rotate clockwise: (dx, dy) -> (-dy, dx)
        const tdx = -dy;
        const tdy = dx;
        dx = tdx;
        dy = tdy;
        nx = x + dx;
        ny = y + dy;
      }
      x = nx;
      y = ny;
    }
    return path;
  }

  function buildBoard() {
    state.spiralPath = generateSpiralPath(BOARD_COLS, BOARD_ROWS);
    const total = state.spiralPath.length;
    const tiles = new Array(total);
    tiles[0] = "START";
    tiles[total - 1] = "FINISH";
    for (let i = 1; i < total - 1; i++) {
      tiles[i] = TILE_SEQUENCE[(i - 1) % TILE_SEQUENCE.length];
    }
    state.boardTiles = tiles;
  }

  // ---------- Canvas rendering ----------

  function setupCanvas() {
    const canvas = els.boardCanvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  function drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawBoard(highlightTeamPositions) {
    const { ctx, w, h } = setupCanvas();
    ctx.clearRect(0, 0, w, h);

    const margin = 6;
    const tileSize = Math.min(
      (w - margin * 2) / BOARD_COLS,
      (h - margin * 2) / BOARD_ROWS
    );
    const gridW = tileSize * BOARD_COLS;
    const gridH = tileSize * BOARD_ROWS;
    const startX = (w - gridW) / 2;
    const startY = (h - gridH) / 2;

    // Faint connecting line between consecutive tiles to show the path
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.spiralPath.forEach((p, idx) => {
      const cx = startX + p.x * tileSize + tileSize / 2;
      const cy = startY + p.y * tileSize + tileSize / 2;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // Tiles
    state.spiralPath.forEach((p, idx) => {
      const cat = state.boardTiles[idx];
      const x = startX + p.x * tileSize;
      const y = startY + p.y * tileSize;
      drawTile(ctx, x, y, tileSize, cat, idx);
    });

    // Pawns
    drawAllPawns(ctx, startX, startY, tileSize, highlightTeamPositions);
  }

  function drawTile(ctx, x, y, size, cat, idx) {
    const pad = Math.max(2, size * 0.05);
    const r = size * 0.15;
    const color = CAT_COLORS[cat] || "#555";

    // Subtle drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = color;
    drawRoundRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, r);
    ctx.fill();
    ctx.restore();

    // Highlight ring on last landed tile
    if (idx === state.highlightIdx) {
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 3;
      drawRoundRect(
        ctx,
        x + pad - 1,
        y + pad - 1,
        size - pad * 2 + 2,
        size - pad * 2 + 2,
        r + 1
      );
      ctx.stroke();
    }

    // Finish tile: gradient overlay
    if (cat === "FINISH") {
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      g.addColorStop(0, "#f1c40f");
      g.addColorStop(1, "#e94560");
      ctx.fillStyle = g;
      drawRoundRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, r);
      ctx.fill();
    }

    // Text
    ctx.fillStyle = CAT_TEXT_DARK[cat] ? "#1a1a2e" : "#fff";
    let text = cat;
    let fontSize = size * 0.42;
    if (cat === "START") {
      text = "INÍCIO";
      fontSize = size * 0.18;
    } else if (cat === "FINISH") {
      text = "FIM";
      fontSize = size * 0.26;
      ctx.fillStyle = "#fff";
    }
    ctx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + size / 2, y + size / 2);
  }

  function drawAllPawns(ctx, startX, startY, tileSize, overridePositions) {
    // Group teams by position so we can offset overlapping pawns.
    const positions = overridePositions || state.teams.map((t) => t.position);
    const byPos = {};
    positions.forEach((pos, i) => {
      if (!byPos[pos]) byPos[pos] = [];
      byPos[pos].push(i);
    });

    Object.keys(byPos).forEach((posIdxStr) => {
      const posIdx = parseInt(posIdxStr, 10);
      const teamIndices = byPos[posIdx];
      const p = state.spiralPath[posIdx];
      if (!p) return;
      const cx = startX + p.x * tileSize + tileSize / 2;
      const cy = startY + p.y * tileSize + tileSize / 2;
      const pr = Math.max(7, tileSize * 0.18);

      teamIndices.forEach((teamIdx, i) => {
        let px = cx, py = cy;
        if (teamIndices.length > 1) {
          const angle = (i / teamIndices.length) * Math.PI * 2 - Math.PI / 2;
          const d = pr * 0.85;
          px = cx + Math.cos(angle) * d;
          py = cy + Math.sin(angle) * d;
        }
        drawPawn(ctx, px, py, pr, TEAM_COLORS[teamIdx % TEAM_COLORS.length]);
      });
    });
  }

  function drawPawn(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1.5, r * 0.18);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---------- Animation ----------

  function animatePawnMove(fromIdx, toIdx, doneCb) {
    const team = state.teams[state.currentTeam];
    state.animating = true;
    let stepIdx = fromIdx;
    const stepDelay = 160;

    const tick = () => {
      if (stepIdx >= toIdx) {
        team.position = toIdx;
        state.highlightIdx = toIdx;
        state.animating = false;
        drawBoard();
        doneCb();
        return;
      }
      stepIdx++;
      team.position = stepIdx;
      state.highlightIdx = stepIdx;
      drawBoard();
      setTimeout(tick, stepDelay);
    };
    setTimeout(tick, stepDelay);
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
    state.highlightIdx = -1;
    buildBoard();
    updateTurnBanner();
    showRollState();
    show("board");
    // Two ticks so layout settles before measuring canvas
    requestAnimationFrame(() => requestAnimationFrame(drawBoard));
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

  function updateTurnBanner() {
    const i = state.currentTeam;
    els.turnPawn.className = "pawn pawn-" + (i + 1);
    els.turnLabel.textContent = `Vez do Time ${i + 1}`;
  }

  // ---------- Dice ----------

  function rollDice() {
    primeAudio();
    if (state.animating) return;
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
    const from = team.position;
    animatePawnMove(from, target, () => {
      const cat = state.boardTiles[target];
      if (cat === "FINISH") {
        setTimeout(handleWin, 350);
        return;
      }
      showCardState(cat);
    });
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
    if (state.freePlay) {
      show("home");
    } else {
      show("board");
      requestAnimationFrame(drawBoard);
    }
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
    state.highlightIdx = -1;
    updateTurnBanner();
    showRollState();
    show("board");
    requestAnimationFrame(drawBoard);
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

  window.addEventListener("resize", () => {
    if (screens.board.classList.contains("active")) {
      requestAnimationFrame(drawBoard);
    }
  });

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
