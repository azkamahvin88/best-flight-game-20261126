// Kakatua-9 — the bush plane: its low-poly mesh (built from geometry,
// never a loaded model) and its arcade flight model. The model rewards
// throttle and turn discipline: speed follows throttle, lift fades below
// stall speed, and a banked turn bleeds speed unless the pilot adds power.
import { CONFIG } from './config.js';
import { groundHeightAt } from './terrain.js';

const { PI } = Math;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.08, flatShading: true, ...opts });
}

// Build the Kakatua-9 airframe: white fuselage, coral wings with teal
// tips, an orange crest fin, a spinning three-blade propeller and fixed
// bush wheels. Returns the group plus the propeller for animation.
export function buildAircraftMesh() {
  const group = new THREE.Group();
  const white = mat(0xf5efe0);
  const coral = mat(0xe85d3d);
  const teal = mat(0x1f8a8a);
  const dark = mat(0x2b2b33);
  const glass = mat(0x9fd8e8, { roughness: 0.15, metalness: 0.4 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.55, 5.6, 10), white);
  fuselage.rotation.x = PI / 2;
  group.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 10), coral);
  nose.rotation.x = -PI / 2;
  nose.position.z = -3.4;
  group.add(nose);
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8), glass);
  cabin.scale.set(1, 0.75, 1.5);
  cabin.position.set(0, 0.55, -0.6);
  group.add(cabin);
  // High wing with teal tips, plus tailplane and crest fin.
  const wing = new THREE.Mesh(new THREE.BoxGeometry(11, 0.22, 1.9), coral);
  wing.position.set(0, 0.75, -0.4);
  group.add(wing);
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 1.9), teal);
    tip.position.set(side * 5.6, 0.75, -0.4);
    group.add(tip);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 6), dark);
    strut.position.set(side * 1.8, 0.1, -0.4);
    strut.rotation.z = side * 0.5;
    group.add(strut);
  }
  const tailplane = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 1.1), coral);
  tailplane.position.set(0, 0.35, 2.7);
  group.add(tailplane);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 1.3), mat(0xff8c2e));
  fin.position.set(0, 1.0, 2.7);
  group.add(fin);
  // Propeller: hub + three blades, spun by the flight model.
  const prop = new THREE.Group();
  prop.position.z = -4.2;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 8), dark);
  hub.rotation.x = PI / 2;
  prop.add(hub);
  for (let i = 0; i < 3; i += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.4, 0.08), dark);
    const holder = new THREE.Group();
    holder.rotation.z = (i * 2 * PI) / 3;
    blade.position.y = 1.1;
    holder.add(blade);
    prop.add(holder);
  }
  group.add(prop);
  // Fixed bush wheels on sprung-looking legs.
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 6), dark);
    leg.position.set(side * 0.9, -0.85, -0.6);
    leg.rotation.z = side * 0.35;
    group.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 12), dark);
    wheel.rotation.z = PI / 2;
    wheel.position.set(side * 1.15, -1.25, -0.6);
    group.add(wheel);
  }
  group.traverse((child) => { if (child.isMesh) child.castShadow = true; });
  return { group, prop };
}

export function createAircraft(scene) {
  const { group, prop } = buildAircraftMesh();
  scene.add(group);
  const state = {
    group,
    pos: new THREE.Vector3(0, 1.2, 30),
    heading: 0,       // radians, 0 = facing -Z along the home strip
    pitch: 0,
    roll: 0,
    speed: 0,
    throttle: 0,
    fuel: CONFIG.fuelCapacity,
    damage: 0,
    flaps: false,
    airborne: false,
    verticalSpeed: 0,
    onGround: true,
    crashed: false,
    landed: false,
  };

  function reset(atFarStrip = false) {
    const strip = atFarStrip ? CONFIG.farStrip : CONFIG.homeStrip;
    const sx = strip.x;
    const sz = strip.z + strip.length * 0.32;
    state.pos.set(sx, groundHeightAt(sx, sz) + 1.2, sz);
    state.heading = strip.heading;
    state.pitch = 0;
    state.roll = 0;
    state.speed = 0;
    state.throttle = 0;
    state.fuel = CONFIG.fuelCapacity;
    state.damage = 0;
    state.flaps = false;
    state.airborne = false;
    state.verticalSpeed = 0;
    state.onGround = true;
    state.crashed = false;
    state.landed = false;
  }

  // One fixed step of the flight model. Returns events the game loop acts
  // on: { tookOff, touchedDown, hardLanding, crashed }.
  function step(dt, input, groundHeightAt) {
    const events = { tookOff: false, touchedDown: false, hardLanding: false, crashed: false };
    if (state.crashed) return events;
    if (input.flaps) state.flaps = !state.flaps;
    const target = state.throttle * CONFIG.maxSpeed;
    state.throttle += ((input.throttleUp ? 1 : 0) - (input.throttleDown ? 1 : 0)) * dt * 0.6;
    state.throttle = Math.max(0, Math.min(1, state.throttle));
    // Mouse steering: pointer offset nudges pitch and roll like a stick.
    let rollInput = (input.rollRight ? 1 : 0) - (input.rollLeft ? 1 : 0);
    let pitchInput = (input.pitchUp ? 1 : 0) - (input.pitchDown ? 1 : 0);
    if (input.mouseActive) {
      rollInput += Math.max(-1, Math.min(1, input.mouseX * 2.2));
      pitchInput += Math.max(-1, Math.min(1, -input.mouseY * 1.6));
    }
    rollInput = Math.max(-1, Math.min(1, rollInput));
    pitchInput = Math.max(-1, Math.min(1, pitchInput));
    const yawInput = (input.yawRight ? 1 : 0) - (input.yawLeft ? 1 : 0);

    const stalled = state.speed < CONFIG.stallSpeed;
    const liftFactor = stalled ? state.speed / CONFIG.stallSpeed : 1;
    state.roll += rollInput * CONFIG.turnRate * dt * (0.5 + liftFactor * 0.5);
    state.roll = Math.max(-1.1, Math.min(1.1, state.roll));
    // Roll bleeds back toward level hands-off, faster on the ground.
    state.roll *= Math.max(0, 1 - dt * (state.onGround ? 6 : 0.9));
    state.pitch += pitchInput * CONFIG.pitchRate * dt * liftFactor;
    state.pitch = Math.max(-0.45, Math.min(0.5, state.pitch));
    if (!pitchInput) state.pitch *= Math.max(0, 1 - dt * 0.8);
    state.heading -= Math.sin(state.roll) * CONFIG.turnRate * 1.4 * dt * (state.speed / CONFIG.maxSpeed + 0.15);
    state.heading += yawInput * CONFIG.yawRate * dt * 0.4;

    const flapsBoost = state.flaps ? 0.12 : 0;
    const speedTarget = target * (1 + flapsBoost) - Math.abs(state.roll) * 6 - Math.max(0, state.pitch) * 8;
    state.speed += (speedTarget - state.speed) * Math.min(1, CONFIG.accel * 0.12 * dt + 0.02);
    state.speed = Math.max(0, state.speed - CONFIG.drag * dt * (state.speed / CONFIG.maxSpeed));

    // Vertical motion: climb with power and pitch, sink when slow.
    const climb = (state.throttle * CONFIG.climbRate - CONFIG.sinkRate * (1 - liftFactor))
      + Math.sin(state.pitch) * state.speed * 0.9;
    state.verticalSpeed += (climb - state.verticalSpeed) * Math.min(1, dt * 2.5);
    const ground = groundHeightAt(state.pos.x, state.pos.z);
    if (state.onGround) {
      if (state.speed > CONFIG.stallSpeed + 4 && state.pitch > 0.05) {
        // Clean break from the runway: leave the ground with a small
        // climb already built in, so the next frame does not re-ground us.
        state.onGround = false;
        state.airborne = true;
        state.verticalSpeed = Math.max(state.verticalSpeed, 2);
        events.tookOff = true;
      } else {
        state.pos.y = ground + 1.2;
        state.verticalSpeed = 0;
      }
    } else {
      state.pos.y += state.verticalSpeed * dt;
    }
    const forward = new THREE.Vector3(-Math.sin(state.heading), 0, -Math.cos(state.heading));
    state.pos.addScaledVector(forward, state.speed * dt);

    // Fuel: throttle burns it, idling sips it. Empty tanks end the sortie.
    const burn = CONFIG.fuelBurnIdle + state.throttle * CONFIG.fuelBurn;
    state.fuel = Math.max(0, state.fuel - burn * dt);

    // Ground contact: landing, hard landing, or crash. A hair of slack
    // (1.15 not 1.2) so a fresh takeoff is not instantly re-grounded.
    const groundNow = groundHeightAt(state.pos.x, state.pos.z);
    if (!state.onGround && state.pos.y < groundNow + 1.15) {
      state.pos.y = groundNow + 1.2;
      const vs = -state.verticalSpeed;
      state.onGround = true;
      state.airborne = false;
      state.landed = true;
      events.touchedDown = true;
      if (vs > CONFIG.crashSpeed || state.damage >= 100) {
        state.crashed = true;
        events.crashed = true;
      } else if (vs > CONFIG.damageHardLanding * 0.45) {
        state.damage = Math.min(100, state.damage + CONFIG.damageHardLanding);
        events.hardLanding = true;
      }
      state.verticalSpeed = 0;
    }
    if (state.fuel <= 0 && !state.onGround) {
      // Dead stick: throttle dies, the plane glides down.
      state.throttle = 0;
    }

    // Apply to the mesh: position, heading, bank and pitch, prop spin.
    syncMesh(dt);
    return events;
  }

  // Copy the flight state onto the mesh (also used by screenshot staging,
  // which sets the state without stepping the physics).
  function syncMesh(dt) {
    group.position.copy(state.pos);
    group.rotation.set(state.pitch, state.heading, state.roll, 'YXZ');
    prop.rotation.z += (dt || 0) * (4 + state.throttle * 55);
  }

  // Height above the ground below, not above sea level.
  function altitudeFeet() { return Math.max(0, (state.pos.y - 1.2 - groundHeightAt(state.pos.x, state.pos.z)) * 3.281); }
  function speedKnots() { return state.speed * 1.944; }
  function headingDegrees() { return (( -state.heading * 180 / PI) % 360 + 360) % 360; }

  reset();
  return { state, reset, step, syncMesh, altitudeFeet, speedKnots, headingDegrees };
}
