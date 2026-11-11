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
function drawPawn(pawn, now) {
  const isPlayer = pawn.role === "player";
  const r = isPlayer ? 4.7 : 4.45;
  ctx.save();
  ctx.translate(pawn.x, pawn.y);
  if (isPlayer) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 430);
    const halo = ctx.createRadialGradient(0, 0, r * .55, 0, 0, r * 2.6);
    halo.addColorStop(0, `rgba(72,235,224,${0.22 + pulse * 0.12})`);
    halo.addColorStop(1, "rgba(72,235,224,0)");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, r * 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = "#42e8dc"; ctx.shadowBlur = 5 + pulse * 4;
    const body = ctx.createRadialGradient(-r * .32, -r * .4, .3, 0, 0, r * 1.15);
    body.addColorStop(0, "#d4fffa"); body.addColorStop(.22, "#78f5e9"); body.addColorStop(.68, "#24bdb8"); body.addColorStop(1, "#08777e");
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(180,255,247,${.55 + pulse * .3})`; ctx.lineWidth = .45; ctx.stroke();
    // A single small eye is the only directional feature; no arrow or nose marker.
    ctx.rotate(pawn.facing);
    ctx.fillStyle = "#07363b"; ctx.beginPath(); ctx.ellipse(r * .57, 0, r * .23, r * .31, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f1fffd"; ctx.beginPath(); ctx.arc(r * .62, -r * .09, r * .105, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = pawn.color; ctx.shadowColor = pawn.color; ctx.shadowBlur = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = "#dce9e8"; ctx.lineWidth = .35; ctx.stroke();
    ctx.fillStyle = "#17242a"; ctx.beginPath(); ctx.arc(r * .25, 0, r * .2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.save(); ctx.font = "5.8px ui-monospace,monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#d9e8e9";
  ctx.shadowColor = "#071016"; ctx.shadowBlur = 2; ctx.fillText(pawn.name.toUpperCase(), pawn.x, pawn.y - r - 4); ctx.restore();
}
function draw(now) {
  const view = worldView(), width = view.rect.width, height = view.rect.height, scale = view.scale;
  ctx.clearRect(0, 0, width, height); ctx.fillStyle = "#101d24"; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.translate(width / 2 - camera.x * scale, height / 2 - camera.y * scale); ctx.scale(scale, scale);
  ctx.fillStyle = "#14242b"; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  drawGrid(); drawTerrain(); ctx.strokeStyle = "#68828a"; ctx.lineWidth = .8; ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
  for (const pawn of arena.pawns) drawPawn(pawn, now);
  ctx.restore();
  stage.classList.toggle("paused", paused); ui.pause.classList.toggle("is-paused", paused);
  ui.pause.innerHTML = paused ? "<span><i class=\"pause-glyph\">▶</i> RESUME SIMULATION</span><kbd>SPACE</kbd>" : "<span><i class=\"pause-glyph\">Ⅱ</i> PAUSE SIMULATION</span><kbd>SPACE</kbd>";
  ui.draft.classList.toggle("active", drafted);
  ui.speedLabel.textContent = `${speed}×`;
  ui.diagnostics.textContent = `FPS ${fps} · ZOOM ${Math.round(zoom * 100)}% · MAP 128×128`;
}
let last = performance.now();
function frame(now) {
  const raw = Math.min((now - last) / 1000, .05); last = now;
  const dt = paused ? 0 : raw;
  update(dt); draw(now);
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
