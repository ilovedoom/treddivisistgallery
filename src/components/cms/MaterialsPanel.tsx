import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateConfig } from "@/lib/gallery/store";
import { FRAME_PRESETS } from "@/lib/gallery/defaults";
import type {
  FramePreset,
  GalleryConfig,
  SurfaceKey,
  SurfaceMaterial,
} from "@/lib/gallery/types";

const SURFACES: Array<{ key: SurfaceKey; label: string }> = [
  { key: "walls", label: "Pareti" },
  { key: "floor", label: "Pavimento" },
  { key: "ceiling", label: "Soffitto" },
  { key: "doors", label: "Porte" },
];

const PRESET_LABEL: Record<FramePreset, string> = {
  MINIMAL: "Minimal",
  CLASSIC: "Classica",
  DEEP: "Profonda",
  FLOATING: "Sospesa",
  CUSTOM: "Personalizzata",
};

function SurfaceEditor({
  label,
  value,
  config,
  onChange,
}: {
  label: string;
  value: SurfaceMaterial;
  config: GalleryConfig;
  onChange: (next: SurfaceMaterial) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <input
          type="color"
          aria-label={`Colore ${label}`}
          value={value.color}
          onChange={(e) => onChange({ ...value, color: e.target.value })}
          className="size-9 cursor-pointer rounded border border-border/60 bg-transparent"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Texture</Label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...value, textureId: null })}
            className={`focus-ring rounded border px-2 py-1 text-xs ${
              value.textureId === null ? "border-primary bg-primary/10" : "border-border/60"
            }`}
          >
            Nessuna
          </button>
          {config.textures.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...value, textureId: t.id })}
              className={`focus-ring rounded border px-2 py-1 text-xs ${
                value.textureId === t.id ? "border-primary bg-primary/10" : "border-border/60"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <NumberSlider
        label="Ripetizioni texture"
        value={value.repeat}
        min={0.5}
        max={24}
        step={0.5}
        onChange={(repeat) => onChange({ ...value, repeat })}
      />
      <NumberSlider
        label="Ruvidità"
        value={value.roughness}
        min={0}
        max={1}
        step={0.05}
        onChange={(roughness) => onChange({ ...value, roughness })}
      />
      <NumberSlider
        label="Metallicità"
        value={value.metalness}
        min={0}
        max={1}
        step={0.05}
        onChange={(metalness) => onChange({ ...value, metalness })}
      />
      <NumberSlider
        label="Rilievo"
        value={value.normalStrength}
        min={0}
        max={1}
        step={0.05}
        onChange={(normalStrength) => onChange({ ...value, normalStrength })}
      />
    </div>
  );
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v ?? value)}
      />
    </div>
  );
}

/** Materiali di sala, zoccoli, cornici, luci e temi predefiniti. */
export function MaterialsPanel({ config }: { config: GalleryConfig }) {
  const frame = config.frameDefaults;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Temi predefiniti</h3>
          <p className="text-xs text-muted-foreground">
            Applica un allestimento completo, poi modifica i dettagli.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.themes.map((theme) => (
            <Button
              key={theme.id}
              size="sm"
              variant={config.activeThemeId === theme.id ? "default" : "outline"}
              onClick={() =>
                updateConfig(`Tema "${theme.name}" applicato`, (c) => ({
                  ...c,
                  activeThemeId: theme.id,
                  materials: theme.materials,
                  baseboard: theme.baseboard,
                  frameDefaults: theme.frame,
                  lighting: theme.lighting,
                }))
              }
            >
              {theme.name}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {config.palettes.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-1">
              <span className="text-xs text-muted-foreground">{p.name}</span>
              {p.colors.map((c) => (
                <span
                  key={c}
                  title={c}
                  className="size-4 rounded-full border border-border/60"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          ))}
        </div>

        {SURFACES.map(({ key, label }) => (
          <SurfaceEditor
            key={key}
            label={label}
            value={config.materials[key]}
            config={config}
            onChange={(next) =>
              updateConfig(`Materiale ${label.toLowerCase()} aggiornato`, (c) => ({
                ...c,
                materials: { ...c.materials, [key]: next },
              }))
            }
          />
        ))}
      </section>

      <section className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <h3 className="text-sm font-semibold text-foreground">Zoccolo battiscopa</h3>
          <div className="flex gap-2">
            {(["NONE", "SIMPLE", "CUSTOM"] as const).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={config.baseboard.mode === mode ? "default" : "outline"}
                onClick={() =>
                  updateConfig("Zoccolo aggiornato", (c) => ({
                    ...c,
                    baseboard: { ...c.baseboard, mode },
                  }))
                }
              >
                {mode === "NONE" ? "Assente" : mode === "SIMPLE" ? "Semplice" : "Personalizzato"}
              </Button>
            ))}
          </div>
          {config.baseboard.mode !== "NONE" && (
            <>
              <NumberSlider
                label="Altezza (m)"
                value={config.baseboard.height}
                min={0.05}
                max={0.4}
                step={0.01}
                onChange={(height) =>
                  updateConfig("Altezza zoccolo", (c) => ({
                    ...c,
                    baseboard: { ...c.baseboard, height },
                  }))
                }
              />
              <SurfaceEditor
                label="Materiale zoccolo"
                value={config.baseboard.material}
                config={config}
                onChange={(material) =>
                  updateConfig("Materiale zoccolo", (c) => ({
                    ...c,
                    baseboard: { ...c.baseboard, material },
                  }))
                }
              />
            </>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Cornici predefinite</h3>
            <Badge variant="secondary">{PRESET_LABEL[frame.preset]}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FRAME_PRESETS) as Array<keyof typeof FRAME_PRESETS>).map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant={frame.preset === preset ? "default" : "outline"}
                onClick={() =>
                  updateConfig(`Cornice ${PRESET_LABEL[preset]}`, (c) => ({
                    ...c,
                    frameDefaults: {
                      ...c.frameDefaults,
                      preset,
                      ...FRAME_PRESETS[preset],
                      enabled: true,
                    },
                  }))
                }
              >
                {PRESET_LABEL[preset]}
              </Button>
            ))}
            <Button
              size="sm"
              variant={frame.enabled ? "outline" : "default"}
              onClick={() =>
                updateConfig("Cornici disattivate", (c) => ({
                  ...c,
                  frameDefaults: { ...c.frameDefaults, enabled: !c.frameDefaults.enabled },
                }))
              }
            >
              {frame.enabled ? "Senza cornice" : "Riattiva cornice"}
            </Button>
          </div>

          {frame.enabled && (
            <>
              <NumberSlider
                label="Larghezza profilo (m)"
                value={frame.width}
                min={0.01}
                max={0.2}
                step={0.005}
                onChange={(width) =>
                  updateConfig("Cornice personalizzata", (c) => ({
                    ...c,
                    frameDefaults: { ...c.frameDefaults, width, preset: "CUSTOM" },
                  }))
                }
              />
              <NumberSlider
                label="Profondità (m)"
                value={frame.depth}
                min={0.01}
                max={0.25}
                step={0.005}
                onChange={(depth) =>
                  updateConfig("Cornice personalizzata", (c) => ({
                    ...c,
                    frameDefaults: { ...c.frameDefaults, depth, preset: "CUSTOM" },
                  }))
                }
              />
              <NumberSlider
                label="Passe-partout (m)"
                value={frame.matte}
                min={0}
                max={0.2}
                step={0.005}
                onChange={(matte) =>
                  updateConfig("Cornice personalizzata", (c) => ({
                    ...c,
                    frameDefaults: { ...c.frameDefaults, matte, preset: "CUSTOM" },
                  }))
                }
              />
              <SurfaceEditor
                label="Materiale cornice"
                value={frame.material}
                config={config}
                onChange={(material) =>
                  updateConfig("Materiale cornice", (c) => ({
                    ...c,
                    frameDefaults: { ...c.frameDefaults, material },
                  }))
                }
              />
            </>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <h3 className="text-sm font-semibold text-foreground">Illuminazione</h3>
          <NumberSlider
            label="Luce ambiente"
            value={config.lighting.ambient}
            min={0}
            max={1.5}
            step={0.05}
            onChange={(ambient) =>
              updateConfig("Illuminazione", (c) => ({
                ...c,
                lighting: { ...c.lighting, ambient },
              }))
            }
          />
          <NumberSlider
            label="Luce principale"
            value={config.lighting.key}
            min={0}
            max={2}
            step={0.05}
            onChange={(key) =>
              updateConfig("Illuminazione", (c) => ({ ...c, lighting: { ...c.lighting, key } }))
            }
          />
          <NumberSlider
            label="Faretti sulle opere"
            value={config.lighting.spot}
            min={0}
            max={2.5}
            step={0.05}
            onChange={(spot) =>
              updateConfig("Illuminazione", (c) => ({ ...c, lighting: { ...c.lighting, spot } }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Temperatura luce</Label>
              <Input
                type="color"
                value={config.lighting.warmth}
                onChange={(e) =>
                  updateConfig("Illuminazione", (c) => ({
                    ...c,
                    lighting: { ...c.lighting, warmth: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sfondo sala</Label>
              <Input
                type="color"
                value={config.lighting.background}
                onChange={(e) =>
                  updateConfig("Illuminazione", (c) => ({
                    ...c,
                    lighting: { ...c.lighting, background: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
