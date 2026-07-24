// ----- Element references -----
const rollBtn = document.getElementById("roll-btn");
const resetBtn = document.getElementById("reset-btn");
const themeToggleBtn = document.getElementById("theme-toggle");
const diceCountSelect = document.getElementById("dice-count");
const bestOfSelect = document.getElementById("best-of");
const diceRow1 = document.getElementById("dice-row-1");
const diceRow2 = document.getElementById("dice-row-2");
const heading = document.getElementById("heading");
const matchScoreEl = document.getElementById("match-score");
const leaderboardList = document.getElementById("leaderboard-list");
const clearLeaderboardBtn = document.getElementById("clear-leaderboard");

// ----- Game state -----
let matchScore = { player1: 0, player2: 0 };
let isRolling = false;

const LEADERBOARD_KEY = "diceeLeaderboard";
const THEME_KEY = "diceeTheme";

// ----- Winner logic (isolated, reusable, testable) -----
function getWinnerMessage(total1, total2) {
  if (total1 > total2) return "🚩 Player 1 Wins!";
  if (total2 > total1) return "Player 2 Wins! 🚩";
  return "Draw!";
}

function getRoundWinnerKey(total1, total2) {
  if (total1 > total2) return "player1";
  if (total2 > total1) return "player2";
  return null; // draw
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
  matchScoreEl.textContent = `Player 1: ${matchScore.player1}  |  Player 2: ${matchScore.player2}`;
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
  // A few quick clicky taps to suggest dice shaking
  for (let i = 0; i < 5; i++) {
    playTone(180 + Math.random() * 80, 0.06, "square", i * 0.08, 0.08);
  }
}

function playWinChime() {
  // Simple ascending three-note chime
  playTone(523.25, 0.2, "triangle", 0);
  playTone(659.25, 0.2, "triangle", 0.15);
  playTone(783.99, 0.35, "triangle", 0.3);
}

// ----- Dice rolling -----
function rollDiceSet(count) {
  const values = [];
  for (let i = 0; i < count; i++) {
    values.push(Math.floor(Math.random() * 6) + 1);
  }
  return values;
}

function sum(values) {
  return values.reduce((total, v) => total + v, 0);
}

function handleRoll() {
  if (isRolling) return;
  isRolling = true;
  rollBtn.disabled = true;

  const diceCount = parseInt(diceCountSelect.value, 10);

  playRollSound();
  diceRow1.classList.add("rolling");
  diceRow2.classList.add("rolling");
  heading.textContent = "Rolling...";

  setTimeout(() => {
    const rolls1 = rollDiceSet(diceCount);
    const rolls2 = rollDiceSet(diceCount);
    const total1 = sum(rolls1);
    const total2 = sum(rolls2);

    renderDice(diceRow1, rolls1);
    renderDice(diceRow2, rolls2);

    diceRow1.classList.remove("rolling");
    diceRow2.classList.remove("rolling");

    const roundMessage = diceCount > 1
      ? `${getWinnerMessage(total1, total2)} (${total1} vs ${total2})`
      : getWinnerMessage(total1, total2);
    heading.textContent = roundMessage;

    const winnerKey = getRoundWinnerKey(total1, total2);
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
    const winner = matchScore.player1 >= target ? "Player 1" : "Player 2";
    heading.textContent = `🏆 ${winner} wins the match!`;
    playWinChime();
    saveToLeaderboard(winner, matchScore.player1, matchScore.player2);
    rollBtn.disabled = true;
  }
}

function resetMatch() {
  matchScore = { player1: 0, player2: 0 };
  updateScoreboard();
  heading.textContent = "Roll the Dice!";
  rollBtn.disabled = false;
  renderDice(diceRow1, Array(parseInt(diceCountSelect.value, 10)).fill(6));
  renderDice(diceRow2, Array(parseInt(diceCountSelect.value, 10)).fill(6));
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

function saveToLeaderboard(winner, score1, score2) {
  const board = getLeaderboard();
  board.unshift({
    winner,
    score: `${score1}-${score2}`,
    date: new Date().toLocaleDateString(),
  });
  // Keep most recent 10 entries
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
    li.textContent = `${entry.winner} won ${entry.score} — ${entry.date}`;
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
  renderDice(diceRow1, [6]);
  renderDice(diceRow2, [6]);
  updateScoreboard();
  renderLeaderboard();

  rollBtn.addEventListener("click", handleRoll);
  resetBtn.addEventListener("click", resetMatch);
  themeToggleBtn.addEventListener("click", toggleTheme);
  clearLeaderboardBtn.addEventListener("click", clearLeaderboard);
  diceCountSelect.addEventListener("change", resetMatch);
  bestOfSelect.addEventListener("change", resetMatch);
}

init();
