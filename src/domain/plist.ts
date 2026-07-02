import { clamp, hexToRgb } from "./color";
import { BLEND_MAP } from "./presets";
import type { BlendFactor, ParticleState, PlistDict } from "./types";

function numberTag(key: string, value: unknown, type = "real"): string {
  return `\t<key>${key}</key>\n\t<${type}>${formatNumber(value)}</${type}>`;
}

function stringTag(key: string, value: unknown): string {
  return `\t<key>${key}</key>\n\t<string>${escapeXml(value)}</string>`;
}

function formatNumber(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return `${Math.round(number * 100000) / 100000}`;
}

function component(hex: string, channel: "r" | "g" | "b"): number {
  return hexToRgb(hex)[channel] / 255;
}

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createPlist(state: ParticleState): string {
  const startColor = state.useTextureColor ? "#ffffff" : state.startColor;
  const finishColor = state.useTextureColor ? "#ffffff" : state.endColor;
  const startColorVar = state.useTextureColor ? "#000000" : state.startColorVar;
  const finishColorVar = state.useTextureColor ? "#000000" : state.endColorVar;

  const tags = [
    numberTag("angle", state.angle),
    numberTag("angleVariance", state.angleVar),
    numberTag("blendFuncDestination", BLEND_MAP[state.blendDst], "integer"),
    numberTag("blendFuncSource", BLEND_MAP[state.blendSrc], "integer"),
    numberTag("duration", state.infinite ? -1 : state.duration),
    numberTag("emitterType", state.emitterType, "integer"),
    numberTag("finishColorAlpha", state.endAlpha),
    numberTag("finishColorBlue", component(finishColor, "b")),
    numberTag("finishColorGreen", component(finishColor, "g")),
    numberTag("finishColorRed", component(finishColor, "r")),
    numberTag("finishColorVarianceAlpha", 0),
    numberTag("finishColorVarianceBlue", component(finishColorVar, "b")),
    numberTag("finishColorVarianceGreen", component(finishColorVar, "g")),
    numberTag("finishColorVarianceRed", component(finishColorVar, "r")),
    numberTag("finishParticleSize", state.endSize),
    numberTag("finishParticleSizeVariance", state.endSizeVar),
    numberTag("gravityx", state.gravityX),
    numberTag("gravityy", state.gravityY),
    numberTag("maxParticles", state.maxParticles, "integer"),
    numberTag("maxRadius", state.maxRadius),
    numberTag("maxRadiusVariance", state.maxRadiusVar),
    numberTag("minRadius", state.minRadius),
    numberTag("minRadiusVariance", state.minRadiusVar),
    numberTag("particleLifespan", state.life),
    numberTag("particleLifespanVariance", state.lifeVar),
    numberTag("radialAccelVariance", state.radialAccelVar),
    numberTag("radialAcceleration", state.radialAccel),
    numberTag("rotatePerSecond", state.rotatePerSecond),
    numberTag("rotatePerSecondVariance", state.rotatePerSecondVar),
    numberTag("rotationEnd", state.rotationEnd),
    numberTag("rotationEndVariance", state.rotationEndVar),
    numberTag("rotationStart", state.rotationStart),
    numberTag("rotationStartVariance", state.rotationStartVar),
    numberTag("sourcePositionVariancex", state.sourceW),
    numberTag("sourcePositionVariancey", state.sourceH),
    numberTag("sourcePositionx", 0),
    numberTag("sourcePositiony", 0),
    numberTag("speed", state.speed),
    numberTag("speedVariance", state.speedVar),
    numberTag("startColorAlpha", state.startAlpha),
    numberTag("startColorBlue", component(startColor, "b")),
    numberTag("startColorGreen", component(startColor, "g")),
    numberTag("startColorRed", component(startColor, "r")),
    numberTag("startColorVarianceAlpha", 0),
    numberTag("startColorVarianceBlue", component(startColorVar, "b")),
    numberTag("startColorVarianceGreen", component(startColorVar, "g")),
    numberTag("startColorVarianceRed", component(startColorVar, "r")),
    numberTag("startParticleSize", state.startSize),
    numberTag("startParticleSizeVariance", state.startSizeVar),
    numberTag("tangentialAccelVariance", state.tangentialAccelVar),
    numberTag("tangentialAcceleration", state.tangentialAccel),
    stringTag("textureFileName", state.textureName || `${state.saveName}.png`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${tags.join("\n")}
</dict>
</plist>
`;
}

export function parsePlistDict(xmlText: string): PlistDict {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const dict = doc.querySelector("dict");
  const result: PlistDict = {};
  if (!dict) return result;

  const children = [...dict.children];
  for (let index = 0; index < children.length; index += 1) {
    if (children[index].tagName !== "key") continue;
    const key = children[index].textContent;
    const valueNode = children[index + 1];
    if (!key || !valueNode) continue;
    result[key] = valueNode.textContent || "";
  }

  return result;
}

export function importedPlistState(data: PlistDict, current: ParticleState): Partial<ParticleState> {
  const reverseBlend = Object.fromEntries(
    Object.entries(BLEND_MAP).map(([key, value]) => [String(value), key as BlendFactor]),
  );
  const read = (key: string, fallback: number | string): number =>
    data[key] === undefined ? Number(fallback) : Number(data[key]);
  const color = (r: string | undefined, g: string | undefined, b: string | undefined) => {
    const toHex = (value: string | undefined) =>
      clamp(Math.round(Number(value || 0) * 255), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const startColor = color(data.startColorRed, data.startColorGreen, data.startColorBlue);
  const endColor = color(data.finishColorRed, data.finishColorGreen, data.finishColorBlue);
  const startColorVar = color(data.startColorVarianceRed, data.startColorVarianceGreen, data.startColorVarianceBlue);
  const endColorVar = color(data.finishColorVarianceRed, data.finishColorVarianceGreen, data.finishColorVarianceBlue);
  const useTextureColor =
    startColor === "#ffffff" &&
    endColor === "#ffffff" &&
    startColorVar === "#000000" &&
    endColorVar === "#000000";
  const duration = read("duration", current.duration);
  const infinite = read("duration", -1) < 0;

  return {
    angle: read("angle", current.angle),
    angleVar: read("angleVariance", current.angleVar),
    blendDst: reverseBlend[data.blendFuncDestination] || current.blendDst,
    blendSrc: reverseBlend[data.blendFuncSource] || current.blendSrc,
    duration: !infinite && duration < 0 ? 0.1 : duration,
    infinite,
    emitterType: String(read("emitterType", current.emitterType)) === "1" ? "1" : "0",
    useTextureColor,
    endAlpha: read("finishColorAlpha", current.endAlpha),
    endColor,
    endColorVar,
    endSize: read("finishParticleSize", current.endSize),
    endSizeVar: read("finishParticleSizeVariance", current.endSizeVar),
    gravityX: read("gravityx", current.gravityX),
    gravityY: read("gravityy", current.gravityY),
    maxParticles: read("maxParticles", current.maxParticles),
    maxRadius: read("maxRadius", current.maxRadius),
    maxRadiusVar: read("maxRadiusVariance", current.maxRadiusVar),
    minRadius: read("minRadius", current.minRadius),
    minRadiusVar: read("minRadiusVariance", current.minRadiusVar),
    life: read("particleLifespan", current.life),
    lifeVar: read("particleLifespanVariance", current.lifeVar),
    radialAccelVar: read("radialAccelVariance", current.radialAccelVar),
    radialAccel: read("radialAcceleration", current.radialAccel),
    rotatePerSecond: read("rotatePerSecond", current.rotatePerSecond),
    rotatePerSecondVar: read("rotatePerSecondVariance", current.rotatePerSecondVar),
    rotationEnd: read("rotationEnd", current.rotationEnd),
    rotationEndVar: read("rotationEndVariance", current.rotationEndVar),
    rotationStart: read("rotationStart", current.rotationStart),
    rotationStartVar: read("rotationStartVariance", current.rotationStartVar),
    sourceW: read("sourcePositionVariancex", current.sourceW),
    sourceH: read("sourcePositionVariancey", current.sourceH),
    speed: read("speed", current.speed),
    speedVar: read("speedVariance", current.speedVar),
    startAlpha: read("startColorAlpha", current.startAlpha),
    startColor,
    startColorVar,
    startSize: read("startParticleSize", current.startSize),
    startSizeVar: read("startParticleSizeVariance", current.startSizeVar),
    tangentialAccelVar: read("tangentialAccelVariance", current.tangentialAccelVar),
    tangentialAccel: read("tangentialAcceleration", current.tangentialAccel),
    textureName: data.textureFileName || current.textureName,
    texturePath: data.textureFileName || current.texturePath,
  };
}
