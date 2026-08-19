import type { CustomFieldDef, GalleryConfig, Artwork, Localized, LangCode } from "./types";

export const STANDARD_FIELDS: Array<{ key: string; label: string; localized: boolean }> = [
  { key: "title", label: "Titolo", localized: true },
  { key: "artist", label: "Artista", localized: false },
  { key: "year", label: "Anno", localized: false },
  { key: "description", label: "Descrizione", localized: true },
  { key: "technique", label: "Tecnica", localized: true },
  { key: "dimensions", label: "Dimensioni", localized: false },
  { key: "category", label: "Categoria", localized: false },
  { key: "collection", label: "Collezione", localized: false },
  { key: "inventoryNumber", label: "Numero opera", localized: false },
  { key: "credit", label: "Credit", localized: false },
  { key: "copyright", label: "Copyright", localized: false },
  { key: "url", label: "URL / Link esterno", localized: false },
];

export function allFields(config: GalleryConfig): Array<{ key: string; label: string; localized: boolean }> {
  return [...STANDARD_FIELDS, ...config.customFields.map((f: CustomFieldDef) => ({ ...f }))];
}

export function fieldLabel(config: GalleryConfig, key: string): string {
  return allFields(config).find((f) => f.key === key)?.label ?? key;
}

export function loc(value: Localized | undefined, lang: LangCode, fallback: LangCode): string {
  if (!value) return "";
  return value[lang] || value[fallback] || Object.values(value).find(Boolean) || "";
}

/** Valore leggibile di un campo (standard o custom) nella lingua richiesta. */
export function fieldValue(artwork: Artwork, key: string, lang: LangCode, fallback: LangCode): string {
  const md = artwork.metadata as unknown as Record<string, unknown>;
  const raw = key in md ? md[key] : artwork.metadata.custom?.[key];
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  return loc(raw as Localized, lang, fallback);
}

export function emptyLocalized(languages: LangCode[], value = ""): Localized {
  return Object.fromEntries(languages.map((l) => [l, value]));
}
