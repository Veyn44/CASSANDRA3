export const TILE_SIZE = 4;
export const WORLD = { width: 128 * TILE_SIZE, height: 128 * TILE_SIZE };
export const PAWN_RADIUS = 1.15 * TILE_SIZE;

export function createArena() {
  const scale = TILE_SIZE;
  return {
    pawns: [
      { id: "protagonist", name: "Protagonist", role: "player", x: 24 * scale, y: 24 * scale, facing: 0, color: "#66c9e8" },
      { id: "mira", name: "Mira", role: "friendly", x: 31 * scale, y: 27 * scale, facing: Math.PI, color: "#75c99a" },
      { id: "enemy", name: "Enemy", role: "enemy", x: 83 * scale, y: 74 * scale, facing: Math.PI, color: "#df806e" }
    ],
    terrain: [
      { x: 43 * scale, y: 20 * scale, w: 8 * scale, h: 5 * scale, kind: "crate" },
      { x: 61 * scale, y: 35 * scale, w: 4 * scale, h: 17 * scale, kind: "wall" },
      { x: 27 * scale, y: 55 * scale, w: 13 * scale, h: 5 * scale, kind: "rock" },
      { x: 76 * scale, y: 20 * scale, w: 7 * scale, h: 7 * scale, kind: "crate" },
      { x: 92 * scale, y: 57 * scale, w: 5 * scale, h: 15 * scale, kind: "wall" },
      { x: 49 * scale, y: 88 * scale, w: 17 * scale, h: 6 * scale, kind: "rock" },
      { x: 84 * scale, y: 99 * scale, w: 9 * scale, h: 5 * scale, kind: "crate" },
      { x: 17 * scale, y: 91 * scale, w: 5 * scale, h: 13 * scale, kind: "wall" }
    ]
  };
}

function circleRect(x, y, radius, rect) {
  const px = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const py = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - px, dy = y - py;
  return dx * dx + dy * dy < radius * radius;
}

export function movePawn(arena, pawn, dx, dy) {
  const obstacles = arena.terrain;
  const others = arena.pawns.filter(other => other !== pawn);
  const canOccupy = (x, y) => {
    if (x < PAWN_RADIUS || y < PAWN_RADIUS || x > WORLD.width - PAWN_RADIUS || y > WORLD.height - PAWN_RADIUS) return false;
    if (obstacles.some(rect => circleRect(x, y, PAWN_RADIUS, rect))) return false;
    return !others.some(other => Math.hypot(x - other.x, y - other.y) < PAWN_RADIUS * 2);
  };
  const nextX = pawn.x + dx;
  if (canOccupy(nextX, pawn.y)) pawn.x = nextX;
  const nextY = pawn.y + dy;
  if (canOccupy(pawn.x, nextY)) pawn.y = nextY;
}
