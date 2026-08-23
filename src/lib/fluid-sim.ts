"use client";

import * as THREE from "three";

export type FluidMode = "ns" | "canvas2d" | "static";

export function detectFluidSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return false;
    const ext = gl.getExtension("EXT_color_buffer_float");
    return Boolean(ext);
  } catch {
    return false;
  }
}

const BASE_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const SPLAT_FRAGMENT = `
precision highp float;
uniform sampler2D uTarget;
uniform vec2 point;
uniform vec3 color;
uniform float radius;
varying vec2 vUv;
void main() {
  vec2 d = (vUv - point);
  float g = exp(-dot(d, d) / radius);
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + g * color, 1.0);
}
`;

const ADVECTION_FRAGMENT = `
precision highp float;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
varying vec2 vUv;
void main() {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = dissipation * texture2D(uSource, coord);
}
`;

const DIVERGENCE_FRAGMENT = `
precision mediump float;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
varying vec2 vUv;
void main() {
  float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
  float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
  float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}
`;

const CURL_FRAGMENT = `
precision mediump float;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
varying vec2 vUv;
void main() {
  float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
  float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
  float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
  float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
  gl_FragColor = vec4(0.5 * ((R - L) - (T - B)), 0.0, 0.0, 1.0);
}
`;

const VORTICITY_FRAGMENT = `
precision highp float;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 texelSize;
uniform float curlStrength;
uniform float dt;
varying vec2 vUv;
void main() {
  float L = texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
  float B = texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).x;
  float T = texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= curlStrength * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy + force * dt;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const PRESSURE_FRAGMENT = `
precision mediump float;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;
varying vec2 vUv;
void main() {
  float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  float T = texture2D(uPressure, vUv + vec2(texelSize.y, 0.0)).x;
  float divergence = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}
`;

const CLEAR_FRAGMENT = `
precision mediump float;
uniform sampler2D uTexture;
uniform float value;
varying vec2 vUv;
void main() {
  gl_FragColor = value * texture2D(uTexture, vUv);
}
`;

const GRADIENT_SUBTRACT_FRAGMENT = `
precision mediump float;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
varying vec2 vUv;
void main() {
  float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const COPY_LDR_FRAGMENT = `
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vUv;
void main() {
  float lum = dot(texture2D(uTexture, vUv).rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(vec3(clamp(lum * 3.0, 0.0, 1.0)), 1.0);
}
`;

export interface SplatRequest {
  x: number;
  y: number;
  dx: number;
  dy: number;
  impulse?: boolean;
}

interface DoubleFBO {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  swap: () => void;
}

const PRESSURE_ITERATIONS = 22;

export class FluidSim {
  private gl: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  private programs = new Map<string, THREE.ShaderMaterial>();

  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private divergenceRT!: THREE.WebGLRenderTarget;
  private curlRT!: THREE.WebGLRenderTarget;
  private pressure!: DoubleFBO;
  private probeRT!: THREE.WebGLRenderTarget;
  private probeBytes = new Uint8Array(16 * 16 * 4);

  simRes = { width: 144, height: 144 };
  dyeRes = { width: 512, height: 512 };
  probeRes = 16;

  dyeTexture: THREE.Texture | null = null;

  constructor(gl: THREE.WebGLRenderer, quality: "high" | "low") {
    this.gl = gl;
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    const scale = quality === "high" ? 1 : 0.66;
    this.simRes = this.getResolution(Math.round(144 * scale));
    this.dyeRes = this.getResolution(Math.round(512 * scale));
    this.createTargets();
  }

  setQuality(quality: "high" | "low"): void {
    const scale = quality === "high" ? 1 : 0.66;
    this.simRes = this.getResolution(Math.round(144 * scale));
    this.dyeRes = this.getResolution(Math.round(512 * scale));
    this.createTargets();
  }

  resize(width: number, height: number): void {
    const aspect = width / height;
    const fit = (res: { width: number; height: number }) => {
      if (res.width > res.height) {
        res.height = Math.max(2, Math.round(res.width / aspect));
      } else {
        res.width = Math.max(2, Math.round(res.height * aspect));
      }
    };
    fit(this.simRes);
    fit(this.dyeRes);
    this.createTargets();
  }

  splat(splat: SplatRequest): void {
    const mat = this.use("splat", SPLAT_FRAGMENT);

    this.setUniforms(mat, {
      uTarget: this.velocity.read.texture,
      point: new THREE.Vector2(splat.x, splat.y),
      radius: splat.impulse ? 0.008 : 0.0032,
      color: new THREE.Vector3(splat.dx, splat.dy, 0),
    });
    this.draw(mat, this.velocity.write);
    this.velocity.swap();

    const c = splat.impulse ? 0.45 : 0.12;
    this.setUniforms(mat, {
      uTarget: this.dye.read.texture,
      radius: splat.impulse ? 0.018 : 0.006,
      color: new THREE.Vector3(c, c, c),
    });
    this.draw(mat, this.dye.write);
    this.dye.swap();
  }

  step(dt: number): void {
    const velTexel = new THREE.Vector2(
      1 / this.simRes.width,
      1 / this.simRes.height,
    );

    this.draw(
      this.use("curl", CURL_FRAGMENT, {
        uVelocity: this.velocity.read.texture,
        texelSize: velTexel,
      }),
      this.curlRT,
    );

    this.draw(
      this.use("vorticity", VORTICITY_FRAGMENT, {
        uVelocity: this.velocity.read.texture,
        uCurl: this.curlRT.texture,
        texelSize: velTexel,
        curlStrength: 28,
        dt,
      }),
      this.velocity.write,
    );
    this.velocity.swap();

    this.draw(
      this.use("divergence", DIVERGENCE_FRAGMENT, {
        uVelocity: this.velocity.read.texture,
        texelSize: velTexel,
      }),
      this.divergenceRT,
    );

    this.draw(
      this.use("clear", CLEAR_FRAGMENT, {
        uTexture: this.pressure.read.texture,
        value: 0.8,
      }),
      this.pressure.write,
    );
    this.pressure.swap();

    const pressureMat = this.use("pressure", PRESSURE_FRAGMENT, {
      uDivergence: this.divergenceRT.texture,
      texelSize: velTexel,
    });
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      pressureMat.uniforms.uPressure.value = this.pressure.read.texture;
      this.draw(pressureMat, this.pressure.write);
      this.pressure.swap();
    }

    this.draw(
      this.use("gradient", GRADIENT_SUBTRACT_FRAGMENT, {
        uPressure: this.pressure.read.texture,
        uVelocity: this.velocity.read.texture,
        texelSize: velTexel,
      }),
      this.velocity.write,
    );
    this.velocity.swap();

    const advectMat = this.use("advection", ADVECTION_FRAGMENT, {
      uVelocity: this.velocity.read.texture,
      texelSize: velTexel,
      dt,
      dissipation: Math.exp(-0.35 * dt),
    });
    advectMat.uniforms.uSource.value = this.velocity.read.texture;
    this.draw(advectMat, this.velocity.write);
    this.velocity.swap();

    advectMat.uniforms.uVelocity.value = this.velocity.read.texture;
    advectMat.uniforms.uSource.value = this.dye.read.texture;
    advectMat.uniforms.texelSize.value = new THREE.Vector2(
      1 / this.dyeRes.width,
      1 / this.dyeRes.height,
    );
    advectMat.uniforms.dissipation.value = Math.exp(-0.85 * dt);
    this.draw(advectMat, this.dye.write);
    this.dye.swap();

    this.dyeTexture = this.dye.read.texture;
  }

  updateProbe(): void {
    const copy = this.use("copyLdr", COPY_LDR_FRAGMENT, {
      uTexture: this.dye.read.texture,
    });
    this.draw(copy, this.probeRT);
    this.gl.readRenderTargetPixels(
      this.probeRT,
      0,
      0,
      this.probeRes,
      this.probeRes,
      this.probeBytes,
    );
  }

  sampleEnergy(u: number, v: number): number {
    const px = Math.min(
      this.probeRes - 1,
      Math.max(0, Math.floor(u * this.probeRes)),
    );
    const py = Math.min(
      this.probeRes - 1,
      Math.max(0, Math.floor(v * this.probeRes)),
    );
    const index = (py * this.probeRes + px) * 4;
    return this.probeBytes[index] / 255;
  }

  dispose(): void {
    this.programs.forEach((material) => material.dispose());
    this.programs.clear();
    this.velocity?.read.dispose();
    this.velocity?.write.dispose();
    this.dye?.read.dispose();
    this.dye?.write.dispose();
    this.pressure?.read.dispose();
    this.pressure?.write.dispose();
    this.divergenceRT?.dispose();
    this.curlRT?.dispose();
    this.probeRT?.dispose();
    this.quad.geometry.dispose();
  }

  private getResolution(res: number): { width: number; height: number } {
    let aspect = this.gl.domElement.width / this.gl.domElement.height;
    if (!Number.isFinite(aspect) || aspect <= 0) aspect = 1;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(res);
    const max = Math.round(res * aspect);
    return this.gl.domElement.width >= this.gl.domElement.height
      ? { width: max, height: min }
      : { width: min, height: max };
  }

  private createFBO(w: number, h: number): THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  private createDouble(w: number, h: number): DoubleFBO {
    return {
      read: this.createFBO(w, h),
      write: this.createFBO(w, h),
      swap: function () {
        const temp = this.read;
        this.read = this.write;
        this.write = temp;
      },
    };
  }

  private createTargets(): void {
    this.velocity?.read.dispose();
    this.velocity?.write.dispose();
    this.dye?.read.dispose();
    this.dye?.write.dispose();
    this.pressure?.read.dispose();
    this.pressure?.write.dispose();
    this.divergenceRT?.dispose();
    this.curlRT?.dispose();

    this.velocity = this.createDouble(this.simRes.width, this.simRes.height);
    this.dye = this.createDouble(this.dyeRes.width, this.dyeRes.height);
    this.pressure = this.createDouble(this.simRes.width, this.simRes.height);
    this.divergenceRT = this.createFBO(this.simRes.width, this.simRes.height);
    this.curlRT = this.createFBO(this.simRes.width, this.simRes.height);
    this.dyeTexture = this.dye.read.texture;
  }

  private use(
    name: string,
    fragment: string,
    uniforms?: Record<string, unknown>,
  ): THREE.ShaderMaterial {
    let material = this.programs.get(name);
    if (!material) {
      material = new THREE.ShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader: fragment,
        depthTest: false,
        depthWrite: false,
      });
      this.programs.set(name, material);
    }
    if (uniforms) this.setUniforms(material, uniforms);
    return material;
  }

  private setUniforms(
    material: THREE.ShaderMaterial,
    values: Record<string, unknown>,
  ): void {
    Object.entries(values).forEach(([key, value]) => {
      const uniform = material.uniforms[key];
      if (uniform && uniform.value && typeof value === "object") {
        if ("copy" in (uniform.value as object)) {
          (uniform.value as THREE.Vector2).copy(value as THREE.Vector2);
          return;
        }
      }
      material.uniforms[key] = { value };
    });
  }

  private draw(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget,
  ): void {
    this.quad.material = material;
    this.gl.setRenderTarget(target);
    this.gl.render(this.scene, this.camera);
  }
}
