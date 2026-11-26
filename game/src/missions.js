// Kakatua-9 — the three missions. Ring Course strings eight glowing
// rings across the islands; Cargo Drop asks for one good drop over the
// yellow target circle; Island Rescue is a two-leg ferry with a landing
// in the middle. Each mission owns its rings, markers and scoring.
import { CONFIG, MISSION_DEFS } from './config.js';

function ringPositions() {
  // A tour around the volcano (never through it): out over the lagoon,
  // around the cone, past the lighthouse, down to the far strip and home.
  return [
    { x: 0, z: -160, y: 55 },
    { x: -180, z: -260, y: 70 },
    { x: -260, z: -520, y: 95 },
    { x: 0, z: -560, y: 80 },
    { x: 300, z: -480, y: 65 },
    { x: 620, z: -380, y: 60 },
    { x: 480, z: -140, y: 55 },
    { x: 180, z: -40, y: 60 },
  ];
}

function makeRingMesh(color) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(CONFIG.ringRadius, 1.6, 10, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(CONFIG.ringRadius * 0.55, 0.7, 8, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
  );
  ring.add(inner);
  return ring;
}

export function createMissions(scene, hud) {
  const group = new THREE.Group();
  scene.add(group);
  let mission = null;
  let ringIndex = 0;
  let ringMeshes = [];
  let cargo = null;      // the crate under the plane, then falling
  let cargoDropped = false;
  let rescueStage = 0;   // 0 = fly to far strip, 1 = carry ranger home
  let targetMarker = null;

  function clearGroup() {
    while (group.children.length) {
      const child = group.children.pop();
      group.remove(child);
    }
    ringMeshes = [];
    cargo = null;
    targetMarker = null;
  }

  function addTargetCircle(x, z, radius, color) {
    const circle = new THREE.Mesh(new THREE.RingGeometry(radius * 0.82, radius, 32),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(x, 1.2, z);
    group.add(circle);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 60, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18 }));
    beacon.position.set(x, 30, z);
    group.add(beacon);
    targetMarker = circle;
    return circle;
  }

  function start(missionId) {
    clearGroup();
    const def = MISSION_DEFS.find((m) => m.id === missionId) || MISSION_DEFS[0];
    mission = { id: def.id, name: def.name, done: false };
    ringIndex = 0;
    cargoDropped = false;
    rescueStage = 0;
    if (def.id === 'rings') {
      const positions = ringPositions();
      for (let i = 0; i < positions.length; i += 1) {
        const p = positions[i];
        const mesh = makeRingMesh(0xffd166);
        mesh.position.set(p.x, p.y, p.z);
        // Face the ring at the pilot flying in from the previous ring,
        // so it reads as a gate, not an edge.
        const prev = i === 0 ? { x: 0, y: 30, z: 60 } : positions[i - 1];
        mesh.lookAt(prev.x, prev.y, prev.z);
        group.add(mesh);
        ringMeshes.push(mesh);
      }
      hud.showMessage('Ring Course — fly through ring 1 of 8!', 4);
    } else if (def.id === 'cargo') {
      addTargetCircle(CONFIG.cargoZone.x, CONFIG.cargoZone.z, CONFIG.cargoZone.radius, 0xffd166);
      hud.showMessage('Cargo Drop — fly over the yellow circle and press SPACE.', 4);
    } else {
      addTargetCircle(CONFIG.farStrip.x, CONFIG.farStrip.z, 30, 0x37c978);
      hud.showMessage('Island Rescue — land on the far strip to pick up the ranger.', 4);
    }
    return mission;
  }

  function makeCrate() {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.9, flatShading: true }));
    const strap = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 2.3),
      new THREE.MeshStandardMaterial({ color: 0xffd166 }));
    crate.add(strap);
    return crate;
  }

  // Called every frame; returns score events for the game loop.
  function update(dt, aircraft, state) {
    const events = { ring: false, cargoHit: false, cargoMiss: false, rescued: false, missionDone: false, landedFar: false };
    if (!mission || mission.done) return events;
    const pos = aircraft.state.pos;
    if (mission.id === 'rings') {
      const target = ringPositions()[ringIndex];
      if (!target) return events;
      const dx = pos.x - target.x;
      const dy = pos.y - target.y;
      const dz = pos.z - target.z;
      if (dx * dx + dy * dy + dz * dz < CONFIG.ringRadius * CONFIG.ringRadius) {
        const mesh = ringMeshes[ringIndex];
        if (mesh) mesh.material.color.set(0x37c978);
        ringIndex += 1;
        state.score += CONFIG.ringPoints;
        state.elapsed = Math.max(0, state.elapsed - CONFIG.ringTimeBonus);
        events.ring = true;
        if (ringIndex >= CONFIG.ringCount) {
          mission.done = true;
          state.score += CONFIG.landingBonus;
          events.missionDone = true;
          hud.showMessage('Ring Course complete! Land at home for the bonus.', 4);
        } else {
          hud.showMessage(`Ring ${ringIndex + 1} of ${CONFIG.ringCount} — nice flying!`, 2);
        }
      }
      // Pulse the next ring so the pilot can find it at a glance.
      const next = ringMeshes[ringIndex];
      if (next) {
        const s = 1 + Math.sin(performance.now() / 300) * 0.06;
        next.scale.setScalar(s);
      }
    } else if (mission.id === 'cargo') {
      if (!cargo && !cargoDropped) {
        cargo = makeCrate();
        cargo.position.set(pos.x, pos.y - 2.4, pos.z);
        scene.add(cargo);
      }
      if (cargo && !cargoDropped) {
        cargo.position.set(pos.x, pos.y - 2.4, pos.z);
        if (state.dropPressed) {
          cargoDropped = true;
          state.dropPressed = false;
        }
      } else if (cargo && cargoDropped) {
        cargo.position.y -= 22 * dt;
        if (cargo.position.y <= 1.5) {
          const dx = cargo.position.x - CONFIG.cargoZone.x;
          const dz = cargo.position.z - CONFIG.cargoZone.z;
          const hit = dx * dx + dz * dz < CONFIG.cargoZone.radius * CONFIG.cargoZone.radius;
          if (hit) {
            state.score += CONFIG.cargoPoints;
            events.cargoHit = true;
            mission.done = true;
            events.missionDone = true;
            hud.showMessage('Crate delivered! +400. Fly home and land for the bonus.', 4);
          } else {
            events.cargoMiss = true;
            hud.showMessage('Crate missed the circle — the crate is lost. Press R to retry.', 4);
          }
          scene.remove(cargo);
          cargo = null;
        }
      }
    } else if (mission.id === 'rescue') {
      if (rescueStage === 0 && aircraft.state.onGround) {
        const dx = pos.x - CONFIG.farStrip.x;
        const dz = pos.z - CONFIG.farStrip.z;
        if (dx * dx + dz * dz < 60 * 60 && Math.abs(aircraft.state.speed) < 4) {
          rescueStage = 1;
          events.landedFar = true;
          state.score += 150;
          clearGroup();
          addTargetCircle(CONFIG.homeStrip.x, CONFIG.homeStrip.z, 30, 0x37c978);
          hud.showMessage('Ranger aboard! Fly them home to Pulau Kakatua.', 4);
        }
      } else if (rescueStage === 1 && aircraft.state.onGround) {
        const dx = pos.x - CONFIG.homeStrip.x;
        const dz = pos.z - CONFIG.homeStrip.z;
        if (dx * dx + dz * dz < 60 * 60 && Math.abs(aircraft.state.speed) < 4) {
          state.score += CONFIG.rescuePoints;
          mission.done = true;
          events.rescued = true;
          events.missionDone = true;
          hud.showMessage('Rescue complete! The ranger is home safe. +600', 4);
        }
      }
    }
    return events;
  }

  function missionLine() {
    if (!mission) return '';
    if (mission.id === 'rings') return `Ring Course — ring ${Math.min(ringIndex + 1, CONFIG.ringCount)} of ${CONFIG.ringCount}`;
    if (mission.id === 'cargo') return cargoDropped ? 'Cargo Drop — crate away, watch where it lands' : 'Cargo Drop — reach the yellow circle, press SPACE';
    if (mission.id === 'rescue') return rescueStage === 0 ? 'Island Rescue — land on the far strip (Pulau Merak)' : 'Island Rescue — ranger aboard, fly home!';
    return mission.name;
  }

  function reset() {
    clearGroup();
    mission = null;
    ringIndex = 0;
    rescueStage = 0;
  }

  return { start, update, missionLine, reset, get mission() { return mission; } };
}
