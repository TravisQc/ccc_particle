import type { RgbaColor } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function randomVariance(value: number, variance: number): number {
  return Number(value) + (Math.random() * 2 - 1) * Math.abs(Number(variance || 0));
}

export function hexToRgb(hex: string): Omit<RgbaColor, "a"> {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16) || 0,
    g: parseInt(value.slice(2, 4), 16) || 0,
    b: parseInt(value.slice(4, 6), 16) || 0,
  };
}

export function randomColor(baseHex: string, varianceHex: string, alpha: number): RgbaColor {
  const base = hexToRgb(baseHex);
  const variance = hexToRgb(varianceHex);
  return {
    r: clamp(base.r + (Math.random() * 2 - 1) * variance.r, 0, 255),
    g: clamp(base.g + (Math.random() * 2 - 1) * variance.g, 0, 255),
    b: clamp(base.b + (Math.random() * 2 - 1) * variance.b, 0, 255),
    a: clamp(Number(alpha), 0, 1),
  };
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixColor(start: RgbaColor, end: RgbaColor, t: number): RgbaColor {
  return {
    r: Math.round(mix(start.r, end.r, t)),
    g: Math.round(mix(start.g, end.g, t)),
    b: Math.round(mix(start.b, end.b, t)),
    a: clamp(mix(start.a, end.a, t), 0, 1),
  };
}

export function colorToRgba(color: RgbaColor): string {
  return `rgba(${color.r},${color.g},${color.b},${color.a})`;
}

export function quantizeColor(color: RgbaColor): RgbaColor {
  return {
    r: Math.round(color.r / 16) * 16,
    g: Math.round(color.g / 16) * 16,
    b: Math.round(color.b / 16) * 16,
    a: Math.round(color.a * 24) / 24,
  };
}
