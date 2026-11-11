export function createInput(canvas) {
  const keys = new Set();
  const pointer = { x: 0, y: 0, clientX: 0, clientY: 0, zoomDelta: 0, middleDown: false, panDX: 0, panDY: 0 };
  const blocked = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]);
  const keyName = key => key.toLowerCase();

  window.addEventListener("keydown", event => {
    if (blocked.has(event.key)) event.preventDefault();
    keys.add(keyName(event.key));
  });
  window.addEventListener("keyup", event => keys.delete(keyName(event.key)));
  window.addEventListener("blur", () => { keys.clear(); pointer.middleDown = false; });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { keys.clear(); pointer.middleDown = false; }
  });

  canvas.addEventListener("contextmenu", event => event.preventDefault());
  canvas.addEventListener("pointermove", event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    if (pointer.middleDown) {
      pointer.panDX += event.movementX;
      pointer.panDY += event.movementY;
    }
  });
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 1) return;
    event.preventDefault();
    pointer.middleDown = true;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", event => {
    if (event.button === 1) pointer.middleDown = false;
  });
  canvas.addEventListener("pointercancel", () => { pointer.middleDown = false; });
  canvas.addEventListener("wheel", event => {
    event.preventDefault();
    pointer.zoomDelta += event.deltaY < 0 ? 1 : -1;
  }, { passive: false });

  return {
    keys,
    pointer,
    consumeZoom() {
      const value = pointer.zoomDelta;
      pointer.zoomDelta = 0;
      return value;
    },
    consumePan() {
      const value = { x: pointer.panDX, y: pointer.panDY };
      pointer.panDX = 0;
      pointer.panDY = 0;
      return value;
    }
  };
}
