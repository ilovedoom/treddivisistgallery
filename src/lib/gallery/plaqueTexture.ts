import * as THREE from "three";
import type { PlaqueStyle, PlaqueAlignment } from "./types";
import type { PlaqueLine } from "./plaqueText";

const PX_PER_METER = 900;

/** Disegna la targhetta su canvas: stile museale, non HUD. */
export function createPlaqueTexture(
  lines: PlaqueLine[],
  style: PlaqueStyle,
  widthM: number,
  heightM: number,
  alignment: PlaqueAlignment,
  textScale: number,
): THREE.CanvasTexture {
  const w = Math.max(64, Math.round(widthM * PX_PER_METER));
  const h = Math.max(64, Math.round(heightM * PX_PER_METER));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, w, h);
  if (style.borderWidth > 0) {
    ctx.strokeStyle = style.border;
    ctx.lineWidth = style.borderWidth * 2;
    ctx.strokeRect(style.borderWidth, style.borderWidth, w - style.borderWidth * 2, h - style.borderWidth * 2);
  }

  const pad = style.padding;
  const base = style.fontSize * textScale;
  ctx.textAlign = alignment === "center" ? "center" : alignment === "right" ? "right" : "left";
  const x = alignment === "center" ? w / 2 : alignment === "right" ? w - pad : pad;

  let y = pad + base;
  for (const line of lines) {
    const size = line.emphasis === "title" ? base * 1.28 : line.emphasis === "primary" ? base : base * 0.88;
    ctx.font = `${line.emphasis === "title" ? "600" : "400"} ${size}px ${style.fontFamily}`;
    ctx.fillStyle = style.textColor;
    ctx.globalAlpha = line.emphasis === "secondary" ? 0.78 : 1;
    if (y > h - pad * 0.4) break;
    ctx.fillText(line.text, x, y, w - pad * 2);
    y += size * 1.42;
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
