import { WORLD, TILE_SIZE, createArena, movePawn } from "./arena.js";
import { createInput } from "./input.js";

const canvas = document.querySelector("#arena");
const stage = document.querySelector("#stage");
const ctx = canvas.getContext("2d");
const ui = {
  status: document.querySelector("#cameraMode"),
  coordinates: document.querySelector("#coordinates"),
  mapCoordinates: document.querySelector("#mapCoordinates"),
  diagnostics: document.querySelector("#diagnostics"),
  pause: document.querySelector("#pauseButton"),
  draft: document.querySelector("#draftButton"),
  speedLabel: document.querySelector("#speedLabel"),
  elapsed: document.querySelector("#elapsed")
};

const MOVE_TILES_PER_SECOND = 4;
const MOVE_SPEED = TILE_SIZE * MOVE_TILES_PER_SECOND;
const TURN_RATE = 240 * Math.PI / 180;
let arena = createArena();
let paused = false, speed = 1, drafted = true, gridVisible = true;
let zoom = 1, cameraLocked = true;
let camera = { x: WORLD.width / 2, y: WORLD.height / 2 };
let fps = 0, fpsFrames = 0, fpsTime = 0, elapsed = 0;
const input = createInput(canvas);
const player = () => arena.pawns.find(pawn => pawn.role === "player");
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", resize);
resize();

function worldView() {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width, rect.height) / 142 * zoom;
  return { rect, scale, viewW: rect.width / scale, viewH: rect.height / scale };
}
function screenToWorld(sx, sy) {
  const view = worldView();
  return { x: (sx - view.rect.width / 2) / view.scale + camera.x, y: (sy - view.rect.height / 2) / view.scale + camera.y };
}
function applyWheelZoom(delta) {
  if (!delta) return;
  const pointer = input.pointer;
  const anchor = screenToWorld(pointer.x, pointer.y);
  zoom = clamp(zoom * Math.pow(1.12, delta), 0.55, 2.8);
  const view = worldView();
  camera.x = anchor.x - (pointer.x - view.rect.width / 2) / view.scale;
  camera.y = anchor.y - (pointer.y - view.rect.height / 2) / view.scale;
  cameraLocked = false;
}
function approachAngle(current, target, maxStep) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + clamp(delta, -maxStep, maxStep);
}
function update(dt) {
  applyWheelZoom(input.consumeZoom());
  const pan = input.consumePan();
  if (input.pointer.middleDown || pan.x || pan.y) {
    const view = worldView();
    camera.x -= pan.x / view.scale;
    camera.y -= pan.y / view.scale;
    cameraLocked = false;
  }

  const pawn = player();
  const keys = input.keys;
  const dx = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  const dy = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
  const moving = dx !== 0 || dy !== 0;

  if (moving) {
    cameraLocked = true;
    if (!paused && drafted) {
      const length = Math.hypot(dx, dy);
      movePawn(arena, pawn, dx / length * MOVE_SPEED * speed * dt, dy / length * MOVE_SPEED * speed * dt);
    }
  }

  // Aim is simulation input: Draft OFF and Pause both freeze it.
  if (!paused && drafted && dt > 0) {
    const target = screenToWorld(input.pointer.x, input.pointer.y);
    const desired = Math.atan2(target.y - pawn.y, target.x - pawn.x);
    pawn.facing = approachAngle(pawn.facing, desired, TURN_RATE * dt);
  }

  if (cameraLocked) { camera.x = pawn.x; camera.y = pawn.y; }
  const view = worldView(), halfW = view.viewW / 2, halfH = view.viewH / 2;
  camera.x = halfW * 2 >= WORLD.width ? WORLD.width / 2 : clamp(camera.x, halfW, WORLD.width - halfW);
  camera.y = halfH * 2 >= WORLD.height ? WORLD.height / 2 : clamp(camera.y, halfH, WORLD.height - halfH);

  const location = `X ${(pawn.x / TILE_SIZE).toFixed(1)} · Y ${(pawn.y / TILE_SIZE).toFixed(1)}`;
  ui.coordinates.textContent = location;
  ui.mapCoordinates.textContent = location;
  ui.status.textContent = `CAMERA · ${cameraLocked ? "LOCKED" : "FREE LOOK"}${paused ? " · PAUSED" : ""}`;
}
function drawGrid() {
  if (!gridVisible) return;
  ctx.strokeStyle = "#29414a"; ctx.lineWidth = 0.055;
  for (let x = 0; x <= WORLD.width; x += TILE_SIZE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke(); }
  for (let y = 0; y <= WORLD.height; y += TILE_SIZE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke(); }
}
function drawTerrain() {
  for (const block of arena.terrain) {
    const palette = block.kind === "wall" ? ["#405761", "#79939b"] : block.kind === "rock" ? ["#554f43", "#9a8b6e"] : ["#344b55", "#6d8991"];
    ctx.fillStyle = palette[0]; ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.strokeStyle = palette[1]; ctx.lineWidth = 0.13; ctx.strokeRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = "#d9eeee12"; ctx.fillRect(block.x + 1.4, block.y + 1.4, Math.max(0, block.w - 2.8), .72);
    ctx.fillStyle = "#07101655"; ctx.fillRect(block.x + 1.4, block.y + block.h - 2, Math.max(0, block.w - 2.8), .6);
  }
}
function drawPawn(pawn) {
  // Every Pawn uses the same one-tile footprint and the same flat visual language.
  const r = TILE_SIZE / 2;
  ctx.save();
  ctx.translate(pawn.x, pawn.y);
  ctx.fillStyle = pawn.color;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = "rgba(235,250,248,0.72)";
  ctx.lineWidth = 0.16;
  ctx.beginPath(); ctx.arc(0, 0, r - 0.12, 0, Math.PI * 2); ctx.stroke();

  // A small black direction dot replaces the former eye; it is identical on every Pawn.
  const markerDistance = r * 0.48;
  ctx.fillStyle = "#071318";
  ctx.beginPath();
  ctx.arc(Math.cos(pawn.facing) * markerDistance, Math.sin(pawn.facing) * markerDistance, r * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save(); ctx.font = "5.8px ui-monospace,monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#d9e8e9";
  ctx.shadowColor = "#071016"; ctx.shadowBlur = 2; ctx.fillText(pawn.name.toUpperCase(), pawn.x, pawn.y - r - 2.5); ctx.restore();
}
function draw() {
  const view = worldView(), width = view.rect.width, height = view.rect.height, scale = view.scale;
  ctx.clearRect(0, 0, width, height); ctx.fillStyle = "#101d24"; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.translate(width / 2 - camera.x * scale, height / 2 - camera.y * scale); ctx.scale(scale, scale);
  ctx.fillStyle = "#14242b"; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  drawGrid(); drawTerrain(); ctx.strokeStyle = "#68828a"; ctx.lineWidth = .8; ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
  for (const pawn of arena.pawns) drawPawn(pawn);
  ctx.restore();
  stage.classList.toggle("paused", paused); ui.pause.classList.toggle("is-paused", paused);
  ui.pause.innerHTML = paused ? '<span><i class="pause-glyph">▶</i> RESUME SIMULATION</span><kbd>SPACE</kbd>' : '<span><i class="pause-glyph">Ⅱ</i> PAUSE SIMULATION</span><kbd>SPACE</kbd>';
  ui.draft.classList.toggle("active", drafted);
  ui.speedLabel.textContent = `${speed}×`;
  ui.diagnostics.textContent = `FPS ${fps} · ZOOM ${Math.round(zoom * 100)}% · MAP 128×128`;
}
let last = performance.now();
function frame(now) {
  const raw = Math.min((now - last) / 1000, .05); last = now;
  const dt = paused ? 0 : raw;
  update(dt); draw();
  if (!paused) elapsed += raw;
  fpsFrames++; fpsTime += raw;
  if (fpsTime >= .5) { fps = Math.round(fpsFrames / fpsTime); fpsFrames = 0; fpsTime = 0; }
  const seconds = Math.floor(elapsed);
  ui.elapsed.textContent = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
  requestAnimationFrame(frame);
}
function setPaused(value) { paused = value; }
function setSpeed(value) { speed = value; document.querySelectorAll("[data-speed]").forEach(button => button.classList.toggle("active", Number(button.dataset.speed) === speed)); }
function toggleDraft() { drafted = !drafted; }
function reset() {
  arena = createArena(); camera = { x: player().x, y: player().y }; cameraLocked = true;
  zoom = 1; paused = false; speed = 1; drafted = true; elapsed = 0; setSpeed(1);
}
ui.pause.addEventListener("click", () => setPaused(!paused));
ui.draft.addEventListener("click", toggleDraft);
document.querySelectorAll("[data-speed]").forEach(button => button.addEventListener("click", () => setSpeed(Number(button.dataset.speed))));
document.querySelector("#resetButton").addEventListener("click", reset);
document.querySelector("#gridButton").addEventListener("click", event => { gridVisible = !gridVisible; event.currentTarget.classList.toggle("active", gridVisible); });
document.querySelector("#fullscreenButton").addEventListener("click", async () => {
  try { if (!document.fullscreenElement) await document.querySelector(".app").requestFullscreen(); else await document.exitFullscreen(); }
  catch (error) { console.warn("Fullscreen request was not accepted by the browser.", error); }
});
document.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.code === "Space") { event.preventDefault(); setPaused(!paused); }
  if (event.key.toLowerCase() === "f") toggleDraft();
  if (["1", "2", "3"].includes(event.key)) setSpeed(Number(event.key));
  if (event.key.toLowerCase() === "r") reset();
});
camera = { x: player().x, y: player().y };
requestAnimationFrame(frame);
