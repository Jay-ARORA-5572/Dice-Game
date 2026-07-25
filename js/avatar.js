// Deterministic "avatar" for a player name — same name always gets the same
// color, so it's a stable visual identity without needing real accounts.

export function nameToColor(name) {
  const str = (name || "Player").trim() || "Player";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export function nameToInitial(name) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

/**
 * Builds a small colored circle <span> DOM element showing the player's
 * initial. Built as a real DOM node (not innerHTML) so user-supplied names
 * can never inject markup.
 */
export function buildAvatarElement(name) {
  const span = document.createElement("span");
  span.className = "avatar";
  span.style.backgroundColor = nameToColor(name);
  span.textContent = nameToInitial(name);
  span.setAttribute("aria-hidden", "true");
  return span;
}

/**
 * Clears `container` and fills it with an avatar + the player's name.
 */
export function renderPlayerLabel(container, name) {
  container.innerHTML = "";
  container.appendChild(buildAvatarElement(name));
  container.appendChild(document.createTextNode(name));
}
