// Kakatua-9 — the two cameras. Chase view sits behind and above the
// plane and eases toward the plane so it never snaps; cockpit view puts
// the eye in the cabin and looks along the nose, with the panel drawn by
// the HUD. The camera never fights the pilot: it follows heading and
// bank, it never rolls past the horizon.
import { CONFIG } from './config.js';

export function createCamera(camera, aircraft) {
  let mode = 'chase'; // 'chase' | 'cockpit'
  const chasePos = new THREE.Vector3(0, 8, 40);
  const lookAt = new THREE.Vector3();

  function toggle() {
    mode = mode === 'chase' ? 'cockpit' : 'chase';
    return mode;
  }

  function update(dt) {
    const a = aircraft.state;
    // In cockpit view the airframe would block the windscreen: hide it
    // and fly by the instruments, like a real cockpit.
    a.group.visible = mode !== 'cockpit';
    const forward = new THREE.Vector3(-Math.sin(a.heading), 0, -Math.cos(a.heading));
    if (mode === 'cockpit') {
      const eye = a.pos.clone().addScaledVector(forward, 1.2);
      eye.y = a.pos.y + 0.9;
      camera.position.copy(eye);
      const pitchLook = Math.sin(a.pitch) * 30;
      lookAt.copy(a.pos).addScaledVector(forward, 60);
      lookAt.y = a.pos.y + pitchLook;
      camera.up.set(0, 1, 0);
      camera.lookAt(lookAt);
      return;
    }
    // Chase: behind the plane, above it, smoothed; look ahead of the nose.
    const wanted = a.pos.clone()
      .addScaledVector(forward, -CONFIG.chaseDistance)
      .add(new THREE.Vector3(0, CONFIG.chaseHeight, 0));
    wanted.y = Math.max(wanted.y, 2.5);
    chasePos.lerp(wanted, Math.min(1, dt * 4));
    camera.position.copy(chasePos);
    lookAt.copy(a.pos).addScaledVector(forward, 18);
    lookAt.y = a.pos.y + 1;
    camera.up.set(0, 1, 0);
    camera.lookAt(lookAt);
  }

  function snapTo(aircraftState) {
    const a = aircraftState;
    const forward = new THREE.Vector3(-Math.sin(a.heading), 0, -Math.cos(a.heading));
    chasePos.copy(a.pos).addScaledVector(forward, -CONFIG.chaseDistance).add(new THREE.Vector3(0, CONFIG.chaseHeight, 0));
  }

  return { toggle, update, snapTo, get mode() { return mode; } };
}
