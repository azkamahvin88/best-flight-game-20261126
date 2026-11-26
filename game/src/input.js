// Kakatua-9 — keyboard and mouse input. One object owns every key and
// pointer state so the flight model and the menus read the same truth.
export function createInput(canvas) {
  const keys = new Set();
  const state = {
    throttleUp: false,
    throttleDown: false,
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    yawLeft: false,
    yawRight: false,
    flaps: false,
    drop: false,
    camera: false,
    pause: false,
    restart: false,
    mission1: false,
    mission2: false,
    mission3: false,
    start: false,
    mouseX: 0,
    mouseY: 0,
    mouseActive: false,
  };

  const MAP = {
    KeyW: 'throttleUp', ArrowUp: 'pitchDown', ArrowDown: 'pitchUp',
    ArrowLeft: 'rollLeft', ArrowRight: 'rollRight',
    KeyA: 'yawLeft', KeyD: 'yawRight',
    KeyS: 'throttleDown', KeyF: 'flaps', Space: 'drop',
    KeyC: 'camera', KeyP: 'pause', KeyR: 'restart',
    Digit1: 'mission1', Digit2: 'mission2', Digit3: 'mission3',
    Enter: 'start',
  };
  // Keys that fire once per press (edge-triggered), not while held.
  const EDGE = new Set(['flaps', 'camera', 'pause', 'restart', 'drop',
    'mission1', 'mission2', 'mission3', 'start']);
  const pressed = new Set();

  function onKeyDown(event) {
    const name = MAP[event.code];
    if (!name) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (EDGE.has(name)) {
      if (!event.repeat) pressed.add(name);
    } else {
      state[name] = true;
    }
    keys.add(event.code);
  }

  function onKeyUp(event) {
    const name = MAP[event.code];
    if (!name) return;
    if (!EDGE.has(name)) state[name] = false;
    keys.delete(event.code);
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = (event.clientX - rect.left) / rect.width - 0.5;
    state.mouseY = (event.clientY - rect.top) / rect.height - 0.5;
    state.mouseActive = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', () => { state.mouseActive = false; });

  return {
    state,
    // Consume the edge-triggered presses since the last frame, then clear.
    consumeEdges() {
      for (const name of EDGE) state[name] = pressed.has(name);
      pressed.clear();
    },
    isDown(code) { return keys.has(code); },
  };
}
