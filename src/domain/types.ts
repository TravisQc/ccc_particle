export type PositionType = "FREE" | "RELATIVE" | "GROUPED";
export type EmitterType = "0" | "1";

export type BlendFactor =
  | "ZERO"
  | "ONE"
  | "SRC_COLOR"
  | "ONE_MINUS_SRC_COLOR"
  | "SRC_ALPHA"
  | "ONE_MINUS_SRC_ALPHA"
  | "DST_ALPHA"
  | "ONE_MINUS_DST_ALPHA"
  | "DST_COLOR"
  | "ONE_MINUS_DST_COLOR";

export interface ParticleState {
  backgroundColor: string;
  duration: number;
  infinite: boolean;
  maxParticles: number;
  life: number;
  lifeVar: number;
  angle: number;
  angleVar: number;
  sourceW: number;
  sourceH: number;
  positionType: PositionType;
  emitterType: EmitterType;
  gravityX: number;
  gravityY: number;
  speed: number;
  speedVar: number;
  radialAccel: number;
  radialAccelVar: number;
  tangentialAccel: number;
  tangentialAccelVar: number;
  maxRadius: number;
  maxRadiusVar: number;
  minRadius: number;
  minRadiusVar: number;
  rotatePerSecond: number;
  rotatePerSecondVar: number;
  startColor: string;
  startColorVar: string;
  useTextureColor: boolean;
  endColor: string;
  endColorVar: string;
  startAlpha: number;
  endAlpha: number;
  texturePath: string;
  textureName: string;
  startSize: number;
  startSizeVar: number;
  endSize: number;
  endSizeVar: number;
  rotationStart: number;
  rotationStartVar: number;
  rotationEnd: number;
  rotationEndVar: number;
  blendSrc: BlendFactor;
  blendDst: BlendFactor;
  saveName: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  startSize: number;
  endSize: number;
  rotationStart: number;
  rotationEnd: number;
  startColor: RgbaColor;
  endColor: RgbaColor;
  radialAccel: number;
  tangentialAccel: number;
  centerX?: number;
  centerY?: number;
  radius?: number;
  deltaRadius?: number;
  radiusAngle?: number;
  degPerSec?: number;
}

export type ParticleFile = File & {
  particleRelativePath?: string;
};

export type PlistDict = Record<string, string>;
