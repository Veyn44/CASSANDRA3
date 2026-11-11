export const WORLD = { width: 128, height: 128 };
export const PAWN_RADIUS = 1.15;

export function createArena() {
  return {
    pawns: [
      { id: "protagonist", name: "Protagonist", role: "player", x: 24, y: 24, facing: 0, color: "#66c9e8" },
      { id: "mira", name: "Mira", role: "friendly", x: 31, y: 27, facing: Math.PI, color: "#75c99a" },
      { id: "enemy", name: "Enemy", role: "enemy", x: 83, y: 74, facing: Math.PI, color: "#df806e" }
    ],
    terrain: [
      { x: 43, y: 20, w: 8, h: 5, kind: "crate" },
      { x: 61, y: 35, w: 4, h: 17, kind: "wall" },
      { x: 27, y: 55, w: 13, h: 5, kind: "rock" },
      { x: 76, y: 20, w: 7, h: 7, kind: "crate" },
      { x: 92, y: 57, w: 5, h: 15, kind: "wall" },
      { x: 49, y: 88, w: 17, h: 6, kind: "rock" },
      { x: 84, y: 99, w: 9, h: 5, kind: "crate" },
      { x: 17, y: 91, w: 5, h: 13, kind: "wall" }
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