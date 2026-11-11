export function createInput(canvas) {
  const keys = new Set();
  const pointer = { x: 0, y: 0, down: false, panning: false, lastX: 0, lastY: 0 };
  const blocked = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]);
  window.addEventListener("keydown", event => {
    if (blocked.has(event.key)) event.preventDefault();
    keys.add(event.key.toLowerCase());
  });
  window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  canvas.addEventListener("pointerdown", event => {
    pointer.down = true;
    pointer.panning = event.button === 1 || event.button === 2;
    pointer.lastX = event.clientX; pointer.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", () => { pointer.down = false; pointer.panning = false; });
  canvas.addEventListener("pointermove", event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top;
    pointer.clientX = event.clientX; pointer.clientY = event.clientY;
  });
  canvas.addEventListener("wheel", event => {
    event.preventDefault();
    pointer.zoomDelta = (pointer.zoomDelta || 0) + (event.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  return {
    keys, pointer,
    consumePan() {
      if (!pointer.down || !pointer.panning) return null;
      const dx = pointer.clientX - pointer.lastX, dy = pointer.clientY - pointer.lastY;
      pointer.lastX = pointer.clientX; pointer.lastY = pointer.clientY;
      return { dx, dy };
    },
    consumeZoom() { const value = pointer.zoomDelta || 0; pointer.zoomDelta = 0; return value; }
  };
}