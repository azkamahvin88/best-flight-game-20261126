// Kakatua-9 — screenshot staging. Each named shot sets the real game
// state (real physics values, real mission, real camera) and lets the
// renderer draw one honest frame of the live game: no posed props, no
// composited art. The shots are driven by ?shot=<name> in the URL.
import { CONFIG } from './config.js';
import { groundHeightAt } from './terrain.js';

function place(aircraft, x, y, z, heading, pitch, roll, speed, throttle) {
  const s = aircraft.state;
  s.pos.set(x, y, z);
  s.heading = heading;
  s.pitch = pitch;
  s.roll = roll;
  s.speed = speed;
  s.throttle = throttle;
  s.fuel = 78;
  s.damage = 6;
  s.onGround = false;
  s.airborne = true;
  s.verticalSpeed = 0;
  aircraft.syncMesh(0);
}

export function stageShot(name, game) {
  const { aircraft, missions, cameraRig, hud } = game;
  if (name === 'cockpit') {
    missions.start('rings');
    place(aircraft, -30, 62, -110, 0.15, 0.02, -0.08, 58, 0.72);
    if (cameraRig.mode !== 'cockpit') cameraRig.toggle();
    cameraRig.update(1);
    hud.showMessage('Ring 1 of 8 — through the gap!', 30);
    return 'play';
  }
  if (name === 'ring') {
    missions.start('rings');
    // Park the plane just before ring 3, on the racing line in from ring 2.
    place(aircraft, -245, 100, -470, 0.3, 0.03, 0.1, 60, 0.78);
    cameraRig.update(1);
    hud.showMessage('Ring 3 of 8 — line it up!', 30);
    return 'play';
  }
  if (name === 'landing') {
    missions.start('rescue');
    // Final approach to the far strip, runway ahead and below.
    place(aircraft, 620, 40, -360, 0.05, -0.05, 0, 36, 0.4);
    aircraft.state.flaps = true;
    cameraRig.update(1);
    hud.showMessage('Island Rescue — land on the far strip (Pulau Merak)', 30);
    return 'play';
  }
  // Default: cover — takeoff roll on the home strip, ring 1 ahead.
  missions.start('rings');
  const s = aircraft.state;
  s.pos.set(0, groundHeightAt(0, 60) + 1.2, 60);
  s.heading = 0;
  s.pitch = 0.06;
  s.roll = 0;
  s.speed = 42;
  s.throttle = 0.95;
  s.fuel = 96;
  s.damage = 0;
  s.onGround = true;
  s.airborne = false;
  aircraft.syncMesh(0);
  if (cameraRig.mode !== 'chase') cameraRig.toggle();
  cameraRig.snapTo(s);
  cameraRig.update(1);
  hud.showMessage('Ring Course — fly through ring 1 of 8!', 30);
  return 'play';
}
