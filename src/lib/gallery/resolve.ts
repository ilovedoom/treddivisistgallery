import type { Artwork, GalleryConfig, DisplayOverrides, Wall } from "./types";

type BoolKey = "showPlaque" | "showBottomInfo" | "showTitle" | "showArtist";

/** Priorità: opera → stanza → default galleria. */
export function resolveFlag(config: GalleryConfig, artwork: Artwork, key: BoolKey): boolean {
  const room = config.rooms.find((r) => r.id === artwork.roomId);
  const chain: Array<DisplayOverrides | undefined> = [artwork.display, room?.display];
  for (const level of chain) {
    const v = level?.[key];
    if (typeof v === "boolean") return v;
  }
  return config.defaults[key];
}

export function resolveTemplateId(config: GalleryConfig, artwork: Artwork): string {
  const room = config.rooms.find((r) => r.id === artwork.roomId);
  return artwork.display.plaqueTemplate ?? room?.display.plaqueTemplate ?? config.defaults.plaqueTemplate;
}

export function resolvePlaqueFields(config: GalleryConfig, artwork: Artwork): string[] {
  if (artwork.display.plaqueFields) return artwork.display.plaqueFields;
  const room = config.rooms.find((r) => r.id === artwork.roomId);
  if (room?.display.plaqueFields) return room.display.plaqueFields;
  const tpl = config.plaqueTemplates.find((t) => t.id === resolveTemplateId(config, artwork));
  return tpl?.fields ?? ["title", "artist"];
}

export function resolveBottomFields(config: GalleryConfig, artwork: Artwork): string[] {
  const room = config.rooms.find((r) => r.id === artwork.roomId);
  return artwork.display.bottomFields ?? room?.display.bottomFields ?? config.defaults.bottomFields;
}

export function wallOf(config: GalleryConfig, artwork: Artwork): Wall | undefined {
  return config.walls.find((w) => w.id === artwork.wallId);
}

/** Converte coordinate lungo la parete (u, v) in coordinate mondo, mantenendo l'orientamento. */
export function wallToWorld(wall: Wall, u: number, v: number, depth = 0.1): [number, number, number] {
  const dirX = Math.cos(wall.rotationY);
  const dirZ = -Math.sin(wall.rotationY);
  const normX = Math.sin(wall.rotationY);
  const normZ = Math.cos(wall.rotationY);
  return [wall.x + dirX * u + normX * depth, v, wall.z + dirZ * u + normZ * depth];
}

export function missingAltText(config: GalleryConfig, lang: string): Artwork[] {
  return config.artworks.filter((a) => !(a.altText?.[lang] || "").trim());
}
