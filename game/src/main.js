// Kakatua-9 — bootstrap and game loop. Builds the renderer, the world
// and the plane, runs the menu / play / pause / over states, and hands
// the frame to the HUD and the cameras. One file, one job: wiring.
import { CONFIG, MISSION_DEFS } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createAircraft } from './aircraft.js';
import { buildTerrain, groundHeightAt } from './terrain.js';
import { buildSky } from './sky.js';
import { createHud } from './hud.js';
import { createMissions } from './missions.js';
import { createCamera } from './camera.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xff8c5a);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 4000);

const input = createInput(canvas);
const audio = createAudio();
const hud = createHud(document);
const aircraft = createAircraft(scene);
const terrain = buildTerrain(scene);
const sky = buildSky(scene);
const missions = createMissions(scene, hud);
const cameraRig = createCamera(camera, aircraft);

const state = {
  screen: 'menu', // menu | play | pause | over | win
  score: 0,
  elapsed: 0,
  missionLine: '',
  dropPressed: false,
  cockpit: false,
  aircraft,
};
let landedBonusGiven = false;
let overReason = '';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const statusEl = document.getElementById('status');

function setScreen(next) {
  state.screen = next;
  document.body.dataset.screen = next;
  const menu = document.getElementById('menu');
  const over = document.getElementById('over');
  if (menu) menu.style.display = next === 'menu' ? 'flex' : 'none';
  if (over) over.style.display = (next === 'over' || next === 'win') ? 'flex' : 'none';
  if (statusEl) statusEl.textContent = next === 'menu' ? 'Kakatua-9 menu. Choose a mission to fly.' : '';
}

function startMission(id) {
  audio.unlock();
  audio.click();
  missions.start(id);
  aircraft.reset();
  state.score = 0;
  state.elapsed = 0;
  landedBonusGiven = false;
  overReason = '';
  cameraRig.snapTo(aircraft.state);
  setScreen('play');
  hud.showMessage(`${MISSION_DEFS.find((m) => m.id === id).name} — throttle up with W, lift off past 45 kt!`, 5);
}

function endSortie(win, reason) {
  overReason = reason;
  const title = document.getElementById('over-title');
  const body = document.getElementById('over-body');
  const scoreEl = document.getElementById('over-score');
  if (title) title.textContent = win ? 'Sortie complete!' : 'Crashed!';
  if (body) body.textContent = reason;
  if (scoreEl) scoreEl.textContent = `Score: ${state.score}   Time: ${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}`;
  setScreen(win ? 'win' : 'over');
}

function checkLandingBonus() {
  const a = aircraft.state;
  if (!a.onGround || landedBonusGiven) return;
  const dx = a.pos.x - CONFIG.homeStrip.x;
  const dz = a.pos.z - CONFIG.homeStrip.z;
  const nearHome = dx * dx + dz * dz < 140 * 140;
  if (nearHome && Math.abs(a.speed) < 6 && missions.mission && missions.mission.done) {
    landedBonusGiven = true;
    state.score += CONFIG.landingBonus + (a.damage < 10 ? CONFIG.smoothLandingBonus : 0);
    hud.showMessage(`Landed home! +${CONFIG.landingBonus + (a.damage < 10 ? CONFIG.smoothLandingBonus : 0)} bonus.`, 4);
    endSortie(true, 'You brought Kakatua-9 home in one piece. The islands are yours.');
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0.016);
  frame.last = now;
  // Screenshot mode: the staged frame is the shot. Freeze the simulation
  // so the plane, the ring and the runway stay exactly where staged.
  if (shotName) {
    cameraRig.update(0.016);
    hud.update(state, dt);
    renderer.render(scene, camera);
    return;
  }
  input.consumeEdges();
  const inp = input.state;

  if (state.screen === 'menu') {
    if (inp.mission1) startMission('rings');
    else if (inp.mission2) startMission('cargo');
    else if (inp.mission3) startMission('rescue');
    else if (inp.start) startMission('rings');
    // Idle menu orbit: the plane sits on the strip, camera slowly circles
    // above the island (high enough to clear the terrain).
    const t = now / 1000;
    camera.position.set(Math.sin(t * 0.12) * 30, 42, 40 + Math.cos(t * 0.12) * 12);
    camera.lookAt(0, 26, 0);
    renderer.render(scene, camera);
    return;
  }
  if (state.screen === 'over' || state.screen === 'win') {
    if (inp.restart) { setScreen('menu'); }
    renderer.render(scene, camera);
    return;
  }
  if (inp.pause) {
    setScreen(state.screen === 'pause' ? 'play' : 'pause');
    hud.showMessage(state.screen === 'pause' ? 'Paused — press P to keep flying.' : '', 2);
  }
  if (state.screen === 'pause') {
    renderer.render(scene, camera);
    return;
  }
  if (inp.restart) { missions.reset(); aircraft.reset(); state.score = 0; state.elapsed = 0; landedBonusGiven = false; setScreen('menu'); return; }
  if (inp.camera) {
    cameraRig.toggle();
    state.cockpit = cameraRig.mode === 'cockpit';
    hud.showMessage(cameraRig.mode === 'cockpit' ? 'Cockpit view' : 'Chase view', 1.5);
  }
  if (inp.mission1) startMission('rings');
  else if (inp.mission2) startMission('cargo');
  else if (inp.mission3) startMission('rescue');

  state.dropPressed = !!inp.drop;
  state.elapsed += dt;
  const events = aircraft.step(dt, inp, groundHeightAt);
  audio.setEngine(aircraft.state.throttle, aircraft.state.speed, aircraft.state.airborne);
  if (events.tookOff) { audio.thud(); hud.showMessage('Airborne! Mind your fuel and watch the rings.', 3); }
  if (events.hardLanding) { audio.thud(); hud.showMessage(`Hard landing! Airframe damage ${Math.round(aircraft.state.damage)}%.`, 3); }
  if (events.touchedDown && !events.crashed) audio.thud();
  if (events.crashed) {
    audio.crash();
    endSortie(false, 'Kakatua-9 hit the ground too hard. Press R for the menu and try again — gentle on the stick next time.');
    renderer.render(scene, camera);
    return;
  }
  const missionEvents = missions.update(dt, aircraft, state);
  if (missionEvents.ring) audio.ringChime();
  if (missionEvents.cargoHit) audio.ringChime();
  if (missionEvents.cargoMiss) audio.crash();
  if (missionEvents.landedFar || missionEvents.rescued) audio.pickup();
  if (aircraft.state.fuel <= 0 && !aircraft.state.onGround) {
    hud.showMessage('Fuel empty! Glide to the nearest strip.', 2);
  }
  if (aircraft.state.damage >= 100 && !aircraft.state.crashed) {
    aircraft.state.crashed = true;
    audio.crash();
    endSortie(false, 'The airframe gave out after too many hard landings.');
    renderer.render(scene, camera);
    return;
  }
  checkLandingBonus();
  state.missionLine = missions.missionLine();
  state.cockpit = cameraRig.mode === 'cockpit';

  sky.update(dt, now / 1000);
  terrain.sea.position.y = Math.sin(now / 1400) * 0.25;
  terrain.smoke.forEach((puff, i) => {
    puff.position.y += dt * 1.2;
    if (puff.position.y > CONFIG.volcano.height + 110) puff.position.y = CONFIG.volcano.height + 12;
    puff.position.x += Math.sin(now / 900 + i) * dt * 2;
  });
  cameraRig.update(dt);
  hud.update(state, dt);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Debug hook for play-testing (read-only state, no gameplay effect).
window.__kakatua = { aircraft, missions, state, cameraRig };
for (const button of document.querySelectorAll('[data-mission]')) {
  button.addEventListener('click', () => startMission(button.dataset.mission));
}
document.getElementById('over-restart')?.addEventListener('click', () => setScreen('menu'));
document.getElementById('menu-sound')?.addEventListener('click', (e) => {
  const on = audio.toggle();
  e.currentTarget.textContent = on ? 'Sound: on' : 'Sound: off';
});
canvas.addEventListener('pointerdown', () => audio.unlock());

// Screenshot mode: stage a real frame and keep rendering it.
if (shotName) {
  setScreen('play');
  stageShot(shotName, { aircraft, missions, cameraRig, hud });
  state.score = 450;
  state.elapsed = 96;
  state.missionLine = missions.missionLine();
  state.cockpit = cameraRig.mode === 'cockpit';
  hud.update(state, 0.016);
  document.body.dataset.screen = 'play';
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = 'none';
} else {
  setScreen('menu');
}

requestAnimationFrame(frame);
