import * as THREE from "three";
import type { SurfaceMaterial, TextureAsset, TextureCategory } from "./types";

/**
 * Libreria texture leggera: le texture di libreria sono procedurali
 * (generate su canvas 256×256, nessun download, dispose esplicito),
 * le texture caricate dall'amministratore usano il loro data URL.
 */
export const TEXTURE_CATEGORIES: TextureCategory[] = [
  "wood",
  "stone",
  "concrete",
  "marble",
  "plaster",
  "fabric",
  "metal",
  "custom",
];

export const CATEGORY_LABEL: Record<TextureCategory, string> = {
  wood: "Legno",
  stone: "Pietra",
  concrete: "Cemento",
  marble: "Marmo",
  plaster: "Intonaco",
  fabric: "Tessuto",
  metal: "Metallo",
  custom: "Personalizzata",
};

const SIZE = 256;

function noise(ctx: CanvasRenderingContext2D, amount: number, alpha: number) {
  for (let i = 0; i < amount; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    ctx.fillStyle = `rgba(0,0,0,${alpha * Math.random()})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

/** Disegna il pattern della categoria su un canvas monocromatico modulabile. */
export function drawTexturePattern(canvas: HTMLCanvasElement, category: TextureCategory) {
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);

  switch (category) {
    case "wood": {
      for (let y = 0; y < SIZE; y += 4) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
        ctx.fillRect(0, y, SIZE, 2 + Math.random() * 2);
      }
      noise(ctx, 1200, 0.08);
      break;
    }
    case "stone": {
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.08})`;
        const w = 18 + Math.random() * 40;
        ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, w, w * 0.6);
      }
      noise(ctx, 2600, 0.12);
      break;
    }
    case "concrete": {
      noise(ctx, 9000, 0.16);
      break;
    }
    case "marble": {
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      for (let i = 0; i < 22; i++) {
        ctx.beginPath();
        ctx.lineWidth = 0.6 + Math.random() * 2;
        let x = Math.random() * SIZE;
        let y = 0;
        ctx.moveTo(x, y);
        while (y < SIZE) {
          x += (Math.random() - 0.5) * 26;
          y += 12;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      noise(ctx, 900, 0.05);
      break;
    }
    case "plaster": {
      noise(ctx, 4000, 0.06);
      break;
    }
    case "fabric": {
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.lineWidth = 1;
      for (let i = 0; i < SIZE; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, SIZE);
        ctx.moveTo(0, i);
        ctx.lineTo(SIZE, i);
        ctx.stroke();
      }
      noise(ctx, 1500, 0.05);
      break;
    }
    case "metal": {
      for (let y = 0; y < SIZE; y += 2) {
        ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.05})`;
        ctx.fillRect(0, y, SIZE, 1);
      }
      break;
    }
    default: {
      noise(ctx, 500, 0.04);
    }
  }
}

/** Anteprima data URL per la libreria del CMS. */
export function texturePreview(category: TextureCategory, color: string): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  drawTexturePattern(canvas, category);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }
  return canvas.toDataURL("image/png");
}

/**
 * Costruisce il materiale Three.js di una superficie.
 * Le texture create qui vengono registrate in `disposables` per il dispose.
 */
export function buildSurfaceMaterial(
  surface: SurfaceMaterial,
  library: TextureAsset[],
  disposables: Array<{ dispose: () => void }>,
  opts: { side?: THREE.Side } = {},
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(surface.color),
    roughness: THREE.MathUtils.clamp(surface.roughness, 0, 1),
    metalness: THREE.MathUtils.clamp(surface.metalness, 0, 1),
    transparent: surface.opacity < 1,
    opacity: surface.opacity,
    side: opts.side ?? THREE.FrontSide,
  });
  disposables.push(material);

  const asset = surface.textureId ? library.find((t) => t.id === surface.textureId) : undefined;
  if (!asset || typeof document === "undefined") return material;

  let texture: THREE.Texture | null = null;
  if (asset.url) {
    texture = new THREE.TextureLoader().load(asset.url);
  } else {
    const canvas = document.createElement("canvas");
    drawTexturePattern(canvas, asset.category);
    texture = new THREE.CanvasTexture(canvas);
  }
  if (!texture) return material;

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  const repeat = Math.max(0.1, surface.repeat);
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  material.map = texture;
  disposables.push(texture);

  if (surface.normalStrength > 0) {
    material.bumpMap = texture;
    material.bumpScale = surface.normalStrength * 0.05;
  }
  material.needsUpdate = true;
  return material;
}
