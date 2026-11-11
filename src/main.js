import { WORLD, createArena, movePawn } from "./arena.js";
import { createInput } from "./input.js";

const canvas = document.querySelector("#arena");
const ctx = canvas.getContext("2d");
const ui = {
  status: document.querySelector("#status"),
  coordinates: document.querySelector("#coordinates"),
  diagnostics: document.querySelector("#diagnostics"),
  pause: document.querySelector("#pauseButton"),
  draft: document.querySelector("#draftButton")
};
let arena = createArena();
let paused = false, speed = 1, drafted = true;
let zoom = 1, camera = { x: 0, y: 0 }, fps = 0, fpsFrames = 0, fpsTime = 0;
const input = createInput(canvas);
const player = () => arena.pawns.find(pawn => pawn.role === "player");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);
resize();

function worldView() {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width, rect.height) / 142 * zoom;
  const viewW = rect.width / scale, viewH = rect.height / scale;
  return { rect, scale, viewW, viewH };
}
function screenToWorld(sx, sy) {
  const v = worldView();
  return { x: (sx - v.rect.width / 2) / v.scale + camera.x, y: (sy - v.rect.height / 2) / v.scale + camera.y };
}
function update(dt) {
  const pan = input.consumePan();
  if (pan) { const v = worldView(); camera.x -= pan.dx / v.scale; camera.y -= pan.dy / v.scale; }
  const zoomChange = input.consumeZoom();
  if (zoomChange) zoom = clamp(zoom * (zoomChange > 0 ? 1.12 : 1 / 1.12), 0.55, 2.8);
  const pawn = player();
  const mouse = screenToWorld(input.pointer.x, input.pointer.y);
  pawn.facing = Math.atan2(mouse.y - pawn.y, mouse.x - pawn.x);
  if (!paused && drafted) {
    const k = input.keys;
    let dx = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
    let dy = (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0);
    const length = Math.hypot(dx, dy);
    if (length) {
      const moveSpeed = 8; // Laboratory tuning only; encounter movement will use real time.
      movePawn(arena, pawn, dx / length * moveSpeed * dt, dy / length * moveSpeed * dt);
    }
  }
  const v = worldView();
  const halfW = v.viewW / 2, halfH = v.viewH / 2;
  camera.x = halfW * 2 >= WORLD.width + 16 ? WORLD.width / 2 : clamp(camera.x, halfW - 8, WORLD.width - halfW + 8);
  camera.y = halfH * 2 >= WORLD.height + 16 ? WORLD.height / 2 : clamp(camera.y, halfH - 8, WORLD.height - halfH + 8);
  ui.coordinates.textContent = `X ${pawn.x.toFixed(1)} · Y ${pawn.y.toFixed(1)}`;
}
function draw() {
  const v = worldView(), w = v.rect.width, h = v.rect.height, s = v.scale;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#152229"; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.translate(w / 2 - camera.x * s, h / 2 - camera.y * s); ctx.scale(s, s);
  ctx.fillStyle = "#1a2a30"; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.strokeStyle = "#2b4148"; ctx.lineWidth = 0.055;
  for (let x = 0; x <= WORLD.width; x += 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke(); }
  for (let y = 0; y <= WORLD.height; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke(); }
  ctx.strokeStyle = "#76909a"; ctx.lineWidth = 0.22; ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
  for (const block of arena.terrain) {
    ctx.fillStyle = block.kind === "wall" ? "#53636b" : block.kind === "rock" ? "#6b665a" : "#657780";
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.strokeStyle = "#a5b3b7"; ctx.lineWidth = 0.16; ctx.strokeRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = "#ffffff12"; ctx.fillRect(block.x + .35, block.y + .35, Math.max(0, block.w - .7), .22);
  }
  for (const pawn of arena.pawns) {
    ctx.beginPath(); ctx.arc(pawn.x, pawn.y, 1.15, 0, Math.PI * 2);
    ctx.fillStyle = pawn.color; ctx.fill();
    ctx.lineWidth = pawn.role === "player" ? .28 : .16; ctx.strokeStyle = "#e4f0f3"; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pawn.x, pawn.y);
    ctx.lineTo(pawn.x + Math.cos(pawn.facing) * 2.2, pawn.y + Math.sin(pawn.facing) * 2.2);
    ctx.strokeStyle = "#eaf4f5"; ctx.lineWidth = .28; ctx.stroke();
    ctx.font = "1.8px ui-sans-serif,system-ui"; ctx.textAlign = "center";
    ctx.fillStyle = "#e7eff1"; ctx.fillText(pawn.name, pawn.x, pawn.y - 2);
  }
  ctx.restore();
  ui.status.textContent = paused ? "PAUSED" : `RUNNING · ${speed}×`;
  ui.status.style.color = paused ? "#e3c58b" : "#8fbd9f";
  ui.pause.textContent = paused ? "▶ Resume" : "Ⅱ Pause";
  ui.diagnostics.textContent = `FPS ${fps} · ZOOM ${zoom.toFixed(2)}× · ${WORLD.width}×${WORLD.height}`;
}
let last = performance.now();
function frame(now) {
  const raw = Math.min((now - last) / 1000, .05); last = now;
  const dt = paused ? 0 : raw * speed;
  update(dt); draw();
  fpsFrames++; fpsTime += raw;
  if (fpsTime >= .5) { fps = Math.round(fpsFrames / fpsTime); fpsFrames = 0; fpsTime = 0; }
  requestAnimationFrame(frame);
}
ui.pause.addEventListener("click", () => { paused = !paused; });
document.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.code === "Space") paused = !paused;
  if (event.key === "1" || event.key === "2" || event.key === "3") setSpeed(Number(event.key));
  if (event.key.toLowerCase() === "r") reset();
});
function setSpeed(value) {
  speed = value;
  document.querySelectorAll("[data-speed]").forEach(button => button.classList.toggle("active", Number(button.dataset.speed) === speed));
}
document.querySelectorAll("[data-speed]").forEach(button => button.addEventListener("click", () => setSpeed(Number(button.dataset.speed))));
ui.draft.addEventListener("click", () => {
  drafted = !drafted;
  ui.draft.textContent = `Draft: ${drafted ? "ON" : "OFF"}`;
  ui.draft.classList.toggle("active", drafted);
});
function reset() {
  arena = createArena(); camera = { x: WORLD.width / 2, y: WORLD.height / 2 };
  zoom = 1; paused = false; speed = 1; drafted = true;
  setSpeed(1); ui.draft.textContent = "Draft: ON"; ui.draft.classList.add("active");
}
document.querySelector("#resetButton").addEventListener("click", reset);
camera = { x: WORLD.width / 2, y: WORLD.height / 2 };
requestAnimationFrame(frame);