/// <reference lib="webworker" />
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { ToWorkerMsg, FromWorkerMsg } from "./hero-gl.protocol";

// ─── Constants ───────────────────────────────────────────────────────────────

const PARTICLE_COUNTS = { high: 6500, low: 3200 } as const;
const ORB_DETAIL      = { high: 48,   low: 24   } as const;
const ORB_OCTAVES     = { high: 4,    low: 3    } as const;
const SPREAD          = { x: 21, y: 12.5, z: 8 };
const ACCENT: [number, number, number] = [0.91, 0.915, 0.95];
const SETTLE_TAU = 0.333;
const FPS_INTERVAL_MS = 700;
const VRAM_INTERVAL_MS = 2000;

// ─── Post-processing shaders ─────────────────────────────────────────────────

const CHROMA_SHADER = {
  uniforms: {
    tDiffuse:      { value: null },
    uStrength:     { value: 0.0 },
    uResolution:   { value: new Vector2(1, 1) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform vec2 uResolution;
    varying vec2 vUv;
    void main(){
      vec2 dir = vUv - 0.5;
      float dist = length(dir);
      float str = uStrength * dist * 2.2;
      vec2 offset = normalize(dir + 0.0001) * str / uResolution;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

const GRAIN_VIGNETTE_SHADER = {
  uniforms: {
    tDiffuse:  { value: null },
    uTime:     { value: 0.0 },
    uGrain:    { value: 0.045 },
    uVignette: { value: 0.55 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    varying vec2 vUv;

    float hash(vec2 p){
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    void main(){
      vec4 col = texture2D(tDiffuse, vUv);
      // Film grain — animated, breaks OLED banding
      float grain = (hash(vUv + fract(uTime * 0.07)) - 0.5) * uGrain;
      col.rgb += grain;
      // Vignette
      float d = length(vUv - 0.5) * 1.42;
      float vig = 1.0 - smoothstep(0.55, 1.0, d) * uVignette;
      col.rgb *= vig;
      gl_FragColor = col;
    }
  `,
};

// ─── Noise / FBM GLSL (inlined into orb shaders) ─────────────────────────────

const NOISE_GLSL = /* glsl */`
vec3 mod289v3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289v4(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289v4(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){
  float f=0.0;float amp=0.5;
  for(int i=0;i<OCTAVES;i++){f+=amp*snoise(p);p=p*2.02+vec3(11.31);amp*=0.5;}
  return f;
}
`;

// ─── Particle shaders ─────────────────────────────────────────────────────────

const PARTICLE_VERT = /* glsl */`
attribute float aScale;
attribute float aSeed;
uniform float uTime;
uniform vec2 uMouse;
uniform float uSize;
uniform float uPixelRatio;
varying float vAlpha;
varying float vSeed;
void main(){
  vec3 p=position;
  p.x+=sin(uTime*0.14+aSeed*6.2831)*0.28;
  p.y+=cos(uTime*0.11+aSeed*12.9898)*0.22;
  vec2 d=p.xy-uMouse;
  float dist=length(d);
  float f=smoothstep(5.0,0.0,dist);
  p.xy+=(d/max(dist,0.001))*f*2.4;
  p.z+=f*1.4;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=uSize*uPixelRatio*aScale*(1.0/max(0.001,-mv.z));
  vAlpha=smoothstep(34.0,10.0,-mv.z)*(0.55+0.45*f);
  vSeed=aSeed;
}
`;

const PARTICLE_FRAG = /* glsl */`
uniform vec3 uColorBase;
uniform vec3 uColorAccent;
varying float vAlpha;
varying float vSeed;
void main(){
  vec2 uv=gl_PointCoord-0.5;
  float d=length(uv);
  if(d>0.5)discard;
  float m=smoothstep(0.5,0.08,d);
  vec3 col=mix(uColorBase,uColorAccent,step(0.86,fract(vSeed*7.13)));
  gl_FragColor=vec4(col,m*vAlpha*0.9);
}
`;

// ─── Orb shaders ──────────────────────────────────────────────────────────────

const ORB_VERT = /* glsl */`
uniform float uTime;
uniform float uEnergy;
uniform vec2 uVel;
uniform vec2 uAccel;
varying vec3 vNormalW;
varying vec3 vPosW;
${NOISE_GLSL}
vec3 orthogonal(vec3 v){return normalize(abs(v.x)>abs(v.z)?vec3(-v.y,v.x,0.0):vec3(0.0,-v.z,v.y));}
vec3 displaced(vec3 p){
  vec3 dir=normalize(p);
  float flow=uTime*0.16;
  vec3 q=dir*1.85;
  q.xz+=uVel*0.0075;
  q+=vec3(flow,uAccel.y*0.0028,uAccel.x*0.0028);
  float n=fbm(q);
  float amp=0.17*(0.42+uEnergy*1.2);
  return p+dir*n*amp;
}
void main(){
  vec3 p=position;
  vec3 dp=displaced(p);
  float e=0.12;
  vec3 dir=normalize(p);
  vec3 t=orthogonal(dir);
  vec3 b=cross(dir,t);
  vec3 dt=displaced(p+t*e);
  vec3 db=displaced(p+b*e);
  vec3 n=normalize(cross(dt-dp,db-dp));
  n*=sign(dot(n,dir));
  vec4 wp=modelMatrix*vec4(dp,1.0);
  vPosW=wp.xyz;
  vNormalW=normalize(mat3(modelMatrix)*n);
  gl_Position=projectionMatrix*viewMatrix*wp;
}
`;

const ORB_FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uAccent;
varying vec3 vNormalW;
varying vec3 vPosW;
vec3 envColor(vec3 d){
  d=normalize(d);
  float band=sin(d.y*5.0+d.x*2.0-uTime*0.32)*0.5+0.5;
  float glow=sin(atan(d.z,d.x)*3.0+uTime*0.21)*0.5+0.5;
  vec3 base=mix(vec3(0.03,0.03,0.04),vec3(0.92),pow(band,4.0));
  return base*0.55+uAccent*pow(glow,2.0)*0.95;
}
void main(){
  vec3 N=normalize(vNormalW);
  vec3 V=normalize(cameraPosition-vPosW);
  if(dot(N,V)<0.0)N=-N;
  float fres=pow(1.0-max(dot(N,V),0.0),2.6);
  vec3 R=reflect(-V,N);
  vec3 env=envColor(R);
  vec3 base=vec3(0.05,0.05,0.062);
  vec3 col=base+env*(0.32+fres*1.25);
  col+=uAccent*pow(fres,2.0)*0.55;
  col+=uAccent*pow(fres,3.5)*0.85;
  float spec=pow(max(dot(R,normalize(vec3(-0.5,0.75,0.45))),0.0),52.0);
  col+=vec3(1.0)*spec*0.55;
  gl_FragColor=vec4(col,1.0);
}
`;

// ─── State ────────────────────────────────────────────────────────────────────

let renderer: WebGLRenderer;
let composer: EffectComposer;
let chromaPass: ShaderPass;
let grainPass: ShaderPass;
let scene: Scene;
let camera: PerspectiveCamera;
let clock: Clock;
let raycaster: Raycaster;
let orbMesh: Mesh;
let orbMaterial: ShaderMaterial;
let particlePoints: Points;
let particleMaterial: ShaderMaterial;
let particleGeometry: BufferGeometry;
let orbGeometry: IcosahedronGeometry;

let width = 1;
let height = 1;
let dpr = 1;
let tier: "high" | "low" = "high";
let active = true;
let rafId = 0;

// Physics state (all on worker thread — zero main-thread cost)
const physics = {
  rawVX: 0, rawVY: 0, rawAX: 0, rawAY: 0,
  instVX: 0, instVY: 0,
  velX: 0, velY: 0, accX: 0, accY: 0,
  energy: 0,
  mouseNdcX: 0, mouseNdcY: 0,
  scrollVelocity: 0,
};

// FPS probe
let emaMs = 16.7;
let fpsFrames = 0;
let lastFpsReport = 0;
let lastVramReport = 0;
let downgrades = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function post(msg: FromWorkerMsg) {
  (self as unknown as Worker).postMessage(msg);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Scene construction ───────────────────────────────────────────────────────

function buildParticles() {
  const count = PARTICLE_COUNTS[tier];
  const rand = seededRandom(20260824);
  const positions = new Float32Array(count * 3);
  const scales    = new Float32Array(count);
  const seeds     = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (rand() * 2 - 1) * SPREAD.x;
    positions[i * 3 + 1] = (rand() * 2 - 1) * SPREAD.y;
    positions[i * 3 + 2] = (rand() * 2 - 1) * SPREAD.z;
    scales[i] = 0.5 + rand() * rand() * 1.8;
    seeds[i]  = rand();
  }
  particleGeometry = new BufferGeometry();
  particleGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  particleGeometry.setAttribute("aScale",   new BufferAttribute(scales, 1));
  particleGeometry.setAttribute("aSeed",    new BufferAttribute(seeds, 1));

  particleMaterial = new ShaderMaterial({
    vertexShader:   PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    uniforms: {
      uTime:        { value: 0 },
      uMouse:       { value: new Vector2(999, 999) },
      uSize:        { value: 30 },
      uPixelRatio:  { value: dpr },
      uColorBase:   { value: new Vector3(...ACCENT) },
      uColorAccent: { value: new Vector3(...ACCENT) },
    },
    transparent: true,
    depthWrite:  false,
    blending:    AdditiveBlending,
  });

  particlePoints = new Points(particleGeometry, particleMaterial);
  scene.add(particlePoints);
}

function buildOrb() {
  orbGeometry = new IcosahedronGeometry(1, ORB_DETAIL[tier]);
  orbMaterial = new ShaderMaterial({
    defines: { OCTAVES: ORB_OCTAVES[tier] },
    vertexShader:   ORB_VERT,
    fragmentShader: ORB_FRAG,
    uniforms: {
      uTime:   { value: 0 },
      uEnergy: { value: 0 },
      uVel:    { value: new Vector2() },
      uAccel:  { value: new Vector2() },
      uAccent: { value: new Vector3(...ACCENT) },
    },
  });
  orbMesh = new Mesh(orbGeometry, orbMaterial);
  orbMesh.renderOrder = 1;
  orbMesh.name = "orb";
  scene.add(orbMesh);
}

function buildComposer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  chromaPass = new ShaderPass(CHROMA_SHADER);
  chromaPass.uniforms.uResolution.value.set(width * dpr, height * dpr);
  composer.addPass(chromaPass);

  grainPass = new ShaderPass(GRAIN_VIGNETTE_SHADER);
  composer.addPass(grainPass);

  composer.addPass(new OutputPass());
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(canvas: OffscreenCanvas, w: number, h: number, d: number, t: "high" | "low") {
  width = w; height = h; dpr = d; tier = t;

  renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);

  scene  = new Scene();
  camera = new PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 0, 14);
  clock     = new Clock();
  raycaster = new Raycaster();

  buildParticles();
  buildOrb();
  buildComposer();

  post({ type: "ready" });
  loop();
}

// ─── Physics step (runs entirely on worker thread) ────────────────────────────

function stepPhysics(delta: number) {
  const decayV = Math.max(0, 1 - delta * 2.0);
  const decayA = Math.max(0, 1 - delta * 2.6);
  physics.rawVX *= decayV;
  physics.rawVY *= decayV;
  physics.rawAX *= decayA;
  physics.rawAY *= decayA;
  const alpha = 1 - Math.exp(-delta / SETTLE_TAU);
  physics.velX += (physics.rawVX - physics.velX) * alpha;
  physics.velY += (physics.rawVY - physics.velY) * alpha;
  physics.accX += (physics.rawAX - physics.accX) * alpha;
  physics.accY += (physics.rawAY - physics.accY) * alpha;
  const targetEnergy = Math.min(1, Math.hypot(physics.rawVX, physics.rawVY) / 70);
  physics.energy += (targetEnergy - physics.energy) * alpha;
  // Decay scroll velocity
  physics.scrollVelocity *= 0.92;
}

// ─── GPU Raycasting (worker-side, zero main-thread cost) ─────────────────────

function performRaycast(ndcX: number, ndcY: number) {
  raycaster.setFromCamera(new Vector2(ndcX, ndcY), camera);
  const hits = raycaster.intersectObject(orbMesh, false);
  const hit = hits.length > 0;
  post({
    type: "raycast-result",
    hit,
    objectId: hit ? "orb" : null,
  });
}

// ─── VRAM disposal on section transition ─────────────────────────────────────
// Keeps VRAM footprint under 150 MB by disposing geometries/materials
// that belong to sections not currently visible.

let currentSection = 0;

function onSectionChange(index: number) {
  if (index === currentSection) return;
  const wasHero = currentSection === 0;
  const isHero  = index === 0;
  currentSection = index;

  if (wasHero && !isHero) {
    // Leaving hero — dispose heavy orb geometry, keep particles alive
    if (orbGeometry) {
      orbGeometry.dispose();
    }
    if (orbMaterial) {
      orbMaterial.dispose();
    }
    if (orbMesh) scene.remove(orbMesh);
  } else if (!wasHero && isHero) {
    // Returning to hero — rebuild orb
    buildOrb();
    updateOrbTransform();
  }

  // Report estimated VRAM after disposal
  reportVram();
}

function reportVram() {
  // Estimate: count buffer attributes + textures
  let mb = 0;
  scene.traverse((obj) => {
    if (obj instanceof Points || obj instanceof Mesh) {
      const geo = (obj as Points | Mesh).geometry;
      if (geo) {
        for (const attr of Object.values(geo.attributes)) {
          mb += (attr as BufferAttribute).array.byteLength / (1024 * 1024);
        }
      }
    }
  });
  // Add composer render targets (~4 bytes × w × h × dpr² × 2 targets)
  mb += (width * dpr * height * dpr * 4 * 2) / (1024 * 1024);
  post({ type: "vram", mb: Math.round(mb * 10) / 10 });
}

// ─── Orb viewport positioning ─────────────────────────────────────────────────

function updateOrbTransform() {
  if (!orbMesh) return;
  const aspect = width / height;
  const fovRad = (camera.fov * Math.PI) / 180;
  const viewH  = 2 * Math.tan(fovRad / 2) * camera.position.z;
  const viewW  = viewH * aspect;
  const wide   = aspect > 1.05;
  orbMesh.position.x = wide ? viewW * 0.235 : 0;
  const radius = Math.min(viewH, viewW) * (wide ? 0.33 : 0.27);
  orbMesh.scale.setScalar(radius);
}

// ─── Render loop ──────────────────────────────────────────────────────────────

function loop() {
  if (!active) { rafId = 0; return; }
  rafId = requestAnimationFrame(loop);

  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;

  stepPhysics(delta);

  // ── Particle uniforms ──
  if (particleMaterial) {
    const u = particleMaterial.uniforms;
    u.uTime.value += delta;
    u.uPixelRatio.value = dpr;

    const targetMX = physics.mouseNdcX * 10.5;
    const targetMY = physics.mouseNdcY * 6.25;
    const damp = Math.min(1, delta * 4);
    u.uMouse.value.x += (targetMX - u.uMouse.value.x) * damp;
    u.uMouse.value.y += (targetMY - u.uMouse.value.y) * damp;

    if (particlePoints) {
      particlePoints.rotation.y = Math.sin(u.uTime.value * 0.05) * 0.07;
    }
  }

  // ── Orb uniforms ──
  if (orbMaterial) {
    const u = orbMaterial.uniforms;
    u.uTime.value   = elapsed;
    u.uEnergy.value = physics.energy;
    u.uVel.value.set(physics.velX, physics.velY);
    u.uAccel.value.set(physics.accX, physics.accY);
    updateOrbTransform();
  }

  // ── Chromatic aberration — driven by scroll velocity ──
  if (chromaPass) {
    const absScroll = Math.abs(physics.scrollVelocity);
    // Map 0–2000 px/s → 0–3.5 px strength
    chromaPass.uniforms.uStrength.value =
      Math.min(3.5, absScroll * 0.00175);
  }

  // ── Film grain time ──
  if (grainPass) {
    grainPass.uniforms.uTime.value = elapsed;
  }

  composer.render();

  // ── FPS probe ──
  emaMs += (delta * 1000 - emaMs) * 0.05;
  fpsFrames++;
  const now = performance.now();
  if (now - lastFpsReport > FPS_INTERVAL_MS) {
    post({ type: "fps", value: Math.min(120, Math.round(1000 / emaMs)) });
    lastFpsReport = now;

    // Auto-downgrade pixel ratio if sustained low fps
    if (downgrades < 2 && fpsFrames >= 150 && emaMs > 19.5) {
      const cur = renderer.getPixelRatio();
      renderer.setPixelRatio(Math.max(1, cur * 0.78));
      composer.setSize(width, height);
      downgrades++;
      fpsFrames = 0;
    }
  }

  // ── VRAM report ──
  if (now - lastVramReport > VRAM_INTERVAL_MS) {
    reportVram();
    lastVramReport = now;
  }
}

// ─── Resize ───────────────────────────────────────────────────────────────────

function resize(w: number, h: number, d: number) {
  width = w; height = h; dpr = d;
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  composer.setSize(width, height);
  if (chromaPass) {
    chromaPass.uniforms.uResolution.value.set(width * dpr, height * dpr);
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<ToWorkerMsg>) => {
  const msg = event.data;
  switch (msg.type) {
    case "init":
      init(msg.canvas, msg.width, msg.height, msg.dpr, msg.tier);
      break;

    case "resize":
      if (renderer) resize(msg.width, msg.height, msg.dpr);
      break;

    case "pointer": {
      // Compute NDC for particle mouse uniform
      physics.mouseNdcX = (msg.x / width) * 2 - 1;
      physics.mouseNdcY = -((msg.y / height) * 2 - 1);
      // Feed velocity into physics
      physics.rawVX = Math.max(-90, Math.min(90, msg.vx));
      physics.rawVY = Math.max(-90, Math.min(90, msg.vy));
      break;
    }

    case "scroll-velocity":
      physics.scrollVelocity = msg.velocity;
      break;

    case "section":
      onSectionChange(msg.index);
      break;

    case "raycast": {
      const ndcX = (msg.x / width) * 2 - 1;
      const ndcY = -((msg.y / height) * 2 - 1);
      performRaycast(ndcX, ndcY);
      break;
    }

    case "pause":
      active = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      break;

    case "resume":
      if (!active) {
        active = true;
        clock.getDelta(); // flush stale delta
        loop();
      }
      break;
  }
};
