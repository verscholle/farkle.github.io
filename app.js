const POINTS = [50, 100, 500, 750, 1000, 1500];
const COLORS = [
  { name: "Rot", value: "#ef4444" },
  { name: "Blau", value: "#3b82f6" },
  { name: "Gelb", value: "#facc15" },
  { name: "Grün", value: "#22c55e" },
  { name: "Violett", value: "#a855f7" },
  { name: "Orange", value: "#f97316" }
];

const defaults = { count: 2, names: COLORS.map((_, i) => `Spieler ${i + 1}`), scores: Array(6).fill(0), history: [] };
let state;
try { state = { ...defaults, ...JSON.parse(localStorage.getItem("punktezaehler") || "{}") }; }
catch { state = structuredClone(defaults); }

const $ = (selector) => document.querySelector(selector);
const dashboard = $("#dashboard");
const game = $("#game");
const countInput = $("#playerCount");
const countLabel = $("#playerCountLabel");
const nameFields = $("#nameFields");
const players = $("#players");
const undoButton = $("#undoButton");

function save() { localStorage.setItem("punktezaehler", JSON.stringify(state)); }

function renderSetup() {
  countInput.value = state.count;
  countLabel.textContent = `${state.count} Spieler`;
  nameFields.innerHTML = "";
  for (let i = 0; i < state.count; i++) {
    const row = document.createElement("label");
    row.className = "name-field";
    row.innerHTML = `<span class="color-dot" style="color:${COLORS[i].value}" aria-label="${COLORS[i].name}"></span>
      <input maxlength="18" aria-label="Name für Spieler ${i + 1}" value="${escapeHtml(state.names[i])}" placeholder="Spieler ${i + 1}">`;
    row.querySelector("input").addEventListener("input", (event) => {
      state.names[i] = event.target.value;
      save();
    });
    nameFields.append(row);
  }
}

function renderGame() {
  players.innerHTML = "";
  for (let i = 0; i < state.count; i++) {
    const card = document.createElement("article");
    card.className = "player-card";
    card.style.setProperty("--color", COLORS[i].value);
    card.innerHTML = `<h2 class="player-name">${escapeHtml(state.names[i].trim() || `Spieler ${i + 1}`)}</h2>
      <span class="score">${state.scores[i].toLocaleString("de-CH")}</span>
      <div class="point-buttons">
        ${POINTS.map(points => `<button class="point-button" data-points="${points}">+${points}</button>`).join("")}
      </div>`;
    card.querySelectorAll(".point-button").forEach(button => button.addEventListener("click", () => addPoints(i, Number(button.dataset.points), card)));
    players.append(card);
  }
  undoButton.disabled = state.history.length === 0;
}

function addPoints(player, points, card) {
  state.scores[player] += points;
  state.history.push({ player, points });
  if (state.history.length > 100) state.history.shift();
  save();
  const score = card.querySelector(".score");
  score.textContent = state.scores[player].toLocaleString("de-CH");
  score.classList.remove("bump");
  requestAnimationFrame(() => score.classList.add("bump"));
  undoButton.disabled = false;
  if (navigator.vibrate) navigator.vibrate(18);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

countInput.addEventListener("input", () => {
  state.count = Number(countInput.value);
  save();
  renderSetup();
});

$("#startButton").addEventListener("click", () => {
  dashboard.hidden = true;
  game.hidden = false;
  renderGame();
});

$("#settingsButton").addEventListener("click", () => {
  const opening = dashboard.hidden;
  dashboard.hidden = !opening;
  game.hidden = opening;
  if (!opening) renderGame(); else renderSetup();
});

undoButton.addEventListener("click", () => {
  const last = state.history.pop();
  if (!last) return;
  state.scores[last.player] = Math.max(0, state.scores[last.player] - last.points);
  save();
  renderGame();
});

$("#resetButton").addEventListener("click", () => $("#resetDialog").showModal());
$("#confirmReset").addEventListener("click", () => {
  state.scores = Array(6).fill(0);
  state.history = [];
  save();
  renderGame();
});

renderSetup();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
