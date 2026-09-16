import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// =============================================================================
// 1. KHỞI TẠO SCENE, CAMERA, RENDERER & CONTROLS
// =============================================================================

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100000
);
camera.position.set(0, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;
controls.enabled = false;
controls.target.set(0, 0, 0);
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 300;
controls.zoomSpeed = 0.3;
controls.rotateSpeed = 0.3;
controls.update();

// =============================================================================
// 2. QUẦNG SÁNG TRUNG TÂM & TINH VÂN (GLOW & NEBULA)
// =============================================================================

function createGlowMaterial(color, size = 128, opacity = 0.55) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Sprite(material);
}

// Quầng sáng ở tâm
const centralGlow = createGlowMaterial('rgba(255,255,255,0.8)', 156, 0.25);
centralGlow.scale.set(8, 8, 1);
centralGlow.name = 'main-glow';
scene.add(centralGlow);

// Các đám mây tinh vân đa sắc
for (let i = 0; i < 15; i++) {
  const hue = Math.random() * 360;
  const color = 'hsla(' + hue + ', 80%, 50%, 0.6)';
  const nebula = createGlowMaterial(color, 256);
  nebula.scale.set(100, 100, 1);
  nebula.position.set(
    (Math.random() - 0.5) * 175,
    (Math.random() - 0.5) * 175,
    (Math.random() - 0.5) * 175
  );
  scene.add(nebula);
}

// =============================================================================
// 3. THIÊN HÀ HẠT (GALAXY PARTICLES)
// =============================================================================

const galaxyParameters = {
  count: 100000,
  arms: 6,
  radius: 100,
  spin: 0.5,
  randomness: 0.2,
  randomnessPower: 20,
  insideColor: new THREE.Color(0xd63ed6),
  outsideColor: new THREE.Color(0x48b8b8),
};

const heartImages = [
  ...(window.dataLove2Loveloom &&
  window.dataLove2Loveloom.data &&
  window.dataLove2Loveloom.data.heartImages
    ? window.dataLove2Loveloom.data.heartImages
    : []),
  './image/1.jpg',
  './image/2.jpg',
  './image/3.jpg',
  './image/4.jpg',
  './image/5.jpg',
  './image/6.jpg',
  './image/7.jpg',
  './image/8.jpg',
  './image/9.jpg',
];

const numGroups = heartImages.length;
const maxDensity = 15000;
const minDensity = 4000;
const maxGroupsForScale = 6;

let pointsPerGroup;
if (numGroups <= 1) {
  pointsPerGroup = maxDensity;
} else if (numGroups >= maxGroupsForScale) {
  pointsPerGroup = minDensity;
} else {
  const t = (numGroups - 1) / (maxGroupsForScale - 1);
  pointsPerGroup = Math.floor(maxDensity * (1 - t) + minDensity * t);
}

if (pointsPerGroup * numGroups > galaxyParameters.count) {
  pointsPerGroup = Math.floor(galaxyParameters.count / numGroups);
}

console.log('Số lượng ảnh: ' + numGroups + ', Điểm mỗi ảnh: ' + pointsPerGroup);

const positions = new Float32Array(galaxyParameters.count * 3);
const colors = new Float32Array(galaxyParameters.count * 3);
let pointIdx = 0;

for (let i = 0; i < galaxyParameters.count; i++) {
  const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;
  const branchAngle = ((i % galaxyParameters.arms) / galaxyParameters.arms) * Math.PI * 2;
  const spinAngle = radius * galaxyParameters.spin;

  const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
  const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
  const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
  const totalAngle = branchAngle + spinAngle;

  if (radius < 30 && Math.random() < 0.7) continue;

  const i3 = pointIdx * 3;
  positions[i3] = Math.cos(totalAngle) * radius + randomX;
  positions[i3 + 1] = randomY;
  positions[i3 + 2] = Math.sin(totalAngle) * radius + randomZ;

  const mixedColor = new THREE.Color(0xff66ff);
  mixedColor.lerp(new THREE.Color(0x66ffff), radius / galaxyParameters.radius);
  mixedColor.multiplyScalar(0.7 + 0.3 * Math.random());

  colors[i3] = mixedColor.r;
  colors[i3 + 1] = mixedColor.g;
  colors[i3 + 2] = mixedColor.b;

  pointIdx++;
}

const galaxyGeometry = new THREE.BufferGeometry();
galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, pointIdx * 3), 3));
galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, pointIdx * 3), 3));

const galaxyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uSize: { value: 50 * renderer.getPixelRatio() },
    uRippleTime: { value: -1 },
    uRippleSpeed: { value: 40 },
    uRippleWidth: { value: 20 },
  },
  vertexShader: `
    uniform float uSize;
    uniform float uTime;
    uniform float uRippleTime;
    uniform float uRippleSpeed;
    uniform float uRippleWidth;

    varying vec3 vColor;

    void main() {
        // Lấy màu gốc từ geometry (giống hệt vertexColors: true)
        vColor = color;

        vec4 modelPosition = modelMatrix * vec4(position, 1.0);

        // ---- LOGIC HIỆU ỨNG GỢN SÓNG ----
        if (uRippleTime > 0.0) {
            float rippleRadius = (uTime - uRippleTime) * uRippleSpeed;
            float particleDist = length(modelPosition.xyz);

            float strength = 1.0 - smoothstep(rippleRadius - uRippleWidth, rippleRadius + uRippleWidth, particleDist);
            strength *= smoothstep(rippleRadius + uRippleWidth, rippleRadius - uRippleWidth, particleDist);

            if (strength > 0.0) {
                vColor += vec3(strength * 2.0); // Làm màu sáng hơn khi sóng đi qua
            }
        }

        vec4 viewPosition = viewMatrix * modelPosition;
        gl_Position = projectionMatrix * viewPosition;
        // Dòng này làm cho các hạt nhỏ hơn khi ở xa, mô phỏng hành vi của PointsMaterial
        gl_PointSize = uSize / -viewPosition.z;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
        // Làm cho các hạt có hình tròn thay vì hình vuông
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;

        gl_FragColor = vec4(vColor, 1.0);
    }
  `,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  vertexColors: true,
});

const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);

// =============================================================================
// 4. HÌNH ẢNH TRÁI TIM DẠNG HẠT (NEON TEXTURES & POINT CLOUDS)
// =============================================================================

function createNeonTexture(image, size) {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * dpr;
  canvas.style.width = canvas.style.height = size + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const aspectRatio = image.width / image.height;
  let drawWidth, drawHeight, offsetX, offsetY;

  if (aspectRatio > 1) {
    drawWidth = size;
    drawHeight = size / aspectRatio;
    offsetX = 0;
    offsetY = (size - drawHeight) / 2;
  } else {
    drawHeight = size;
    drawWidth = size * aspectRatio;
    offsetX = (size - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.clearRect(0, 0, size, size);
  const radius = size * 0.1;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(offsetX + radius, offsetY);
  ctx.lineTo(offsetX + drawWidth - radius, offsetY);
  ctx.arcTo(offsetX + drawWidth, offsetY, offsetX + drawWidth, offsetY + radius, radius);
  ctx.lineTo(offsetX + drawWidth, offsetY + drawHeight - radius);
  ctx.arcTo(offsetX + drawWidth, offsetY + drawHeight, offsetX + drawWidth - radius, offsetY + drawHeight, radius);
  ctx.lineTo(offsetX + radius, offsetY + drawHeight);
  ctx.arcTo(offsetX, offsetY + drawHeight, offsetX, offsetY + drawHeight - radius, radius);
  ctx.lineTo(offsetX, offsetY + radius);
  ctx.arcTo(offsetX, offsetY, offsetX + radius, offsetY, radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const heartPointClouds = [];

for (let group = 0; group < numGroups; group++) {
  const groupPositions = new Float32Array(pointsPerGroup * 3);
  const groupColorsNear = new Float32Array(pointsPerGroup * 3);
  const groupColorsFar = new Float32Array(pointsPerGroup * 3);
  let validPointCount = 0;

  for (let i = 0; i < pointsPerGroup; i++) {
    const idx = validPointCount * 3;
    const globalIdx = group * pointsPerGroup + i;
    const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;

    if (radius < 30) continue;

    const branchAngle = ((globalIdx % galaxyParameters.arms) / galaxyParameters.arms) * Math.PI * 2;
    const spinAngle = radius * galaxyParameters.spin;

    const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
    const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const totalAngle = branchAngle + spinAngle;

    groupPositions[idx] = Math.cos(totalAngle) * radius + randomX;
    groupPositions[idx + 1] = randomY;
    groupPositions[idx + 2] = Math.sin(totalAngle) * radius + randomZ;

    const colorNear = new THREE.Color(0xffffff);
    groupColorsNear[idx] = colorNear.r;
    groupColorsNear[idx + 1] = colorNear.g;
    groupColorsNear[idx + 2] = colorNear.b;

    const colorFar = galaxyParameters.insideColor.clone();
    colorFar.lerp(galaxyParameters.outsideColor, radius / galaxyParameters.radius);
    colorFar.multiplyScalar(0.7 + 0.3 * Math.random());

    groupColorsFar[idx] = colorFar.r;
    groupColorsFar[idx + 1] = colorFar.g;
    groupColorsFar[idx + 2] = colorFar.b;

    validPointCount++;
  }

  if (validPointCount === 0) continue;

  const groupGeometryNear = new THREE.BufferGeometry();
  groupGeometryNear.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
  groupGeometryNear.setAttribute('color', new THREE.BufferAttribute(groupColorsNear.slice(0, validPointCount * 3), 3));

  const groupGeometryFar = new THREE.BufferGeometry();
  groupGeometryFar.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
  groupGeometryFar.setAttribute('color', new THREE.BufferAttribute(groupColorsFar.slice(0, validPointCount * 3), 3));

  const posAttr = groupGeometryFar.getAttribute('position');
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < posAttr.count; i++) {
    cx += posAttr.getX(i);
    cy += posAttr.getY(i);
    cz += posAttr.getZ(i);
  }
  cx /= posAttr.count;
  cy /= posAttr.count;
  cz /= posAttr.count;

  groupGeometryNear.translate(-cx, -cy, -cz);
  groupGeometryFar.translate(-cx, -cy, -cz);

  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  img.src = heartImages[group];
  img.onload = () => {
    const neonTexture = createNeonTexture(img, 256);

    const materialNear = new THREE.PointsMaterial({
      size: 1.8,
      map: neonTexture,
      transparent: false,
      alphaTest: 0.2,
      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
      vertexColors: true,
    });

    const materialFar = new THREE.PointsMaterial({
      size: 1.8,
      map: neonTexture,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const pointsMesh = new THREE.Points(groupGeometryFar, materialFar);
    pointsMesh.position.set(cx, cy, cz);
    pointsMesh.userData.materialNear = materialNear;
    pointsMesh.userData.geometryNear = groupGeometryNear;
    pointsMesh.userData.materialFar = materialFar;
    pointsMesh.userData.geometryFar = groupGeometryFar;

    scene.add(pointsMesh);
    heartPointClouds.push(pointsMesh);
  };
}

// =============================================================================
// 5. BẦU TRỜI SAO & SAO BĂNG (STARFIELD & SHOOTING STARS)
// =============================================================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const starCount = 20000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 900;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.7,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
});

const starField = new THREE.Points(starGeometry, starMaterial);
starField.name = 'starfield';
starField.renderOrder = 999;
scene.add(starField);

let shootingStars = [];

function createRandomCurve() {
  const p0 = new THREE.Vector3(
    -200 + Math.random() * 100,
    -100 + Math.random() * 200,
    -100 + Math.random() * 200
  );
  const p3 = new THREE.Vector3(
    600 + Math.random() * 200,
    p0.y + (-100 + Math.random() * 200),
    p0.z + (-100 + Math.random() * 200)
  );
  const p1 = new THREE.Vector3(
    p0.x + 200 + Math.random() * 100,
    p0.y + (-50 + Math.random() * 100),
    p0.z + (-50 + Math.random() * 100)
  );
  const p2 = new THREE.Vector3(
    p3.x - 200 + Math.random() * 100,
    p3.y + (-50 + Math.random() * 100),
    p3.z + (-50 + Math.random() * 100)
  );

  return new THREE.CubicBezierCurve3(p0, p1, p2, p3);
}

function createShootingStar() {
  const trailLength = 100;
  const sphereGeom = new THREE.SphereGeometry(2, 32, 32);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const headMesh = new THREE.Mesh(sphereGeom, sphereMat);

  const glowGeom = new THREE.SphereGeometry(3, 32, 32);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform float time;
      void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * (0.8 + sin(time * 5.0) * 0.2));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });

  const glowMesh = new THREE.Mesh(glowGeom, glowMat);
  headMesh.add(glowMesh);

  // Thêm quầng sáng hành tinh nếu chưa có
  if (planet && !planet.userData.hasAtmosphereGlow) {
    const atmosphereGeom = new THREE.SphereGeometry(planetRadius * 1.05, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0xe0b3ff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    planet.add(atmosphereMesh);
    planet.userData.hasAtmosphereGlow = true;
  }

  const curve = createRandomCurve();
  const trailPoints = [];
  for (let i = 0; i < trailLength; i++) {
    const progress = i / (trailLength - 1);
    trailPoints.push(curve.getPoint(progress));
  }

  const trailGeom = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const trailMat = new THREE.LineBasicMaterial({
    color: 0x99eaff,
    transparent: true,
    opacity: 0.7,
    linewidth: 2,
  });
  const trailLine = new THREE.Line(trailGeom, trailMat);

  const starGroup = new THREE.Group();
  starGroup.add(headMesh);
  starGroup.add(trailLine);
  starGroup.userData = {
    curve: curve,
    progress: 0,
    speed: 0.001 + Math.random() * 0.001,
    life: 0,
    maxLife: 300,
    head: headMesh,
    trail: trailLine,
    trailLength: trailLength,
    trailPoints: trailPoints,
  };

  scene.add(starGroup);
  shootingStars.push(starGroup);
}

// =============================================================================
// 6. TINH CẦU TRUNG TÂM (CENTRAL PLANET)
// =============================================================================

function createPlanetTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, size / 8,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, '#f8bbd0');
  gradient.addColorStop(0.12, '#f48fb1');
  gradient.addColorStop(0.22, '#f06292');
  gradient.addColorStop(0.35, '#ffffff');
  gradient.addColorStop(0.5, '#e1aaff');
  gradient.addColorStop(0.62, '#a259f7');
  gradient.addColorStop(0.75, '#b2ff59');
  gradient.addColorStop(1, '#3fd8c7');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const spotColors = [
    '#f8bbd0', '#f8bbd0', '#f48fb1', '#f48fb1',
    '#f06292', '#f06292', '#ffffff', '#e1aaff',
    '#a259f7', '#b2ff59'
  ];

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 30 + Math.random() * 120;
    const color = spotColors[Math.floor(Math.random() * spotColors.length)];

    const spotGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    spotGrad.addColorStop(0, color + 'cc');
    spotGrad.addColorStop(1, color + '00');

    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, size, size);
  }

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.bezierCurveTo(
      Math.random() * size, Math.random() * size,
      Math.random() * size, Math.random() * size,
      Math.random() * size, Math.random() * size
    );
    ctx.strokeStyle = 'rgba(180, 120, 200, ' + (0.12 + Math.random() * 0.18) + ')';
    ctx.lineWidth = 8 + Math.random() * 18;
    ctx.stroke();
  }

  if (ctx.filter !== undefined) {
    ctx.filter = 'blur(2px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  }

  return new THREE.CanvasTexture(canvas);
}

const stormShader = {
  uniforms: {
    time: { value: 0 },
    baseTexture: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform sampler2D baseTexture;
    varying vec2 vUv;
    void main() {
        vec2 uv = vUv;
        float angle = length(uv - vec2(0.5)) * 3.0;
        float twist = sin(angle * 3.0 + time) * 0.1;
        uv.x += twist * sin(time * 0.5);
        uv.y += twist * cos(time * 0.5);
        vec4 texColor = texture2D(baseTexture, uv);
        float noise = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.1;
        texColor.rgb += noise * vec3(0.8, 0.4, 0.2);
        gl_FragColor = texColor;
    }
  `,
};

const planetRadius = 10;
const planetGeometry = new THREE.SphereGeometry(planetRadius, 48, 48);
const planetTexture = createPlanetTexture();
const planetMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    baseTexture: { value: planetTexture },
  },
  vertexShader: stormShader.vertexShader,
  fragmentShader: stormShader.fragmentShader,
});

const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0);
planet.name = 'main-planet';
scene.add(planet);

// =============================================================================
// 7. CÁC VÒNG CHỮ XOAY QUANH TINH CẦU (TEXT RINGS)
// =============================================================================

const ringTexts = [
  'Love',
  ...(window.dataLove2Loveloom &&
  window.dataLove2Loveloom.data &&
  window.dataLove2Loveloom.data.ringTexts
    ? window.dataLove2Loveloom.data.ringTexts
    : []),
];

function createTextRings() {
  const numRings = ringTexts.length;
  const baseRadius = planetRadius * 1.1;
  const ringSpacing = 5;
  window.textRings = [];

  for (let i = 0; i < numRings; i++) {
    const textString = ringTexts[i % ringTexts.length] + '   ';
    const ringRadius = baseRadius + i * ringSpacing;

    function detectLanguage(char) {
      const code = char.charCodeAt(0);
      if (
        (code >= 0x4e00 && code <= 0x9fff) ||
        (code >= 0x3040 && code <= 0x309f) ||
        (code >= 0x30a0 && code <= 0x30ff) ||
        (code >= 0xac00 && code <= 0xd7af)
      ) {
        return 'cjk';
      } else if (code >= 0 && code <= 0x7f) {
        return 'latin';
      }
      return 'other';
    }

    const charCounts = { cjk: 0, latin: 0, other: 0 };
    for (const char of textString) {
      charCounts[detectLanguage(char)]++;
    }

    const totalChars = textString.length;
    const cjkRatio = charCounts.cjk / totalChars;

    let ringConfig = { fontScale: 0.75, spacingScale: 1.1 };
    if (i === 0) {
      ringConfig.fontScale = 0.55;
      ringConfig.spacingScale = 0.9;
    } else if (i === 1) {
      ringConfig.fontScale = 0.65;
      ringConfig.spacingScale = 1;
    }

    if (cjkRatio > 0) {
      ringConfig.fontScale *= 0.9;
      ringConfig.spacingScale *= 1.1;
    }

    const canvasHeight = 200;
    const fontSize = Math.max(120, 0.9 * canvasHeight);

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'bold ' + fontSize + 'px Arial, sans-serif';

    const singleText = ringTexts[i % ringTexts.length];
    const unitText = singleText + '   ';
    const unitWidth = measureCtx.measureText(unitText).width;

    const circumference = 2 * Math.PI * ringRadius * 180;
    const repeatCount = Math.ceil(circumference / unitWidth);

    let repeatedText = '';
    for (let r = 0; r < repeatCount; r++) {
      repeatedText += unitText;
    }

    let totalWidth = unitWidth * repeatCount;
    if (totalWidth < 1 || !repeatedText) {
      repeatedText = unitText;
      totalWidth = unitWidth;
    }

    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = Math.ceil(Math.max(1, totalWidth));
    ringCanvas.height = canvasHeight;

    const ringCtx = ringCanvas.getContext('2d');
    ringCtx.clearRect(0, 0, ringCanvas.width, canvasHeight);
    ringCtx.font = 'bold ' + fontSize + 'px Arial, sans-serif';
    ringCtx.fillStyle = 'white';
    ringCtx.textAlign = 'left';
    ringCtx.textBaseline = 'alphabetic';

    // Đổ bóng phát sáng viền chữ
    ringCtx.shadowColor = '#e0b3ff';
    ringCtx.shadowBlur = 24;
    ringCtx.lineWidth = 6;
    ringCtx.strokeStyle = '#fff';
    ringCtx.strokeText(repeatedText, 0, canvasHeight * 0.8);

    // Chữ màu hồng nhạt
    ringCtx.shadowColor = '#ffb3de';
    ringCtx.shadowBlur = 16;
    ringCtx.fillText(repeatedText, 0, canvasHeight * 0.8);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    ringTexture.wrapS = THREE.RepeatWrapping;
    ringTexture.repeat.x = totalWidth / circumference;
    ringTexture.needsUpdate = true;

    const cylinderGeometry = new THREE.CylinderGeometry(
      ringRadius,
      ringRadius,
      1,
      128,
      1,
      true
    );

    const cylinderMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.01,
    });

    const ringMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    ringMesh.position.set(0, 0, 0);
    ringMesh.rotation.y = Math.PI / 2;

    const ringGroup = new THREE.Group();
    ringGroup.add(ringMesh);
    ringGroup.userData = {
      ringRadius: ringRadius,
      angleOffset: 0.15 * Math.PI * 0.5,
      speed: 0.008,
      tiltSpeed: 0,
      rollSpeed: 0,
      pitchSpeed: 0,
      tiltAmplitude: Math.PI / 3,
      rollAmplitude: Math.PI / 6,
      pitchAmplitude: Math.PI / 8,
      tiltPhase: Math.PI * 2,
      rollPhase: Math.PI * 2,
      pitchPhase: Math.PI * 2,
      isTextRing: true,
    };

    ringGroup.rotation.x = (i / numRings) * Math.PI;

    scene.add(ringGroup);
    window.textRings.push(ringGroup);
  }
}

createTextRings();

function updateTextRingsRotation() {
  if (!window.textRings || !camera) return;

  window.textRings.forEach((ringGroup) => {
    ringGroup.children.forEach((child) => {
      if (child.userData.initialAngle !== undefined) {
        const totalAngle = child.userData.initialAngle + ringGroup.userData.angleOffset;
        const x = Math.cos(totalAngle) * child.userData.ringRadius;
        const z = Math.sin(totalAngle) * child.userData.ringRadius;
        child.position.set(x, 0, z);

        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);

        const lookDir = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
        child.rotation.y = Math.atan2(lookDir.x, lookDir.z);
      }
    });
  });
}

function animatePlanetSystem() {
  if (window.textRings) {
    const elapsed = Date.now() * 0.001;

    window.textRings.forEach((ringGroup, index) => {
      const data = ringGroup.userData;
      data.angleOffset += data.speed;

      const tilt = Math.sin(elapsed * data.tiltSpeed + data.tiltPhase) * data.tiltAmplitude;
      const roll = Math.cos(elapsed * data.rollSpeed + data.rollPhase) * data.rollAmplitude;
      const pitch = Math.sin(elapsed * data.pitchSpeed + data.pitchPhase) * data.pitchAmplitude;

      ringGroup.rotation.x = (index / window.textRings.length) * Math.PI + tilt;
      ringGroup.rotation.z = roll;
      ringGroup.rotation.y = data.angleOffset + pitch;

      const posY = Math.sin(elapsed * (data.tiltSpeed * 0.7) + data.tiltPhase) * 0.3;
      ringGroup.position.y = posY;

      const pulse = (Math.sin(elapsed * 1.5 + index) + 1) / 2;
      const firstChild = ringGroup.children[0];
      if (firstChild && firstChild.material) {
        firstChild.material.opacity = 0.7 + pulse * 0.3;
      }
    });

    updateTextRingsRotation();
  }
}

// =============================================================================
// 8. BIỂU TƯỢNG VÀ CHỮ HƯỚNG DẪN (HINT ICON & HINT TEXT)
// =============================================================================

let fadeOpacity = 0.1;
let fadeInProgress = false;
let hintIcon;
let hintText;

function createHintIcon() {
  hintIcon = new THREE.Group();
  hintIcon.name = 'hint-icon-group';
  scene.add(hintIcon);

  const pointerGroup = new THREE.Group();
  const shape = new THREE.Shape();
  const pointerHeight = 1.5;
  const halfWidth = pointerHeight * 0.5;

  shape.moveTo(0, 0);
  shape.lineTo(-halfWidth * 0.4, -pointerHeight * 0.7);
  shape.lineTo(-halfWidth * 0.25, -pointerHeight * 0.7);
  shape.lineTo(-halfWidth * 0.5, -pointerHeight);
  shape.lineTo(halfWidth * 0.5, -pointerHeight);
  shape.lineTo(halfWidth * 0.25, -pointerHeight * 0.7);
  shape.lineTo(halfWidth * 0.4, -pointerHeight * 0.7);
  shape.closePath();

  const geom1 = new THREE.ShapeGeometry(shape);
  const mat1 = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const mesh1 = new THREE.Mesh(geom1, mat1);

  const geom2 = new THREE.ShapeGeometry(shape);
  const mat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const mesh2 = new THREE.Mesh(geom2, mat2);
  mesh2.scale.set(0.8, 0.8, 1);
  mesh2.position.z = 0.01;

  pointerGroup.add(mesh1, mesh2);
  pointerGroup.position.y = pointerHeight / 2;
  pointerGroup.rotation.x = Math.PI / 2;

  const ringGeom = new THREE.RingGeometry(1.8, 2, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.rotation.x = Math.PI / 2;

  hintIcon.userData.ringMesh = ringMesh;
  hintIcon.add(pointerGroup);
  hintIcon.add(ringMesh);

  hintIcon.position.set(1.5, 1.5, 15);
  hintIcon.scale.set(0.8, 0.8, 0.8);
  hintIcon.lookAt(planet.position);
  hintIcon.userData.initialPosition = hintIcon.position.clone();
}

function animateHintIcon(time) {
  if (!hintIcon) return;

  if (!introStarted) {
    hintIcon.visible = true;

    const freq = 2.5;
    const amp = 1.5;
    const offset = Math.sin(time * freq) * amp;

    const dir = new THREE.Vector3();
    hintIcon.getWorldDirection(dir);
    hintIcon.position.copy(hintIcon.userData.initialPosition).addScaledVector(dir, -offset);

    const ringMesh = hintIcon.userData.ringMesh;
    const ringScale = 1 + Math.sin(time * freq) * 0.1;
    ringMesh.scale.set(ringScale, ringScale, 1);
    ringMesh.material.opacity = 0.5 + Math.sin(time * freq) * 0.2;

    if (hintText) {
      hintText.visible = true;
      hintText.material.opacity = 0.9 + Math.sin(time * 3) * 0.1;
      hintText.position.y = 15 + Math.sin(time * 2) * 0.5;
      hintText.lookAt(camera.position);
    }
  } else {
    if (hintIcon) hintIcon.visible = false;
    if (hintText) hintText.visible = false;
  }
}

function createHintText() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;

  const ctx = canvas.getContext('2d');
  const fontSize = 50;
  const message = 'Chạm Vào Tinh Cầu';

  ctx.font = 'bold ' + fontSize + 'px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = '#ffb3de';
  ctx.shadowBlur = 5;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 200, 220, 0.8)';
  ctx.strokeText(message, size / 2, size / 2);

  ctx.shadowColor = '#e0b3ff';
  ctx.shadowBlur = 5;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(220, 180, 255, 0.5)';
  ctx.strokeText(message, size / 2, size / 2);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'white';
  ctx.fillText(message, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const geometry = new THREE.PlaneGeometry(16, 8);
  hintText = new THREE.Mesh(geometry, material);
  hintText.position.set(0, 15, 0);
  scene.add(hintText);
}

// =============================================================================
// 9. ANIMATION LOOP CHÍNH (RENDER LOOP)
// =============================================================================

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = performance.now() * 0.001;
  animateHintIcon(elapsedTime);
  controls.update();

  planet.material.uniforms.time.value = elapsedTime * 0.5;

  if (fadeInProgress && fadeOpacity < 1) {
    fadeOpacity += 0.025;
    if (fadeOpacity > 1) fadeOpacity = 1;
  }

  if (!introStarted) {
    fadeOpacity = 0.1;
    scene.traverse((obj) => {
      if (obj.name === 'starfield') {
        if (obj.isPoints && obj.material.opacity !== undefined) {
          obj.material.transparent = false;
          obj.material.opacity = 1;
        }
        return;
      }

      const isRing =
        obj.userData.isTextRing ||
        (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing);

      if (isRing) {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.transparent = false;
          obj.material.opacity = 1;
        }
        if (obj.material && obj.material.color) {
          obj.material.color.set(0xffffff);
        }
      } else if (
        obj !== planet &&
        obj !== centralGlow &&
        obj !== hintIcon &&
        obj !== hintText &&
        obj.type !== 'Scene' &&
        !obj.parent.isGroup
      ) {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.transparent = true;
          obj.material.opacity = 0.1;
        }
      }
    });

    planet.visible = true;
    centralGlow.visible = true;
  } else {
    scene.traverse((obj) => {
      const isSpecial =
        obj.userData.isTextRing ||
        (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing) ||
        obj === planet ||
        obj === centralGlow ||
        obj.type === 'Scene';

      if (!isSpecial) {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.transparent = true;
          obj.material.opacity = fadeOpacity;
        }
      } else {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.opacity = 1;
          obj.material.transparent = false;
        }
      }

      if (obj.material && obj.material.color) {
        obj.material.color.set(0xffffff);
      }
    });
  }

  // Cập nhật vị trí sao băng
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const star = shootingStars[i];
    star.userData.life++;

    let starOpacity = 1;
    if (star.userData.life < 30) {
      starOpacity = star.userData.life / 30;
    } else if (star.userData.life > star.userData.maxLife - 30) {
      starOpacity = (star.userData.maxLife - star.userData.life) / 30;
    }

    star.userData.progress += star.userData.speed;
    if (star.userData.progress > 1) {
      scene.remove(star);
      shootingStars.splice(i, 1);
      continue;
    }

    const currentPos = star.userData.curve.getPoint(star.userData.progress);
    star.position.copy(currentPos);
    star.userData.head.material.opacity = starOpacity;
    star.userData.head.children[0].material.uniforms.time.value = elapsedTime;

    const trail = star.userData.trail;
    const trailPoints = star.userData.trailPoints;
    trailPoints[0].copy(currentPos);

    for (let t = 1; t < star.userData.trailLength; t++) {
      const pointProgress = Math.max(0, star.userData.progress - t * 0.01);
      trailPoints[t].copy(star.userData.curve.getPoint(pointProgress));
    }

    trail.geometry.setFromPoints(trailPoints);
    trail.material.opacity = starOpacity * 0.7;
  }

  if (shootingStars.length < 3 && Math.random() < 0.02) {
    createShootingStar();
  }

  // Kiểm tra khoảng cách camera đến từng cụm hạt ảnh (LOD Near / Far)
  scene.traverse((obj) => {
    if (obj.isPoints && obj.userData.materialNear && obj.userData.materialFar) {
      const posAttr = obj.geometry.getAttribute('position');
      let isNear = false;

      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i) + obj.position.x;
        const vy = posAttr.getY(i) + obj.position.y;
        const vz = posAttr.getZ(i) + obj.position.z;
        const dist = camera.position.distanceTo(new THREE.Vector3(vx, vy, vz));

        if (dist < 10) {
          isNear = true;
          break;
        }
      }

      if (isNear) {
        if (obj.material !== obj.userData.materialNear) {
          obj.material = obj.userData.materialNear;
          obj.geometry = obj.userData.geometryNear;
        }
      } else {
        if (obj.material !== obj.userData.materialFar) {
          obj.material = obj.userData.materialFar;
          obj.geometry = obj.userData.geometryFar;
        }
      }
    }
  });

  planet.lookAt(camera.position);
  animatePlanetSystem();

  if (starField && starField.material && starField.material.opacity !== undefined) {
    starField.material.opacity = 1;
    starField.material.transparent = false;
  }

  renderer.render(scene, camera);
}

// =============================================================================
// 10. HIỆU ỨNG CHUYỂN ĐỘNG CAMERA (CAMERA INTRO ANIMATION)
// =============================================================================

function startCameraAnimation() {
  const startPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };
  const stage1Pos = { x: startPos.x, y: 0, z: startPos.z };
  const stage2Pos = { x: startPos.x, y: 0, z: 160 };
  const targetPos = { x: -40, y: 100, z: 100 };

  const d1 = 0.2;
  const d2 = 0.55;
  const d3 = 0.4;

  let progress = 0;

  function step() {
    progress += 0.00101;
    let current;

    if (progress < d1) {
      const t = progress / d1;
      current = {
        x: startPos.x + (stage1Pos.x - startPos.x) * t,
        y: startPos.y + (stage1Pos.y - startPos.y) * t,
        z: startPos.z + (stage1Pos.z - startPos.z) * t,
      };
    } else if (progress < d1 + d2) {
      const t = (progress - d1) / d2;
      current = {
        x: stage1Pos.x + (stage2Pos.x - stage1Pos.x) * t,
        y: stage1Pos.y + (stage2Pos.y - stage1Pos.y) * t,
        z: stage1Pos.z + (stage2Pos.z - stage1Pos.z) * t,
      };
    } else if (progress < d1 + d2 + d3) {
      const t = (progress - d1 - d2) / d3;
      const smoothT = 0.5 - 0.5 * Math.cos(Math.PI * t);
      current = {
        x: stage2Pos.x + (targetPos.x - stage2Pos.x) * smoothT,
        y: stage2Pos.y + (targetPos.y - stage2Pos.y) * smoothT,
        z: stage2Pos.z + (targetPos.z - stage2Pos.z) * smoothT,
      };
    } else {
      camera.position.set(targetPos.x, targetPos.y, targetPos.z);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
      controls.enabled = true;
      return;
    }

    camera.position.set(current.x, current.y, current.z);
    camera.lookAt(0, 0, 0);
    requestAnimationFrame(step);
  }

  controls.enabled = false;
  step();
}

// =============================================================================
// 11. XỬ LÝ SỰ KIỆN TƯƠNG TÁC (CLICK, FULLSCREEN, ORIENTATION)
// =============================================================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let introStarted = false;

const originalStarCount = starGeometry.getAttribute('position').count;
if (starField && starField.geometry) {
  starField.geometry.setDrawRange(0, Math.floor(originalStarCount * 0.1));
}

function requestFullScreen() {
  const docEl = document.documentElement;
  if (docEl.requestFullscreen) {
    docEl.requestFullscreen();
  } else if (docEl.mozRequestFullScreen) {
    docEl.mozRequestFullScreen();
  } else if (docEl.webkitRequestFullscreen) {
    docEl.webkitRequestFullscreen();
  } else if (docEl.msRequestFullscreen) {
    docEl.msRequestFullscreen();
  }
}

function onCanvasClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (introStarted) {
    if (heartPointClouds.length > 0) {
      const heartIntersects = raycaster.intersectObjects(heartPointClouds);
      if (heartIntersects.length > 0) {
        const targetObj = heartIntersects[0].object;
        controls.target.copy(targetObj.position);
        controls.update();
      }
    }
    return;
  }

  const intersects = raycaster.intersectObject(planet);

  if (intersects.length > 0) {
    requestFullScreen();
    introStarted = true;
    fadeInProgress = true;
    document.body.classList.add('intro-started');
    startCameraAnimation();

    if (starField && starField.geometry) {
      starField.geometry.setDrawRange(0, originalStarCount);
    }
  }
}

renderer.domElement.addEventListener('click', onCanvasClick);

function setFullScreen() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
  const containerEl = document.getElementById('container');
  if (containerEl) {
    containerEl.style.height = window.innerHeight + 'px';
  }
}

window.addEventListener('resize', setFullScreen);
window.addEventListener('orientationchange', () => {
  setTimeout(setFullScreen, 300);
});
setFullScreen();

const preventDefault = (e) => e.preventDefault();
document.addEventListener('touchmove', preventDefault, { passive: false });
document.addEventListener('gesturestart', preventDefault, { passive: false });

const container = document.getElementById('container');
if (container) {
  container.addEventListener('touchmove', preventDefault, { passive: false });
}

function checkOrientation() {
  const isPortraitTouch = window.innerHeight > window.innerWidth && 'ontouchstart' in window;
  if (isPortraitTouch) {
    document.body.classList.add('portrait-mode');
  } else {
    document.body.classList.remove('portrait-mode');
  }
}

window.addEventListener('DOMContentLoaded', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(checkOrientation, 200);
});

// Resize camera and renderer
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  controls.target.set(0, 0, 0);
  controls.update();
});

// Khởi chạy các hiệu ứng ban đầu
createShootingStar();
createHintIcon();
createHintText();
animate();
