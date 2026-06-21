import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import dayTextureUrl from './assets/earth-day.png';
import nightTextureUrl from './assets/earth-night.png';
import cloudTextureUrl from './assets/clouds-artistic.png';

export type DayState = 'day' | 'night' | 'twilight';

export interface EarthController {
  setLocation(lat: number, lon: number, animate?: boolean): void;
  recenter(distance?: number, duration?: number): void;
  beginMeditation(): void;
  endMeditation(): void;
  setMeditationPaused(paused: boolean): void;
  setBreathPhase(phase: number): void;
  setReduceMotion(reduce: boolean): void;
  getDayState(): DayState;
  dispose(): void;
}

interface CameraTween {
  startedAt: number;
  duration: number;
  fromDirection: THREE.Vector3;
  toDirection: THREE.Vector3;
  fromDistance: number;
  toDistance: number;
  onComplete?: () => void;
}

function degreesToRadians(value: number): number {
  return value * Math.PI / 180;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function latLonToVector(lat: number, lon: number, radius = 1): THREE.Vector3 {
  const latitude = degreesToRadians(lat);
  const longitude = degreesToRadians(lon);
  const cosLat = Math.cos(latitude);
  return new THREE.Vector3(
    radius * cosLat * Math.cos(longitude),
    radius * Math.sin(latitude),
    -radius * cosLat * Math.sin(longitude)
  );
}

/** Approximate subsolar point from common low-precision solar equations. */
export function getSunDirection(date = new Date()): THREE.Vector3 {
  const julianDate = date.getTime() / 86_400_000 + 2_440_587.5;
  const daysSinceJ2000 = julianDate - 2_451_545.0;

  const meanLongitude = normalizeDegrees(280.460 + 0.9856474 * daysSinceJ2000);
  const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * daysSinceJ2000);
  const anomalyRad = degreesToRadians(meanAnomaly);
  const eclipticLongitude = normalizeDegrees(
    meanLongitude + 1.915 * Math.sin(anomalyRad) + 0.020 * Math.sin(2 * anomalyRad)
  );
  const eclipticRad = degreesToRadians(eclipticLongitude);
  const obliquity = degreesToRadians(23.439 - 0.0000004 * daysSinceJ2000);

  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticRad),
    Math.cos(eclipticRad)
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticRad));

  const centuries = daysSinceJ2000 / 36_525;
  const greenwichSidereal = normalizeDegrees(
    280.46061837
      + 360.98564736629 * daysSinceJ2000
      + 0.000387933 * centuries * centuries
      - centuries * centuries * centuries / 38_710_000
  );
  let subsolarLongitude = rightAscension * 180 / Math.PI - greenwichSidereal;
  subsolarLongitude = ((subsolarLongitude + 540) % 360) - 180;

  return latLonToVector(declination * 180 / Math.PI, subsolarLongitude).normalize();
}

export class EarthView implements EarthController {
  private readonly container: HTMLElement;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly animationStartedAt = performance.now();
  private readonly earthMaterial: THREE.ShaderMaterial;
  private readonly cloudMaterial: THREE.ShaderMaterial;
  private readonly atmosphereMaterial: THREE.ShaderMaterial;
  private readonly markerGroup = new THREE.Group();
  private readonly resizeObserver: ResizeObserver;
  private sunDirection = getSunDirection();
  private userVector = latLonToVector(31.2304, 121.4737).normalize();
  private cameraTween: CameraTween | null = null;
  private lastSolarUpdate = 0;
  private reduceMotion = false;
  private meditationActive = false;
  private targetBreath = 0;
  private displayedBreath = 0;
  private cloudOffset = 0;
  private disposed = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = 'earth-canvas';
    this.renderer.domElement.setAttribute('aria-label', '显示当前昼夜分布的三维地球');
    container.appendChild(this.renderer.domElement);

    this.camera.position.copy(this.userVector.clone().multiplyScalar(3.25));
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.15;
    this.controls.maxDistance = 10;
    this.controls.rotateSpeed = 0.33;
    this.controls.zoomSpeed = 0.45;
    this.controls.target.set(0, 0, 0);

    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load(dayTextureUrl);
    const nightTexture = textureLoader.load(nightTextureUrl);
    const cloudsTexture = textureLoader.load(cloudTextureUrl);
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    for (const texture of [dayTexture, nightTexture, cloudsTexture]) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    }

    this.earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDayMap: { value: dayTexture },
        uNightMap: { value: nightTexture },
        uSunDirection: { value: this.sunDirection.clone() },
        uBreath: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vObjectNormal;
        void main() {
          vUv = uv;
          vObjectNormal = normalize(normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uDayMap;
        uniform sampler2D uNightMap;
        uniform vec3 uSunDirection;
        uniform float uBreath;
        varying vec2 vUv;
        varying vec3 vObjectNormal;

        void main() {
          vec3 normal = normalize(vObjectNormal);
          float solar = dot(normal, normalize(uSunDirection));
          float daylight = smoothstep(-0.11, 0.12, solar);
          float twilight = smoothstep(-0.22, -0.01, solar) * (1.0 - smoothstep(-0.01, 0.18, solar));

          vec3 day = texture2D(uDayMap, vUv).rgb;
          vec3 lights = texture2D(uNightMap, vUv).rgb;
          float lightEnergy = max(max(lights.r, lights.g), lights.b);
          vec3 warmLights = lights * vec3(1.28, 1.02, 0.70) * (1.1 + lightEnergy * 0.55);
          vec3 night = day * vec3(0.010, 0.018, 0.040) + warmLights * 1.22;
          vec3 color = mix(night, day, daylight);
          color += vec3(0.15, 0.052, 0.014) * twilight * 0.30;
          color *= 1.0 + uBreath * 0.035;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), this.earthMaterial);
    earth.rotation.y = 0;
    this.scene.add(earth);

    this.cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCloudMap: { value: cloudsTexture },
        uSunDirection: { value: this.sunDirection.clone() },
        uOffset: { value: 0 },
        uOpacity: { value: 1 }
      },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vObjectNormal;
        void main() {
          vUv = uv;
          vObjectNormal = normalize(normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uCloudMap;
        uniform vec3 uSunDirection;
        uniform float uOffset;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vObjectNormal;
        void main() {
          vec2 cloudUv = vec2(fract(vUv.x + uOffset), vUv.y);
          float cloud = texture2D(uCloudMap, cloudUv).a;
          float solar = dot(normalize(vObjectNormal), normalize(uSunDirection));
          float daylight = smoothstep(-0.14, 0.16, solar);
          vec3 color = mix(vec3(0.11, 0.16, 0.24), vec3(1.0), daylight);
          float alpha = cloud * mix(0.16, 0.56, daylight) * uOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.009, 96, 64), this.cloudMaterial);
    this.scene.add(clouds);

    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBreath: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(-viewPosition.xyz);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform float uBreath;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDirection)), 2.4);
          float alpha = fresnel * (0.42 + uBreath * 0.10);
          vec3 color = mix(vec3(0.08, 0.32, 0.70), vec3(0.30, 0.82, 1.0), fresnel);
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.075, 96, 64), this.atmosphereMaterial);
    this.scene.add(atmosphere);

    this.createStars();
    this.createMarker();
    this.scene.add(this.markerGroup);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => this.animate());
  }

  private createStars(): void {
    const count = window.innerWidth < 700 ? 700 : 1300;
    const positions = new Float32Array(count * 3);
    const random = (seed: number): number => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let index = 0; index < count; index += 1) {
      const radius = 9 + random(index + 1) * 26;
      const theta = random(index + 311) * Math.PI * 2;
      const phi = Math.acos(2 * random(index + 719) - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xcbe6ff,
      size: 0.022,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.66,
      depthWrite: false
    });
    this.scene.add(new THREE.Points(geometry, material));
  }

  private createMarker(): void {
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xa8ebff,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 24, 16), glowMaterial);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.023, 0.031, 64),
      new THREE.MeshBasicMaterial({
        color: 0xc8f3ff,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.name = 'marker-ring';
    this.markerGroup.add(dot, ring);
    this.updateMarkerTransform();
  }

  private updateMarkerTransform(): void {
    this.markerGroup.position.copy(this.userVector.clone().multiplyScalar(1.025));
    this.markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.userVector);
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (this.meditationActive) {
      const distance = this.camera.position.length();
      const fittedDistance = this.getMeditationDistance(3.72);
      if (distance < fittedDistance) {
        this.camera.position.setLength(fittedDistance);
        this.camera.lookAt(0, 0, 0);
      }
    }
  }

  private getMeditationDistance(baseDistance: number): number {
    const width = Math.max(1, window.innerWidth || this.container.clientWidth);
    const height = Math.max(1, window.innerHeight || this.container.clientHeight);
    const mobileViewport = Math.min(width, height) <= 700 || width / height < 0.76;
    if (!mobileViewport) return baseDistance;

    const aspect = width / height;
    const verticalFov = degreesToRadians(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const atmosphereRadius = 1.08;
    const fitPadding = height < 500 ? 1.4 : 1.06;
    const fittedDistance = atmosphereRadius / Math.sin(limitingFov / 2) * fitPadding;
    return Math.max(baseDistance, fittedDistance);
  }

  private animate(): void {
    if (this.disposed) return;
    const now = performance.now();
    const elapsed = (now - this.animationStartedAt) / 1000;

    if (now - this.lastSolarUpdate > 30_000) {
      this.sunDirection = getSunDirection();
      this.earthMaterial.uniforms.uSunDirection!.value.copy(this.sunDirection);
      this.cloudMaterial.uniforms.uSunDirection!.value.copy(this.sunDirection);
      this.lastSolarUpdate = now;
    }

    if (this.cameraTween) {
      const rawProgress = Math.min(1, (now - this.cameraTween.startedAt) / this.cameraTween.duration);
      const progress = easeInOutCubic(rawProgress);
      const direction = this.cameraTween.fromDirection.clone().lerp(this.cameraTween.toDirection, progress).normalize();
      const distance = THREE.MathUtils.lerp(this.cameraTween.fromDistance, this.cameraTween.toDistance, progress);
      this.camera.position.copy(direction.multiplyScalar(distance));
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(0, 0, 0);
      if (rawProgress >= 1) {
        const onComplete = this.cameraTween.onComplete;
        this.cameraTween = null;
        onComplete?.();
      }
    }

    this.displayedBreath = THREE.MathUtils.lerp(this.displayedBreath, this.targetBreath, 0.055);
    this.earthMaterial.uniforms.uBreath!.value = this.displayedBreath;
    this.atmosphereMaterial.uniforms.uBreath!.value = this.displayedBreath;
    this.cloudOffset = this.reduceMotion ? 0 : (elapsed * (this.meditationActive ? 0.00045 : 0.0008)) % 1;
    this.cloudMaterial.uniforms.uOffset!.value = this.cloudOffset;

    const ring = this.markerGroup.getObjectByName('marker-ring');
    if (ring) {
      const pulse = this.reduceMotion ? 1 : 1 + Math.sin(elapsed * 1.7) * 0.18;
      ring.scale.setScalar(pulse);
      const material = ring instanceof THREE.Mesh ? ring.material : null;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = this.reduceMotion ? 0.62 : 0.48 + Math.sin(elapsed * 1.7) * 0.20;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setLocation(lat: number, lon: number, animate = true): void {
    this.userVector = latLonToVector(lat, lon).normalize();
    this.updateMarkerTransform();
    if (animate) this.recenter(3.25, 1400);
    else {
      this.camera.position.copy(this.userVector.clone().multiplyScalar(3.25));
      this.camera.lookAt(0, 0, 0);
      this.controls.update();
    }
  }

  recenter(distance = 3.25, duration = 1200): void {
    this.flyTo(this.userVector, distance, this.reduceMotion ? 1 : duration);
  }

  flyTo(direction: THREE.Vector3, distance: number, duration = 1600, onComplete?: () => void): void {
    const currentDistance = this.camera.position.length();
    this.cameraTween = {
      startedAt: performance.now(),
      duration: Math.max(1, duration),
      fromDirection: this.camera.position.clone().normalize(),
      toDirection: direction.clone().normalize(),
      fromDistance: currentDistance,
      toDistance: distance,
      onComplete
    };
  }

  beginMeditation(): void {
    this.meditationActive = true;
    this.markerGroup.visible = false;
    this.controls.enabled = false;
    this.recenter(this.getMeditationDistance(2.65), 900);
    window.setTimeout(() => {
      if (this.meditationActive) this.recenter(this.getMeditationDistance(3.72), this.reduceMotion ? 1 : 22_000);
    }, this.reduceMotion ? 20 : 1150);
  }

  endMeditation(): void {
    this.meditationActive = false;
    this.markerGroup.visible = true;
    this.controls.enabled = true;
    this.targetBreath = 0;
    this.recenter(3.25, 1400);
  }

  setMeditationPaused(paused: boolean): void {
    this.targetBreath = paused ? 0 : this.targetBreath;
  }

  setBreathPhase(phase: number): void {
    this.targetBreath = Math.max(0, Math.min(1, phase));
  }

  setReduceMotion(reduce: boolean): void {
    this.reduceMotion = reduce;
    this.controls.enableDamping = !reduce;
  }

  getDayState(): DayState {
    const solar = this.userVector.dot(this.sunDirection);
    if (solar > 0.09) return 'day';
    if (solar < -0.09) return 'night';
    return 'twilight';
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.container.replaceChildren();
  }
}


class FallbackEarthView implements EarthController {
  private readonly container: HTMLElement;
  private readonly root: HTMLDivElement;
  private readonly sphere: HTMLDivElement;
  private readonly marker: HTMLDivElement;
  private lat = 31.2304;
  private lon = 121.4737;
  private userVector = latLonToVector(this.lat, this.lon).normalize();
  private sunDirection = getSunDirection();
  private reduceMotion = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.root = document.createElement('div');
    this.root.className = 'fallback-earth-wrap';
    this.root.innerHTML = `
      <div class="fallback-earth-glow" aria-hidden="true"></div>
      <div class="fallback-earth-sphere" role="img" aria-label="当前设备无法使用三维绘图，显示二维地球备用视图">
        <div class="fallback-earth-day"></div>
        <div class="fallback-earth-night"></div>
        <div class="fallback-earth-shadow"></div>
        <div class="fallback-earth-clouds"></div>
        <div class="fallback-earth-marker"></div>
      </div>
      <div class="fallback-note">二维备用视图</div>
    `;
    this.sphere = this.root.querySelector<HTMLDivElement>('.fallback-earth-sphere')!;
    this.marker = this.root.querySelector<HTMLDivElement>('.fallback-earth-marker')!;
    const day = this.root.querySelector<HTMLDivElement>('.fallback-earth-day')!;
    const night = this.root.querySelector<HTMLDivElement>('.fallback-earth-night')!;
    const clouds = this.root.querySelector<HTMLDivElement>('.fallback-earth-clouds')!;
    day.style.backgroundImage = `url(${dayTextureUrl})`;
    night.style.backgroundImage = `url(${nightTextureUrl})`;
    clouds.style.backgroundImage = `url(${cloudTextureUrl})`;
    container.replaceChildren(this.root);
    this.updateAppearance();
  }

  private updateAppearance(): void {
    this.sunDirection = getSunDirection();
    this.userVector = latLonToVector(this.lat, this.lon).normalize();
    const state = this.getDayState();
    this.root.dataset.dayState = state;
    const x = ((this.lon + 180) / 360) * 100;
    const y = ((90 - this.lat) / 180) * 100;
    this.sphere.style.setProperty('--map-x', `${x.toFixed(2)}%`);
    this.sphere.style.setProperty('--map-y', `${y.toFixed(2)}%`);
    this.marker.style.left = '50%';
    this.marker.style.top = '50%';
  }

  setLocation(lat: number, lon: number): void {
    this.lat = lat;
    this.lon = lon;
    this.updateAppearance();
    if (!this.reduceMotion) {
      this.sphere.animate(
        [{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }],
        { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  }

  recenter(): void {
    if (this.reduceMotion) return;
    this.sphere.animate(
      [{ transform: 'scale(0.98)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }],
      { duration: 650, easing: 'ease-in-out' }
    );
  }

  beginMeditation(): void {
    this.root.classList.add('is-meditating');
  }

  endMeditation(): void {
    this.root.classList.remove('is-meditating', 'is-paused');
    this.setBreathPhase(0);
  }

  setMeditationPaused(paused: boolean): void {
    this.root.classList.toggle('is-paused', paused);
  }

  setBreathPhase(phase: number): void {
    const safe = Math.max(0, Math.min(1, phase));
    this.root.style.setProperty('--earth-breath-scale', (1 + safe * 0.025).toFixed(4));
    this.root.style.setProperty('--earth-breath-glow', (0.25 + safe * 0.25).toFixed(3));
  }

  setReduceMotion(reduce: boolean): void {
    this.reduceMotion = reduce;
    this.root.classList.toggle('reduce-motion', reduce);
  }

  getDayState(): DayState {
    const solar = this.userVector.dot(this.sunDirection);
    if (solar > 0.09) return 'day';
    if (solar < -0.09) return 'night';
    return 'twilight';
  }

  dispose(): void {
    this.container.replaceChildren();
  }
}

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function createEarthView(container: HTMLElement): EarthController {
  if (!supportsWebGL2()) return new FallbackEarthView(container);
  try {
    return new EarthView(container);
  } catch (error) {
    console.warn('WebGL initialization failed; using the two-dimensional Earth fallback.', error);
    return new FallbackEarthView(container);
  }
}
