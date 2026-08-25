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
  /** null = usa la cornice predefinita della galleria. */
  frame: FrameConfig | null;
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
  textures: TextureAsset[];
  materials: SurfaceSet;
  baseboard: BaseboardConfig;
  frameDefaults: FrameConfig;
  lighting: LightingConfig;
  themes: GalleryTheme[];
  activeThemeId: string | null;
  palettes: ColorPalette[];
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

/* --------------------------------------------------------------
 * Materiali, texture, zoccoli, cornici e preset della galleria
 * ------------------------------------------------------------ */

export type TextureCategory =
  | "wood"
  | "stone"
  | "concrete"
  | "marble"
  | "plaster"
  | "fabric"
  | "metal"
  | "custom";

export interface TextureAsset {
  id: string;
  name: string;
  category: TextureCategory;
  /** null = texture procedurale generata a runtime (nessun download). */
  url: string | null;
}

export interface SurfaceMaterial {
  color: string;
  textureId: string | null;
  /** Ripetizioni della texture sulla superficie. */
  repeat: number;
  roughness: number;
  metalness: number;
  opacity: number;
  /** Intensità della normal map derivata dalla texture. */
  normalStrength: number;
}

export type SurfaceKey = "walls" | "ceiling" | "floor" | "doors";

export type SurfaceSet = Record<SurfaceKey, SurfaceMaterial>;

export interface BaseboardConfig {
  mode: "NONE" | "SIMPLE" | "CUSTOM";
  height: number;
  depth: number;
  material: SurfaceMaterial;
}

export type FramePreset = "MINIMAL" | "CLASSIC" | "DEEP" | "FLOATING" | "CUSTOM";
export type FrameMaterialKind = "WOOD" | "METAL" | "PAINTED" | "CUSTOM";

export interface FrameConfig {
  enabled: boolean;
  preset: FramePreset;
  /** Larghezza del profilo della cornice (m). */
  width: number;
  /** Profondità dell'estruso (m). */
  depth: number;
  /** Distacco della cornice dalla parete (m). */
  offset: number;
  /** Passe-partout tra apertura interna e opera (m). */
  matte: number;
  bevel: number;
  kind: FrameMaterialKind;
  material: SurfaceMaterial;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface LightingConfig {
  ambient: number;
  key: number;
  spot: number;
  warmth: string;
  background: string;
}

export interface GalleryTheme {
  id: string;
  name: string;
  materials: SurfaceSet;
  baseboard: BaseboardConfig;
  frame: FrameConfig;
  lighting: LightingConfig;
}
