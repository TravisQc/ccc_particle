import {
  clamp,
  colorToRgba,
  mix,
  mixColor,
  quantizeColor,
  randomColor,
  randomVariance,
} from "./color";
import { imageFilePath } from "./files";
import type { Particle, ParticleFile, ParticleState, Point, RgbaColor } from "./types";

const TINT_CACHE_LIMIT = 768;
const TINT_TEXTURE_MAX_SIZE = 96;

type DragMode = "emitter" | "canvas";

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");
  return ctx;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load texture image."));
    image.src = src;
  });
}

export interface TextureUpdate {
  textureName: string;
  texturePath: string;
}

export interface BackgroundImageInfo {
  name: string;
  width: number;
  height: number;
}

export class ParticleEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly textureSourceCanvas = document.createElement("canvas");
  private readonly tintBaseCanvas = document.createElement("canvas");
  private readonly tintBaseCtx: CanvasRenderingContext2D;
  private textureImage = new Image();
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundVisible = true;
  private tintedTextureCache = new Map<string, HTMLCanvasElement>();
  private textureRevision = 0;
  private particles: Particle[] = [];
  private lastTime = performance.now();
  private emitCarry = 0;
  private elapsed = 0;
  private paused = false;
  private emitter: Point = { x: 0, y: 0 };
  private emitterPlaced = false;
  private lastEmitPosition: Point = { x: 0, y: 0 };
  private backgroundOffset: Point = { x: 0, y: 0 };
  private dragMode: DragMode | null = null;
  private dragStartPointer: Point = { x: 0, y: 0 };
  private dragStartEmitter: Point = { x: 0, y: 0 };
  private dragStartBackgroundOffset: Point = { x: 0, y: 0 };
  private frameId = 0;
  private running = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly state: ParticleState,
    private readonly onParticleCount: (value: string) => void,
  ) {
    this.ctx = context2d(canvas);
    this.tintBaseCtx = context2d(this.tintBaseCanvas);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  fitCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.emitterPlaced) {
      this.centerEmitter();
    } else {
      // 画布缩小后把发射器留在可视区域内
      this.emitter.x = clamp(this.emitter.x, 0, rect.width);
      this.emitter.y = clamp(this.emitter.y, 0, rect.height);
    }
  }

  centerEmitter(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.emitter.x = rect.width * 0.5;
    this.emitter.y = rect.height * 0.5;
    this.lastEmitPosition.x = this.emitter.x;
    this.lastEmitPosition.y = this.emitter.y;
    this.emitterPlaced = true;
  }

  nudgeEmitter(dx: number, dy: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.emitter.x = clamp(this.emitter.x + dx, 0, rect.width);
    this.emitter.y = clamp(this.emitter.y + dy, 0, rect.height);
    this.emitterPlaced = true;
  }

  resetParticles(): void {
    this.particles = [];
    this.emitCarry = 0;
    this.elapsed = 0;
    this.lastEmitPosition.x = this.emitter.x;
    this.lastEmitPosition.y = this.emitter.y;
  }

  beginDrag(event: PointerEvent): void {
    if (event.button === 1) {
      this.dragMode = "canvas";
      this.dragStartPointer.x = event.clientX;
      this.dragStartPointer.y = event.clientY;
      this.dragStartEmitter.x = this.emitter.x;
      this.dragStartEmitter.y = this.emitter.y;
      this.dragStartBackgroundOffset.x = this.backgroundOffset.x;
      this.dragStartBackgroundOffset.y = this.backgroundOffset.y;
    } else if (event.button === 0) {
      this.dragMode = "emitter";
      this.moveEmitter(event);
    } else {
      return;
    }

    this.lastEmitPosition.x = this.emitter.x;
    this.lastEmitPosition.y = this.emitter.y;
  }

  drag(event: PointerEvent): void {
    if (this.dragMode === "emitter") {
      this.moveEmitter(event);
    } else if (this.dragMode === "canvas") {
      const dx = event.clientX - this.dragStartPointer.x;
      const dy = event.clientY - this.dragStartPointer.y;
      this.emitter.x = this.dragStartEmitter.x + dx;
      this.emitter.y = this.dragStartEmitter.y + dy;
      this.backgroundOffset.x = this.dragStartBackgroundOffset.x + dx;
      this.backgroundOffset.y = this.dragStartBackgroundOffset.y + dy;
      this.emitterPlaced = true;
    }

    // 暂停期间不会执行 emit；同步位置可避免恢复后沿整段拖拽路径补发粒子。
    if (this.dragMode && this.paused) {
      this.lastEmitPosition.x = this.emitter.x;
      this.lastEmitPosition.y = this.emitter.y;
    }
  }

  endDrag(): void {
    this.dragMode = null;
  }

  async makeDefaultTexture(): Promise<void> {
    const size = 64;
    this.textureSourceCanvas.width = size;
    this.textureSourceCanvas.height = size;
    const tex = context2d(this.textureSourceCanvas);
    tex.clearRect(0, 0, size, size);
    const gradient = tex.createRadialGradient(32, 32, 0, 32, 32, 31);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.16, "rgba(255,245,150,0.98)");
    gradient.addColorStop(0.36, "rgba(255,115,24,0.52)");
    gradient.addColorStop(0.68, "rgba(255,65,20,0.12)");
    gradient.addColorStop(1, "rgba(255,65,20,0)");
    tex.fillStyle = gradient;
    tex.fillRect(0, 0, size, size);
    this.textureImage = await loadImage(this.textureSourceCanvas.toDataURL("image/png"));
    this.rebuildTintBase();
  }

  async loadTextureFile(file: ParticleFile): Promise<TextureUpdate> {
    const image = await loadImage(await readFileAsDataUrl(file));
    this.textureSourceCanvas.width = image.naturalWidth;
    this.textureSourceCanvas.height = image.naturalHeight;
    context2d(this.textureSourceCanvas).drawImage(image, 0, 0);
    this.textureImage = image;
    this.rebuildTintBase();
    this.resetParticles();

    return {
      textureName: file.name.replace(/\.(jpe?g|webp)$/i, ".png"),
      texturePath: imageFilePath(file).replace(/\.(jpe?g|webp)$/i, ".png"),
    };
  }

  async loadBackgroundFile(file: File): Promise<BackgroundImageInfo> {
    const image = await loadImage(await readFileAsDataUrl(file));
    this.backgroundImage = image;
    this.backgroundVisible = true;
    this.backgroundOffset.x = 0;
    this.backgroundOffset.y = 0;

    return {
      name: file.name,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }

  setBackgroundVisible(visible: boolean): void {
    this.backgroundVisible = visible;
  }

  clearBackground(): void {
    this.backgroundImage = null;
    this.backgroundVisible = true;
    this.backgroundOffset.x = 0;
    this.backgroundOffset.y = 0;
  }

  drawTexturePreview(canvas: HTMLCanvasElement): string {
    const textureCtx = context2d(canvas);
    textureCtx.clearRect(0, 0, canvas.width, canvas.height);
    const sourceW = this.textureImage.naturalWidth || 64;
    const sourceH = this.textureImage.naturalHeight || 64;
    const scale = Math.min(canvas.width / sourceW, canvas.height / sourceH);
    const drawW = sourceW * scale;
    const drawH = sourceH * scale;
    textureCtx.drawImage(this.textureImage, (canvas.width - drawW) * 0.5, (canvas.height - drawH) * 0.5, drawW, drawH);
    return `${sourceW} x ${sourceH}`;
  }

  texturePngBlob(): Promise<Blob | null> {
    return new Promise((resolve) => this.textureSourceCanvas.toBlob(resolve, "image/png"));
  }

  private moveEmitter(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.emitter.x = event.clientX - rect.left;
    this.emitter.y = event.clientY - rect.top;
    this.emitterPlaced = true;
  }

  private clearTintCache(): void {
    this.tintedTextureCache.clear();
    this.textureRevision += 1;
  }

  private rebuildTintBase(): void {
    const sourceW = this.textureImage.naturalWidth || this.textureSourceCanvas.width || 64;
    const sourceH = this.textureImage.naturalHeight || this.textureSourceCanvas.height || 64;
    const scale = Math.min(1, TINT_TEXTURE_MAX_SIZE / Math.max(sourceW, sourceH));
    this.tintBaseCanvas.width = Math.max(1, Math.round(sourceW * scale));
    this.tintBaseCanvas.height = Math.max(1, Math.round(sourceH * scale));
    this.tintBaseCtx.clearRect(0, 0, this.tintBaseCanvas.width, this.tintBaseCanvas.height);
    this.tintBaseCtx.drawImage(this.textureImage, 0, 0, this.tintBaseCanvas.width, this.tintBaseCanvas.height);
    this.clearTintCache();
  }

  private tintedTexture(color: RgbaColor): HTMLCanvasElement {
    const quantized = quantizeColor(color);
    const key = `${this.textureRevision}:${quantized.r}:${quantized.g}:${quantized.b}:${quantized.a}`;
    const cached = this.tintedTextureCache.get(key);
    if (cached) {
      this.tintedTextureCache.delete(key);
      this.tintedTextureCache.set(key, cached);
      return cached;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.tintBaseCanvas.width || 1;
    canvas.height = this.tintBaseCanvas.height || 1;
    const tintCtx = context2d(canvas);
    tintCtx.drawImage(this.tintBaseCanvas, 0, 0);
    tintCtx.globalCompositeOperation = "source-in";
    tintCtx.fillStyle = colorToRgba(quantized);
    tintCtx.fillRect(0, 0, canvas.width, canvas.height);
    tintCtx.globalCompositeOperation = "source-over";

    this.tintedTextureCache.set(key, canvas);
    if (this.tintedTextureCache.size > TINT_CACHE_LIMIT) {
      const oldestKey = this.tintedTextureCache.keys().next().value;
      if (oldestKey) this.tintedTextureCache.delete(oldestKey);
    }
    return canvas;
  }

  private createParticle(origin: Point = this.emitter): Particle {
    const life = Math.max(0.03, randomVariance(this.state.life, this.state.lifeVar));
    // Cocos 的 sourcePositionVariance 语义是 pos ± variance（全幅 2×variance）
    const offsetX = (Math.random() * 2 - 1) * this.state.sourceW;
    const offsetY = (Math.random() * 2 - 1) * this.state.sourceH;
    const angle = (randomVariance(this.state.angle, this.state.angleVar) * Math.PI) / 180;
    const speed = randomVariance(this.state.speed, this.state.speedVar);
    const startSize = Math.max(0.1, randomVariance(this.state.startSize, this.state.startSizeVar));
    const endSize = Math.max(0.1, randomVariance(this.state.endSize, this.state.endSizeVar));
    const rotationStart = randomVariance(this.state.rotationStart, this.state.rotationStartVar);
    const rotationEnd = randomVariance(this.state.rotationEnd, this.state.rotationEndVar);
    const startColor = this.state.useTextureColor
      ? { r: 255, g: 255, b: 255, a: clamp(this.state.startAlpha, 0, 1) }
      : randomColor(this.state.startColor, this.state.startColorVar, this.state.startAlpha);
    const endColor = this.state.useTextureColor
      ? { r: 255, g: 255, b: 255, a: clamp(this.state.endAlpha, 0, 1) }
      : randomColor(this.state.endColor, this.state.endColorVar, this.state.endAlpha);

    const particle: Particle = {
      x: origin.x + offsetX,
      y: origin.y + offsetY,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      age: 0,
      life,
      startSize,
      endSize,
      rotationStart,
      rotationEnd,
      startColor,
      endColor,
      radialAccel: randomVariance(this.state.radialAccel, this.state.radialAccelVar),
      tangentialAccel: randomVariance(this.state.tangentialAccel, this.state.tangentialAccelVar),
    };

    if (this.state.emitterType === "1") {
      const startRadius = Math.max(0, randomVariance(this.state.maxRadius, this.state.maxRadiusVar));
      const endRadius = Math.max(0, randomVariance(this.state.minRadius, this.state.minRadiusVar));
      particle.centerX = origin.x;
      particle.centerY = origin.y;
      particle.radius = startRadius;
      particle.deltaRadius = (endRadius - startRadius) / life;
      particle.radiusAngle = angle;
      particle.degPerSec = (randomVariance(this.state.rotatePerSecond, this.state.rotatePerSecondVar) * Math.PI) / 180;
      particle.x = particle.centerX + Math.cos(angle) * startRadius;
      // canvas 的 y 轴向下，与重力模式的 vy = -sin 保持同一坐标翻转
      particle.y = particle.centerY - Math.sin(angle) * startRadius;
    }

    return particle;
  }

  private updateParticle(particle: Particle, dt: number): boolean {
    particle.age += dt;
    if (particle.age >= particle.life) return false;

    if (this.state.emitterType === "1") {
      particle.radius = Math.max(0, (particle.radius || 0) + (particle.deltaRadius || 0) * dt);
      particle.radiusAngle = (particle.radiusAngle || 0) + (particle.degPerSec || 0) * dt;
      particle.x = (particle.centerX || 0) + Math.cos(particle.radiusAngle) * particle.radius;
      particle.y = (particle.centerY || 0) - Math.sin(particle.radiusAngle) * particle.radius;
      return true;
    }

    const dx = particle.x - this.emitter.x;
    const dy = particle.y - this.emitter.y;
    const length = Math.hypot(dx, dy) || 1;
    const radialX = dx / length;
    const radialY = dy / length;
    const tangentialX = -radialY;
    const tangentialY = radialX;
    const ax =
      this.state.gravityX +
      radialX * particle.radialAccel +
      tangentialX * particle.tangentialAccel;
    const ay =
      -this.state.gravityY +
      radialY * particle.radialAccel +
      tangentialY * particle.tangentialAccel;

    particle.vx += ax * dt;
    particle.vy += ay * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    return true;
  }

  private emit(dt: number): void {
    if (!this.state.infinite && this.elapsed > this.state.duration) return;
    const emissionRate = this.state.emissionRate;
    const rate = Number.isFinite(emissionRate) ? Math.max(0, emissionRate) : 0;
    this.emitCarry += rate * dt;
    const requestedCount = Math.floor(this.emitCarry);
    this.emitCarry -= requestedCount;

    const dx = this.emitter.x - this.lastEmitPosition.x;
    const dy = this.emitter.y - this.lastEmitPosition.y;
    const maxParticles = this.state.maxParticles;
    const slots = Math.max(0, (Number.isFinite(maxParticles) ? Math.floor(maxParticles) : 0) - this.particles.length);
    const count = Math.min(requestedCount, slots);

    if (count <= 0) {
      this.lastEmitPosition.x = this.emitter.x;
      this.lastEmitPosition.y = this.emitter.y;
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const t = (index + 1) / count;
      this.particles.push(
        this.createParticle({
          x: this.lastEmitPosition.x + dx * t,
          y: this.lastEmitPosition.y + dy * t,
        }),
      );
    }

    this.lastEmitPosition.x = this.emitter.x;
    this.lastEmitPosition.y = this.emitter.y;
  }

  private renderParticle(particle: Particle): void {
    const t = clamp(particle.age / particle.life, 0, 1);
    const size = Math.max(0.1, mix(particle.startSize, particle.endSize, t));
    const color = mixColor(particle.startColor, particle.endColor, t);
    if (size < 0.25 || color.a < 0.015) return;

    const sprite: HTMLImageElement | HTMLCanvasElement = this.state.useTextureColor
      ? this.textureImage
      : this.tintedTexture(color);
    const rotation = (mix(particle.rotationStart, particle.rotationEnd, t) * Math.PI) / 180;
    const aspect = sprite.width / Math.max(1, sprite.height);
    const drawW = aspect >= 1 ? size : size * aspect;
    const drawH = aspect >= 1 ? size / aspect : size;

    this.ctx.save();
    this.ctx.translate(particle.x, particle.y);
    this.ctx.rotate(rotation);
    this.ctx.globalAlpha = this.state.useTextureColor ? color.a : 1;
    this.ctx.globalCompositeOperation =
      this.state.blendSrc === "SRC_ALPHA" && this.state.blendDst === "ONE" ? "lighter" : "source-over";
    this.ctx.drawImage(sprite, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
    this.ctx.restore();
  }

  private updateParticles(dt: number): void {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this.particles.length; readIndex += 1) {
      const particle = this.particles[readIndex];
      if (this.updateParticle(particle, dt)) {
        this.particles[writeIndex] = particle;
        writeIndex += 1;
      }
    }
    this.particles.length = writeIndex;
  }

  private renderBackground(canvasWidth: number, canvasHeight: number): void {
    if (!this.backgroundImage || !this.backgroundVisible) return;
    const imageWidth = this.backgroundImage.naturalWidth;
    const imageHeight = this.backgroundImage.naturalHeight;
    const x = (canvasWidth - imageWidth) * 0.5 + this.backgroundOffset.x;
    const y = (canvasHeight - imageHeight) * 0.5 + this.backgroundOffset.y;
    // 粒子尺寸使用 CSS 像素；背景同样按原始像素 1:1 绘制，便于准确对照。
    this.ctx.drawImage(this.backgroundImage, x, y, imageWidth, imageHeight);
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;

    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = this.state.backgroundColor;
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.renderBackground(rect.width, rect.height);

    if (!this.paused) {
      this.elapsed += dt;
      this.emit(dt);
      this.updateParticles(dt);
    }

    for (const particle of this.particles) this.renderParticle(particle);
    this.onParticleCount(`${this.particles.length} / ${this.state.maxParticles}`);
    this.frameId = requestAnimationFrame(this.frame);
  };
}
