export type LangCode = string;

/** Testo multilingua: { it: "...", en: "..." } — mai duplicare l'immagine per lingua. */
export type Localized = Record<LangCode, string>;

export type MetadataFieldKey =
  | "title"
  | "artist"
  | "year"
  | "description"
  | "technique"
  | "dimensions"
  | "category"
  | "collection"
  | "inventoryNumber"
  | "credit"
  | "copyright"
  | "url";

export interface CustomFieldDef {
  key: string;
  label: string;
  localized: boolean;
}

export interface ArtworkMetadata {
  title: Localized;
  artist: string;
  year: string;
  description: Localized;
  technique: Localized;
  dimensions: string;
  category: string;
  collection: string;
  inventoryNumber: string;
  credit: string;
  copyright: string;
  url: string;
  /** Valori dei campi personalizzati definiti a livello di galleria. */
  custom: Record<string, Localized>;
}

export type PlaquePosition = "BOTTOM" | "LEFT" | "RIGHT" | "CUSTOM";
export type PlaqueAlignment = "left" | "center" | "right";

export interface PlaqueConfig {
  position: PlaquePosition;
  offset: { x: number; y: number; z: number };
  rotation: number;
  width: number;
  height: number;
  alignment: PlaqueAlignment;
  textSize: number;
}

export type PlaqueTemplateId = string;

export interface PlaqueTemplate {
  id: PlaqueTemplateId;
  name: string;
  /** Campi metadata (chiavi standard o custom) mostrati sulla targhetta. */
  fields: string[];
}

export interface PlaqueStyle {
  background: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  padding: number;
  border: string;
  borderWidth: number;
  opacity: number;
  width: number;
  alignment: PlaqueAlignment;
}

/** Impostazioni di visibilità: null = eredita dal livello superiore. */
export interface DisplayOverrides {
  showPlaque: boolean | null;
  showBottomInfo: boolean | null;
  showTitle: boolean | null;
  showArtist: boolean | null;
  plaqueTemplate: PlaqueTemplateId | null;
  /** Override dei campi della targhetta rispetto al template. */
  plaqueFields: string[] | null;
  bottomFields: string[] | null;
}

export interface Artwork {
  id: string;
  roomId: string;
  media: { url: string | null; color: string; width: number; height: number };
  /** Parete a cui l'opera è agganciata: posizione/rotazione derivano dalla parete. */
  wallId: string;
  /** Posizione lungo la parete (u = orizzontale in metri, v = altezza in metri). */
  u: number;
  v: number;
  metadata: ArtworkMetadata;
  altText: Localized;
  plaque: PlaqueConfig;
  customPlaqueText: Localized;
  display: DisplayOverrides;
}

export interface Wall {
  id: string;
  /** Centro della parete nel piano XZ. */
  x: number;
  z: number;
  rotationY: number;
  width: number;
  height: number;
}

export interface Room {
  id: string;
  name: string;
  display: DisplayOverrides;
}

export interface GalleryDefaults {
  showPlaque: boolean;
  showBottomInfo: boolean;
  showTitle: boolean;
  showArtist: boolean;
  plaqueTemplate: PlaqueTemplateId;
  bottomFields: string[];
}

export interface GalleryConfig {
  name: string;
  languages: LangCode[];
  defaultLanguage: LangCode;
  /** "auto" = usa la lingua dell'interfaccia, altrimenti forza una lingua. */
  languageMode: "auto" | LangCode;
  customFields: CustomFieldDef[];
  plaqueTemplates: PlaqueTemplate[];
  plaqueStyle: PlaqueStyle;
  defaults: GalleryDefaults;
  walls: Wall[];
  rooms: Room[];
  artworks: Artwork[];
}

export interface GalleryVersion {
  id: string;
  createdAt: string;
  label: string;
  published: boolean;
  changes: string[];
  /** Snapshot immutabile dei dati al momento della pubblicazione. */
  snapshot: GalleryConfig;
}

export interface GalleryState {
  config: GalleryConfig;
  versions: GalleryVersion[];
  publishedVersionId: string | null;
}
