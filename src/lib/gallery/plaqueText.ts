import type { Artwork, GalleryConfig, LangCode } from "./types";
import { fieldValue, loc } from "./fields";
import { resolvePlaqueFields } from "./resolve";

export interface PlaqueLine {
  text: string;
  emphasis: "title" | "primary" | "secondary";
}

/** Contenuto sintetico della targhetta: nasce dai metadata, mai dalla descrizione per default. */
export function buildPlaqueLines(
  config: GalleryConfig,
  artwork: Artwork,
  lang: LangCode,
  fallback: LangCode,
): PlaqueLine[] {
  const fields = resolvePlaqueFields(config, artwork);
  const lines: PlaqueLine[] = [];
  for (const key of fields) {
    const value = fieldValue(artwork, key, lang, fallback);
    if (!value) continue;
    if (key === "title") lines.push({ text: value, emphasis: "title" });
    else if (key === "artist" || key === "year") lines.push({ text: value, emphasis: "primary" });
    else lines.push({ text: value, emphasis: "secondary" });
  }
  const custom = loc(artwork.customPlaqueText, lang, fallback);
  if (custom.trim()) {
    custom
      .split("\n")
      .filter(Boolean)
      .forEach((text) => lines.push({ text, emphasis: "secondary" }));
  }
  return lines;
}
