import type {
  Artwork,
  BaseboardConfig,
  ColorPalette,
  FrameConfig,
  FramePreset,
  GalleryConfig,
  GalleryState,
  GalleryTheme,
  LightingConfig,
  PlaqueConfig,
  SurfaceMaterial,
  SurfaceSet,
  TextureAsset,
} from "./types";

function surface(
  color: string,
  textureId: string | null,
  repeat: number,
  roughness: number,
  metalness = 0,
): SurfaceMaterial {
  return { color, textureId, repeat, roughness, metalness, opacity: 1, normalStrength: 0.4 };
}

/** Libreria texture procedurali disponibile senza upload. */
export const DEFAULT_TEXTURES: TextureAsset[] = [
  { id: "tex-plaster", name: "Intonaco fine", category: "plaster", url: null },
  { id: "tex-concrete", name: "Cemento", category: "concrete", url: null },
  { id: "tex-marble", name: "Marmo venato", category: "marble", url: null },
  { id: "tex-stone", name: "Pietra", category: "stone", url: null },
  { id: "tex-wood", name: "Rovere", category: "wood", url: null },
  { id: "tex-fabric", name: "Tessuto", category: "fabric", url: null },
  { id: "tex-metal", name: "Metallo spazzolato", category: "metal", url: null },
];

export const DEFAULT_MATERIALS: SurfaceSet = {
  walls: surface("#efece6", "tex-plaster", 6, 0.95),
  ceiling: surface("#f7f6f3", "tex-plaster", 8, 1),
  floor: surface("#c9bfae", "tex-wood", 14, 0.65),
  doors: surface("#6f584a", "tex-wood", 3, 0.55),
};

export const DEFAULT_BASEBOARD: BaseboardConfig = {
  mode: "SIMPLE",
  height: 0.14,
  depth: 0.04,
  material: surface("#e2ded4", null, 1, 0.6),
};

/** Preset cornice: profilo, profondità, distacco e passe-partout. */
export const FRAME_PRESETS: Record<
  Exclude<FramePreset, "CUSTOM">,
  Pick<FrameConfig, "width" | "depth" | "offset" | "matte" | "bevel" | "kind">
> = {
  MINIMAL: { width: 0.03, depth: 0.03, offset: 0.02, matte: 0, bevel: 0.2, kind: "METAL" },
  CLASSIC: { width: 0.09, depth: 0.06, offset: 0.03, matte: 0.05, bevel: 0.5, kind: "WOOD" },
  DEEP: { width: 0.07, depth: 0.14, offset: 0.02, matte: 0.03, bevel: 0.3, kind: "PAINTED" },
  FLOATING: { width: 0.02, depth: 0.05, offset: 0.06, matte: 0, bevel: 0.1, kind: "PAINTED" },
};

export const DEFAULT_FRAME: FrameConfig = {
  enabled: true,
  preset: "CLASSIC",
  ...FRAME_PRESETS.CLASSIC,
  material: surface("#3b2f26", "tex-wood", 2, 0.5, 0.05),
};

export const DEFAULT_LIGHTING: LightingConfig = {
  ambient: 0.65,
  key: 0.75,
  spot: 1.1,
  warmth: "#fff4e2",
  background: "#e8e5df",
};

export const DEFAULT_PALETTES: ColorPalette[] = [
  { id: "neutral", name: "Neutra", colors: ["#efece6", "#c9bfae", "#3b2f26", "#1b1b1f"] },
  { id: "museum", name: "Museo", colors: ["#e7e3dc", "#8c8577", "#2c2a26", "#f4f1ea"] },
  { id: "contrast", name: "Contrasto", colors: ["#1f1f22", "#3a3a40", "#d8d2c4", "#c98a3c"] },
];

export const DEFAULT_THEMES: GalleryTheme[] = [
  {
    id: "theme-classic",
    name: "Museo classico",
    materials: DEFAULT_MATERIALS,
    baseboard: DEFAULT_BASEBOARD,
    frame: DEFAULT_FRAME,
    lighting: DEFAULT_LIGHTING,
  },
  {
    id: "theme-white-cube",
    name: "White cube",
    materials: {
      walls: surface("#fafafa", null, 1, 0.98),
      ceiling: surface("#ffffff", null, 1, 1),
      floor: surface("#dedad3", "tex-concrete", 10, 0.8),
      doors: surface("#f0f0f0", null, 1, 0.7),
    },
    baseboard: { ...DEFAULT_BASEBOARD, mode: "NONE" },
    frame: {
      enabled: true,
      preset: "MINIMAL",
      ...FRAME_PRESETS.MINIMAL,
      material: surface("#1c1c1e", null, 1, 0.4, 0.3),
    },
    lighting: { ambient: 0.8, key: 0.7, spot: 0.9, warmth: "#ffffff", background: "#f2f2f2" },
  },
  {
    id: "theme-dark",
    name: "Sala scura",
    materials: {
      walls: surface("#2a2a2e", "tex-plaster", 6, 0.9),
      ceiling: surface("#232327", null, 1, 1),
      floor: surface("#3a332c", "tex-stone", 12, 0.75),
      doors: surface("#4a3f36", "tex-wood", 3, 0.5),
    },
    baseboard: { ...DEFAULT_BASEBOARD, material: surface("#1d1d20", null, 1, 0.6) },
    frame: {
      enabled: true,
      preset: "DEEP",
      ...FRAME_PRESETS.DEEP,
      material: surface("#b08d4f", "tex-metal", 2, 0.35, 0.6),
    },
    lighting: { ambient: 0.35, key: 0.5, spot: 1.6, warmth: "#ffe3b8", background: "#17171a" },
  },
];

export const DEFAULT_PLAQUE: PlaqueConfig = {
  position: "BOTTOM",
  offset: { x: 0, y: 0, z: 0 },
  rotation: 0,
  width: 0.62,
  height: 0.36,
  alignment: "left",
  textSize: 1,
};

function artwork(
  id: string,
  wallId: string,
  u: number,
  color: string,
  title: { it: string; en: string },
  artist: string,
  year: string,
  technique: { it: string; en: string },
  dimensions: string,
  altText: { it: string; en: string },
  description: { it: string; en: string },
): Artwork {
  return {
    id,
    roomId: "room-main",
    wallId,
    u,
    v: 2,
    media: { url: null, color, width: 1200, height: 800 },
    metadata: {
      title,
      artist,
      year,
      description,
      technique,
      dimensions,
      category: "Pittura",
      collection: "Collezione Aurora",
      inventoryNumber: id.toUpperCase(),
      credit: "Courtesy Galleria Aurora",
      copyright: `© ${year} ${artist}`,
      url: "",
      custom: {},
    },
    altText,
    plaque: { ...DEFAULT_PLAQUE, offset: { ...DEFAULT_PLAQUE.offset } },
    customPlaqueText: { it: "", en: "" },
    display: {
      showPlaque: null,
      showBottomInfo: null,
      showTitle: null,
      showArtist: null,
      plaqueTemplate: null,
      plaqueFields: null,
      bottomFields: null,
    },
    frame: null,
  };
}

export const DEFAULT_CONFIG: GalleryConfig = {
  name: "Galleria Aurora",
  languages: ["it", "en"],
  defaultLanguage: "it",
  languageMode: "auto",
  customFields: [
    { key: "curator", label: "Curatore", localized: false },
    { key: "provenance", label: "Provenienza", localized: true },
  ],
  plaqueTemplates: [
    { id: "minimal", name: "Minimal", fields: ["title", "artist", "year"] },
    { id: "museum", name: "Museum", fields: ["title", "artist", "year", "technique", "dimensions"] },
    { id: "custom", name: "Custom", fields: ["title", "artist"] },
  ],
  plaqueStyle: {
    background: "#f4f1ea",
    textColor: "#1b1b1f",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 26,
    padding: 22,
    border: "#d8d2c4",
    borderWidth: 2,
    opacity: 1,
    width: 0.62,
    alignment: "left",
  },
  defaults: {
    showPlaque: true,
    showBottomInfo: true,
    showTitle: true,
    showArtist: true,
    plaqueTemplate: "museum",
    bottomFields: ["technique", "dimensions", "description"],
  },
  textures: DEFAULT_TEXTURES,
  materials: DEFAULT_MATERIALS,
  baseboard: DEFAULT_BASEBOARD,
  frameDefaults: DEFAULT_FRAME,
  lighting: DEFAULT_LIGHTING,
  themes: DEFAULT_THEMES,
  activeThemeId: "theme-classic",
  palettes: DEFAULT_PALETTES,
  walls: [
    { id: "wall-left", x: -8, z: 0, rotationY: Math.PI / 2, width: 24, height: 6 },
    { id: "wall-right", x: 8, z: 0, rotationY: -Math.PI / 2, width: 24, height: 6 },
    { id: "wall-back", x: 0, z: -12, rotationY: 0, width: 16, height: 6 },
  ],
  rooms: [
    {
      id: "room-main",
      name: "Sala principale",
      display: {
        showPlaque: null,
        showBottomInfo: null,
        showTitle: null,
        showArtist: null,
        plaqueTemplate: null,
        plaqueFields: null,
        bottomFields: null,
      },
    },
  ],
  artworks: [
    artwork(
      "artwork-001",
      "wall-left",
      -4,
      "#d97a4a",
      { it: "Orizzonte Liquido", en: "Liquid Horizon" },
      "M. Reni",
      "2024",
      { it: "Olio su tela", en: "Oil on canvas" },
      "120 × 80 cm",
      {
        it: "Ampie fasce arancioni sfumate che suggeriscono un orizzonte marino al tramonto.",
        en: "Wide graded orange bands suggesting a sea horizon at sunset.",
      },
      {
        it: "Studio sulla dissoluzione della linea d'orizzonte nella luce calda del tramonto.",
        en: "A study on the dissolution of the horizon line in warm sunset light.",
      },
    ),
    artwork(
      "artwork-002",
      "wall-left",
      4,
      "#3f7f8f",
      { it: "Campo Magnetico", en: "Magnetic Field" },
      "A. Vella",
      "2023",
      { it: "Acrilico su lino", en: "Acrylic on linen" },
      "100 × 100 cm",
      {
        it: "Superficie blu-verde percorsa da linee curve concentriche.",
        en: "Teal surface crossed by concentric curved lines.",
      },
      {
        it: "Le linee di forza diventano struttura pittorica e ritmo visivo.",
        en: "Lines of force become pictorial structure and visual rhythm.",
      },
    ),
    artwork(
      "artwork-003",
      "wall-right",
      -4,
      "#b8a05a",
      { it: "Silenzio Verticale", en: "Vertical Silence" },
      "L. Ferri",
      "2025",
      { it: "Tempera su tavola", en: "Tempera on panel" },
      "90 × 140 cm",
      { it: "", en: "" },
      {
        it: "Una colonna di luce dorata attraversa il campo pittorico dall'alto verso il basso.",
        en: "A column of golden light crosses the field from top to bottom.",
      },
    ),
    artwork(
      "artwork-004",
      "wall-right",
      4,
      "#7a5a8f",
      { it: "Onda Ferma", en: "Still Wave" },
      "S. Toma",
      "2022",
      { it: "Olio e cera su tela", en: "Oil and wax on canvas" },
      "150 × 90 cm",
      {
        it: "Ondulazioni viola profonde immobili su fondo scuro.",
        en: "Deep violet ripples held still on a dark ground.",
      },
      {
        it: "Il movimento dell'acqua sospeso in un istante di quiete assoluta.",
        en: "The movement of water suspended in an instant of absolute stillness.",
      },
    ),
    artwork(
      "artwork-005",
      "wall-back",
      -3,
      "#a64b3c",
      { it: "Terra Rossa", en: "Red Earth" },
      "G. Salvi",
      "2021",
      { it: "Pigmenti naturali su juta", en: "Natural pigments on jute" },
      "110 × 110 cm",
      { it: "", en: "" },
      {
        it: "Materia terrosa stesa a strati sovrapposti, memoria di paesaggi agricoli.",
        en: "Earthy matter laid in overlapping layers, a memory of farmed landscapes.",
      },
    ),
    artwork(
      "artwork-006",
      "wall-back",
      3,
      "#4c7a55",
      { it: "Luce Obliqua", en: "Oblique Light" },
      "C. Marra",
      "2026",
      { it: "Olio su tela", en: "Oil on canvas" },
      "120 × 80 cm",
      {
        it: "Un fascio di luce verde attraversa diagonalmente una superficie densa.",
        en: "A green beam of light cuts diagonally across a dense surface.",
      },
      {
        it: "La diagonale come misura del tempo che attraversa lo spazio espositivo.",
        en: "The diagonal as a measure of time crossing the exhibition space.",
      },
    ),
  ],
};

export const DEFAULT_STATE: GalleryState = {
  config: DEFAULT_CONFIG,
  versions: [],
  publishedVersionId: null,
};
