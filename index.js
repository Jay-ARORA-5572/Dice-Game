import {
  getWinnerMessage,
  getRoundWinnerKey,
  rollDiceSet,
  applyVariant,
  updateStreak,
} from "./js/game-logic.js";

// ----- Element references -----
const rollBtn = document.getElementById("roll-btn");
const resetBtn = document.getElementById("reset-btn");
const themeToggleBtn = document.getElementById("theme-toggle");
const diceCountSelect = document.getElementById("dice-count");
const bestOfSelect = document.getElementById("best-of");
const variantSelect = document.getElementById("variant");
const vsComputerCheckbox = document.getElementById("vs-computer");
const diceRow1 = document.getElementById("dice-row-1");
const diceRow2 = document.getElementById("dice-row-2");
const heading = document.getElementById("heading");
const matchScoreEl = document.getElementById("match-score");
const leaderboardList = document.getElementById("leaderboard-list");
const clearLeaderboardBtn = document.getElementById("clear-leaderboard");
const player1NameInput = document.getElementById("player1-name");
const player2NameInput = document.getElementById("player2-name");
const player1Label = document.getElementById("player1-label");
const player2Label = document.getElementById("player2-label");
const streak1El = document.getElementById("streak-1");
const streak2El = document.getElementById("streak-2");
const confettiCanvas = document.getElementById("confetti-canvas");

// ----- Game state -----
let matchScore = { player1: 0, player2: 0 };
let streak = { player1: 0, player2: 0 };
let roundHistory = []; // [{ p1Total, p2Total, winnerKey }, ...] for the current match
let isRolling = false;

const LEADERBOARD_KEY = "diceeLeaderboard";
const THEME_KEY = "diceeTheme";
const NAMES_KEY = "diceePlayerNames";

// ----- Names -----
function getPlayerNames() {
  const p1 = player1NameInput.value.trim() || "Player 1";
  const isComputer = vsComputerCheckbox.checked;
  const p2 = isComputer ? "Computer" : (player2NameInput.value.trim() || "Player 2");
  return { p1, p2 };
}

function saveNames() {
  localStorage.setItem(
    NAMES_KEY,
    JSON.stringify({ p1: player1NameInput.value, p2: player2NameInput.value })
  );
}

function loadNames() {
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    if (!raw) return;
    const { p1, p2 } = JSON.parse(raw);
    if (p1) player1NameInput.value = p1;
    if (p2) player2NameInput.value = p2;
  } catch (e) {
    // ignore malformed data
  }
}

function updateNameLabels() {
  const { p1, p2 } = getPlayerNames();
  player1Label.textContent = p1;
  player2Label.textContent = p2;
  player2NameInput.disabled = vsComputerCheckbox.checked;
}

// ----- Rendering -----
function renderDice(container, values) {
  container.innerHTML = "";
  values.forEach((value) => {
    const img = document.createElement("img");
    img.src = `images/dice${value}.png`;
    img.alt = "Dice Image";
    container.appendChild(img);
  });
}

function updateScoreboard() {
  const { p1, p2 } = getPlayerNames();
  matchScoreEl.textContent = `${p1}: ${matchScore.player1}  |  ${p2}: ${matchScore.player2}`;
}

function updateStreakDisplay() {
  streak1El.textContent = streak.player1 >= 3 ? `🔥 ${streak.player1} in a row` : "";
  streak2El.textContent = streak.player2 >= 3 ? `🔥 ${streak.player2} in a row` : "";
}

// ----- Sound effects (Web Audio API, no external files needed) -----
let audioCtx;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = "sine", startDelay = 0, volume = 0.15) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const startTime = ctx.currentTime + startDelay;
  oscillator.start(startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.stop(startTime + duration);
}

function playRollSound() {
  for (let i = 0; i < 5; i++) {
    playTone(180 + Math.random() * 80, 0.06, "square", i * 0.08, 0.08);
  }
}

function playWinChime() {
  playTone(523.25, 0.2, "triangle", 0);
  playTone(659.25, 0.2, "triangle", 0.15);
  playTone(783.99, 0.35, "triangle", 0.3);
}

// ----- Vibration feedback -----
function vibrateOnWin() {
  if ("vibrate" in navigator) {
    navigator.vibrate([80, 40, 80, 40, 160]);
  }
}

// ----- Confetti (lightweight canvas particle burst) -----
function fireConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiCanvas.style.display = "block";

  const colors = ["#4ECCA3", "#EEEEEE", "#F5D547", "#E94560", "#1F8A70"];
  const particles = Array.from({ length: 140 }, () => ({
    x: confettiCanvas.width / 2,
    y: confettiCanvas.height / 3,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -10 - 4,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 12,
  }));

  let frame = 0;
  const maxFrames = 110;

  function tick() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach((p) => {
      p.vy += 0.35; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      confettiCanvas.style.display = "none";
    }
  }

  requestAnimationFrame(tick);
}

// ----- Dice rolling -----
function handleRoll() {
  if (isRolling) return;
  isRolling = true;
  rollBtn.disabled = true;

  const diceCount = parseInt(diceCountSelect.value, 10);
  const variant = variantSelect.value;

  playRollSound();
  diceRow1.classList.add("rolling");
  diceRow2.classList.add("rolling");
  heading.textContent = "Rolling...";

  setTimeout(() => {
    const rolls1 = rollDiceSet(diceCount);
    const rolls2 = rollDiceSet(diceCount);
    const total1 = applyVariant(rolls1, variant);
    const total2 = applyVariant(rolls2, variant);

    renderDice(diceRow1, rolls1);
    renderDice(diceRow2, rolls2);

    diceRow1.classList.remove("rolling");
    diceRow2.classList.remove("rolling");

    const { p2 } = getPlayerNames();
    const roundMessage = diceCount > 1 || variant !== "standard"
      ? `${getWinnerMessage(total1, total2, { player2Label: p2 })} (${total1} vs ${total2})`
      : getWinnerMessage(total1, total2, { player2Label: p2 });
    heading.textContent = roundMessage;

    const winnerKey = getRoundWinnerKey(total1, total2);
    streak = updateStreak(streak, winnerKey);
    updateStreakDisplay();

    roundHistory.push({ p1Total: total1, p2Total: total2, winnerKey });

    if (winnerKey) {
      matchScore[winnerKey] += 1;
      updateScoreboard();
      checkForMatchWin();
    }

    isRolling = false;
    rollBtn.disabled = false;
  }, 500);
}

function checkForMatchWin() {
  const target = parseInt(bestOfSelect.value, 10);
  if (matchScore.player1 >= target || matchScore.player2 >= target) {
    const { p1, p2 } = getPlayerNames();
    const winnerName = matchScore.player1 >= target ? p1 : p2;
    heading.textContent = `🏆 ${winnerName} wins the match!`;
    playWinChime();
    vibrateOnWin();
    fireConfetti();
    saveToLeaderboard(winnerName, matchScore.player1, matchScore.player2, roundHistory);
    rollBtn.disabled = true;
  }
}

function resetMatch() {
  matchScore = { player1: 0, player2: 0 };
  streak = { player1: 0, player2: 0 };
  roundHistory = [];
  updateScoreboard();
  updateStreakDisplay();
  heading.textContent = "Roll the Dice!";
  rollBtn.disabled = false;
  const diceCount = parseInt(diceCountSelect.value, 10);
  renderDice(diceRow1, Array(diceCount).fill(6));
  renderDice(diceRow2, Array(diceCount).fill(6));
}

// ----- Leaderboard (localStorage) -----
function getLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveToLeaderboard(winner, score1, score2, rounds) {
  const board = getLeaderboard();
  board.unshift({
    winner,
    score: `${score1}-${score2}`,
    date: new Date().toLocaleDateString(),
    rounds,
  });
  const trimmed = board.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  renderLeaderboard();
}

function renderLeaderboard() {
  const board = getLeaderboard();
  leaderboardList.innerHTML = "";
  if (board.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No matches played yet.";
    leaderboardList.appendChild(li);
    return;
  }
  board.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "leaderboard-entry";

    const summary = document.createElement("div");
    summary.className = "leaderboard-summary";
    summary.textContent = `${entry.winner} won ${entry.score} — ${entry.date}`;
    li.appendChild(summary);

    if (entry.rounds && entry.rounds.length) {
      const detail = document.createElement("ul");
      detail.className = "leaderboard-detail";
      detail.hidden = true;
      entry.rounds.forEach((round, i) => {
        const roundLi = document.createElement("li");
        const outcome = round.winnerKey === "player1"
          ? "Player 1 took the round"
          : round.winnerKey === "player2"
            ? "Player 2 took the round"
            : "Draw";
        roundLi.textContent = `Round ${i + 1}: ${round.p1Total} vs ${round.p2Total} — ${outcome}`;
        detail.appendChild(roundLi);
      });
      li.appendChild(detail);

      summary.style.cursor = "pointer";
      summary.addEventListener("click", () => {
        detail.hidden = !detail.hidden;
      });
    }

    leaderboardList.appendChild(li);
  });
}

function clearLeaderboard() {
  localStorage.removeItem(LEADERBOARD_KEY);
  renderLeaderboard();
}

// ----- Theme toggle -----
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggleBtn.textContent = theme === "light" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "light" ? "dark" : "light");
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || "dark");
}

// ----- Init -----
function init() {
  initTheme();
  loadNames();
  updateNameLabels();
  renderDice(diceRow1, [6]);
  renderDice(diceRow2, [6]);
  updateScoreboard();
  updateStreakDisplay();
  renderLeaderboard();

  rollBtn.addEventListener("click", handleRoll);
  resetBtn.addEventListener("click", resetMatch);
  themeToggleBtn.addEventListener("click", toggleTheme);
  clearLeaderboardBtn.addEventListener("click", clearLeaderboard);
  diceCountSelect.addEventListener("change", resetMatch);
  bestOfSelect.addEventListener("change", resetMatch);
  variantSelect.addEventListener("change", resetMatch);

  vsComputerCheckbox.addEventListener("change", () => {
    updateNameLabels();
    updateScoreboard();
    resetMatch();
  });

  [player1NameInput, player2NameInput].forEach((input) => {
    input.addEventListener("input", () => {
      saveNames();
      updateNameLabels();
      updateScoreboard();
    });
  });

  // Spacebar rolls the dice, unless focus is on a text input / select
  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    event.preventDefault();
    handleRoll();
  });
}

init();

// ----- PWA: register service worker for offline support / installability -----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
