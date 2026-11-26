// Kakatua-9 — the recognisable tropical archipelago: a sunset sea, three
// islands with sand beaches and palm forest, a smoking volcano, a
// lighthouse, a village, and two grass airstrips. Also answers the one
// question the flight model asks: how high is the ground here?
import { CONFIG } from './config.js';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...opts });
}

// Smooth bump: 1 at the centre, 0 past the radius.
function bump(x, z, cx, cz, r) {
  const dx = (x - cx) / r;
  const dz = (z - cz) / r;
  const d2 = dx * dx + dz * dz;
  if (d2 >= 1) return 0;
  const t = 1 - d2;
  return t * t * (3 - 2 * t);
}

export function groundHeightAt(x, z) {
  const v = CONFIG.volcano;
  let h = 0;
  h += bump(x, z, 0, 0, 260) * 26;            // Pulau Kakatua (home)
  h += bump(x, z, 620, -540, 230) * 22;       // Pulau Merak (far strip)
  h += bump(x, z, v.x, v.z, v.radius) * v.height; // volcano cone
  h += bump(x, z, -260, 420, 170) * 14;       // small green islet
  return h;
}

function makePalm() {
  const palm = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 7, 6), mat(0x8a5a2b));
  trunk.position.y = 3.5;
  trunk.rotation.z = 0.12;
  palm.add(trunk);
  for (let i = 0; i < 6; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4.2, 4), mat(0x2e7d4f));
    leaf.position.y = 7.2;
    leaf.rotation.z = Math.PI / 2.4;
    leaf.rotation.y = (i * Math.PI) / 3;
    leaf.position.x = Math.cos((i * Math.PI) / 3) * 1.4;
    leaf.position.z = Math.sin((i * Math.PI) / 3) * 1.4;
    palm.add(leaf);
  }
  palm.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  return palm;
}

function makeHouse() {
  const house = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, 5), mat(0xf7e8c8));
  walls.position.y = 1.7;
  house.add(walls);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.6, 4), mat(0xc94f2e));
  roof.position.y = 4.7;
  roof.rotation.y = Math.PI / 4;
  house.add(roof);
  house.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  return house;
}

function makeRunway(strip, label) {
  const group = new THREE.Group();
  const y = groundHeightAt(strip.x, strip.z) + 0.15;
  const grass = new THREE.Mesh(new THREE.BoxGeometry(strip.width + 14, 0.3, strip.length + 20),
    mat(0x6fae4e));
  grass.position.set(strip.x, y, strip.z);
  grass.rotation.y = strip.heading;
  group.add(grass);
  const dirt = new THREE.Mesh(new THREE.BoxGeometry(strip.width, 0.35, strip.length), mat(0xc9a06a));
  dirt.position.set(strip.x, y + 0.05, strip.z);
  dirt.rotation.y = strip.heading;
  group.add(dirt);
  // White centre dashes and windsock so the strip reads as a runway.
  for (let i = -4; i <= 4; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 8), mat(0xffffff));
    const along = i * (strip.length / 9);
    dash.position.set(
      strip.x - Math.sin(strip.heading) * along,
      y + 0.25,
      strip.z - Math.cos(strip.heading) * along,
    );
    dash.rotation.y = strip.heading;
    group.add(dash);
  }
  const sockPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 6), mat(0xeeeeee));
  sockPole.position.set(strip.x + 16, y + 4.5, strip.z + strip.length / 2 - 8);
  group.add(sockPole);
  const sock = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.4, 8), mat(0xff7a1a));
  sock.rotation.z = Math.PI / 2;
  sock.position.set(strip.x + 16, y + 8.4, strip.z + strip.length / 2 - 8);
  group.add(sock);
  return group;
}

export function buildTerrain(scene) {
  // Sea: one big plane at y=0, gently animated by the main loop's swell.
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(3200, 3200, 48, 48),
    new THREE.MeshStandardMaterial({ color: CONFIG.sea, roughness: 0.35, metalness: 0.25, flatShading: true }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.receiveShadow = true;
  scene.add(sea);

  // Islands: displaced disc geometry, sand rim, grass top, forest bumps.
  const islands = [
    { x: 0, z: 0, r: 260, h: 26, seed: 11 },
    { x: 620, z: -540, r: 230, h: 22, seed: 29 },
    { x: -420, z: -380, r: 190, h: CONFIG.volcano.height, seed: 47, volcano: true },
    { x: -260, z: 420, r: 170, h: 14, seed: 73 },
  ];
  for (const isl of islands) {
    const geo = new THREE.CircleGeometry(isl.r, 40, 0, Math.PI * 2);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const d = Math.sqrt(px * px + pz * pz) / isl.r;
      const edge = Math.max(0, 1 - d);
      const hill = isl.volcano
        ? Math.pow(edge, 1.4) * isl.h
        : (Math.sin(px * 0.02 + isl.seed) * 0.5 + 0.5) * 6 * edge + edge * edge * isl.h * 0.55;
      pos.setY(i, Math.max(0.4, hill));
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat(isl.volcano ? 0xa87f66 : CONFIG.grass));
    mesh.position.set(isl.x, 0.4, isl.z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    // Sand beach ring.
    const beach = new THREE.Mesh(new THREE.RingGeometry(isl.r * 0.86, isl.r * 1.02, 40),
      mat(CONFIG.sand));
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(isl.x, 0.55, isl.z);
    scene.add(beach);
    // Palm clusters on the green islands.
    if (!isl.volcano) {
      for (let i = 0; i < 16; i += 1) {
        const angle = ((i * 2.399 + isl.seed) % (Math.PI * 2));
        const dist = isl.r * (0.35 + ((i * 37) % 50) / 100);
        const palm = makePalm();
        palm.position.set(isl.x + Math.cos(angle) * dist, groundHeightAt(isl.x + Math.cos(angle) * dist, isl.z + Math.sin(angle) * dist), isl.z + Math.sin(angle) * dist);
        const s = 0.8 + ((i * 13) % 40) / 100;
        palm.scale.setScalar(s);
        scene.add(palm);
      }
    }
  }

  // Volcano crater glow + smoke column.
  const crater = new THREE.Mesh(new THREE.CircleGeometry(34, 20),
    new THREE.MeshBasicMaterial({ color: 0xff5a1a }));
  crater.rotation.x = -Math.PI / 2;
  crater.position.set(CONFIG.volcano.x, CONFIG.volcano.height + 1, CONFIG.volcano.z);
  scene.add(crater);
  const smoke = [];
  for (let i = 0; i < 10; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(4 + i * 0.6, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xd8cfc4, roughness: 1, flatShading: true, transparent: true, opacity: 0.4 }));
    puff.position.set(CONFIG.volcano.x + i * 3 + Math.sin(i * 1.7) * 6, CONFIG.volcano.height + 12 + i * 9, CONFIG.volcano.z + Math.cos(i * 1.3) * 6);
    puff.scale.y = 0.7;
    scene.add(puff);
    smoke.push(puff);
  }

  // Lighthouse on the point east of home island.
  const lh = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.4, 26, 10), mat(0xf2ead8));
  tower.position.y = 13;
  lh.add(tower);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 4, 10), mat(0xd23c2e));
  band.position.y = 18;
  lh.add(band);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  lamp.position.y = 27;
  lh.add(lamp);
  lh.position.set(CONFIG.lighthouse.x, groundHeightAt(CONFIG.lighthouse.x, CONFIG.lighthouse.z), CONFIG.lighthouse.z);
  lh.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  scene.add(lh);

  // Village of six houses beside the home strip.
  for (let i = 0; i < 6; i += 1) {
    const house = makeHouse();
    const hx = -70 + (i % 3) * 26;
    const hz = 150 + Math.floor(i / 3) * 30;
    house.position.set(hx, groundHeightAt(hx, hz), hz);
    house.rotation.y = i * 0.7;
    scene.add(house);
  }

  scene.add(makeRunway(CONFIG.homeStrip, 'home'));
  scene.add(makeRunway(CONFIG.farStrip, 'far'));

  return { sea, smoke, lamp };
}
