export const MONO_ACCENT: [number, number, number] = [0.91, 0.915, 0.95];

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function linearToSrgb(v: number) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

export function oklchToRgb(
  l: number,
  c: number,
  hDeg: number,
): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = Math.cos(h) * c;
  const b = Math.sin(h) * c;

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  const r = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  const g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

  return [
    clamp01(linearToSrgb(r)),
    clamp01(linearToSrgb(g)),
    clamp01(linearToSrgb(bl)),
  ];
}
