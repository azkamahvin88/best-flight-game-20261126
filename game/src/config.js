// Kakatua-9 — shared tuning constants. One place for every number the
// flight model, the missions and the scenery agree on, so a tweak here
// retunes the whole game instead of one file.
export const CONFIG = {
  // Flight model
  maxSpeed: 92,          // m/s at full throttle, level flight
  cruiseSpeed: 55,
  stallSpeed: 24,        // below this the nose drops and lift fades
  accel: 14,             // m/s^2 toward the throttle target speed
  drag: 0.35,
  turnRate: 0.55,        // rad/s at full bank
  pitchRate: 0.5,
  yawRate: 0.3,
  climbRate: 11,         // m/s gained at full power, level pitch
  sinkRate: 9,           // m/s lost when stalled or throttled back
  gravity: 9.8,
  fuelCapacity: 100,
  fuelBurn: 0.55,        // per second at full throttle
  fuelBurnIdle: 0.08,
  damageHardLanding: 34, // vertical speed above this hurts the airframe
  crashSpeed: 14,        // vertical speed that ends the sortie
  groundY: 0,            // sea level; islands rise above it
  // World layout (metres). Home strip on Pulau Kakatua, second strip on
  // Pulau Merak across the lagoon.
  homeStrip: { x: 0, z: 0, heading: 0, length: 260, width: 26 },
  farStrip: { x: 620, z: -540, heading: 0.6, length: 240, width: 26 },
  volcano: { x: -420, z: -380, height: 150, radius: 190 },
  lighthouse: { x: 300, z: 260 },
  // Missions
  ringCount: 8,
  ringRadius: 16,
  cargoZone: { x: 380, z: -180, radius: 26 },
  rescuePickup: { x: 620, z: -540 }, // far strip
  // Scoring
  ringPoints: 150,
  ringTimeBonus: 4,      // seconds of bonus per ring, applied to the clock
  landingBonus: 300,
  smoothLandingBonus: 200,
  cargoPoints: 400,
  rescuePoints: 600,
  // Camera
  chaseDistance: 16,
  chaseHeight: 5,
  // Sunset palette, one style for sky, sea and islands
  skyTop: 0x2e2a6b,
  skyMid: 0xff8c5a,
  skyLow: 0xffc46b,
  sea: 0x1e6f8e,
  sand: 0xf2d492,
  grass: 0x4f9e57,
  forest: 0x2e7d4f,
};

export const MISSION_DEFS = [
  {
    id: 'rings',
    key: '1',
    name: 'Ring Course',
    blurb: 'Fly through all 8 glowing rings as fast as you can. Smooth turns save fuel.',
  },
  {
    id: 'cargo',
    key: '2',
    name: 'Cargo Drop',
    blurb: 'Carry the supply crate to Pulau Merak. Press SPACE over the yellow target circle to drop it.',
  },
  {
    id: 'rescue',
    key: '3',
    name: 'Island Rescue',
    blurb: 'Land on the far strip, pick up the stranded ranger, and bring them home before the fuel runs out.',
  },
];
