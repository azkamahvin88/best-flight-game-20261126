// Kakatua-9 — the sunset sky: a gradient dome, a low sun, drifting
// low-poly clouds and soft fog, all in the same orange-purple palette as
// the sea and islands below.
import { CONFIG } from './config.js';

export function buildSky(scene) {
  // Gradient dome: vertex-coloured sphere, back side in.
  const geo = new THREE.SphereGeometry(1400, 24, 16);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const top = new THREE.Color(CONFIG.skyTop);
  const mid = new THREE.Color(CONFIG.skyMid);
  const low = new THREE.Color(CONFIG.skyLow);
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i) / 1400; // -1 .. 1
    const c = y > 0.25 ? top.clone().lerp(mid, 1 - (y - 0.25) / 0.75)
      : mid.clone().lerp(low, 1 - (y + 0.15) / 0.4);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, fog: false,
  }));
  scene.add(dome);

  // Low sun: a glowing disc plus a halo sprite made on a canvas.
  const sunCanvas = document.createElement('canvas');
  sunCanvas.width = 128;
  sunCanvas.height = 128;
  const g = sunCanvas.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,236,170,1)');
  grad.addColorStop(0.35, 'rgba(255,170,80,0.85)');
  grad.addColorStop(1, 'rgba(255,120,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const sunTex = new THREE.CanvasTexture(sunCanvas);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, fog: false, depthWrite: false }));
  sun.scale.setScalar(340);
  sun.position.set(-900, 170, -1100);
  scene.add(sun);

  // Flat-shaded clouds: clusters of white spheres, slow drift.
  const clouds = [];
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffe8d8, roughness: 1, flatShading: true, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 14; i += 1) {
    const cloud = new THREE.Group();
    const puffs = 3 + (i % 3);
    for (let j = 0; j < puffs; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(14 + ((i * j + 5) % 12), 8, 6), cloudMat);
      puff.position.set(j * 16 - puffs * 8, ((i + j) % 5) * 2, ((j * 7) % 11) - 5);
      puff.scale.y = 0.45;
      cloud.add(puff);
    }
    cloud.position.set(-900 + ((i * 173) % 1800), 150 + ((i * 29) % 90), -900 + ((i * 211) % 1800));
    scene.add(cloud);
    clouds.push(cloud);
  }

  scene.fog = new THREE.Fog(0xf7a56b, 500, 1500);

  // Sunset key light + soft fill so the low-poly shapes read clearly.
  const sunLight = new THREE.DirectionalLight(0xffb36b, 1.6);
  sunLight.position.set(-600, 220, -700);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -260;
  sunLight.shadow.camera.right = 260;
  sunLight.shadow.camera.top = 260;
  sunLight.shadow.camera.bottom = -260;
  sunLight.shadow.camera.far = 2200;
  scene.add(sunLight);
  const hemi = new THREE.HemisphereLight(0x8a7fd8, 0x2e6f8e, 0.75);
  scene.add(hemi);
  // Warm fill from the east so the shadow side of the volcano and the
  // islands never falls to black at sunset.
  const fill = new THREE.DirectionalLight(0xff9a7a, 0.95);
  fill.position.set(700, 300, 600);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffd9b0, 0.25));

  return {
    sunLight,
    clouds,
    update(dt, time) {
      for (const cloud of clouds) {
        cloud.position.x += dt * 1.6;
        if (cloud.position.x > 1000) cloud.position.x = -1000;
      }
      sunLight.target.position.set(0, 0, 0);
    },
  };
}
