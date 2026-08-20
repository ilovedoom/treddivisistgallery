import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Artwork, GalleryConfig, PlaquePosition, PlaqueAlignment } from "@/lib/gallery/types";
import { updateArtwork } from "@/lib/gallery/store";
import { allFields } from "@/lib/gallery/fields";
import { resolveBottomFields, resolveFlag, resolvePlaqueFields, resolveTemplateId } from "@/lib/gallery/resolve";

type FlagKey = "showPlaque" | "showBottomInfo" | "showTitle" | "showArtist";

function TriStateFlag({
  label,
  artwork,
  config,
  flag,
}: {
  label: string;
  artwork: Artwork;
  config: GalleryConfig;
  flag: FlagKey;
}) {
  const value = artwork.display[flag];
  const effective = resolveFlag(config, artwork, flag);
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          {value === null ? `Eredita (stanza/galleria): ${effective ? "sì" : "no"}` : "Override opera"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={effective}
          onCheckedChange={(checked) =>
            updateArtwork(artwork.id, `Visibilità ${flag} (${artwork.id})`, (a) => ({
              ...a,
              display: { ...a.display, [flag]: checked },
            }))
          }
        />
        {value !== null && (
          <button
            type="button"
            className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            onClick={() =>
              updateArtwork(artwork.id, `Visibilità ${flag} ereditata (${artwork.id})`, (a) => ({
                ...a,
                display: { ...a.display, [flag]: null },
              }))
            }
          >
            eredita
          </button>
        )}
      </div>
    </div>
  );
}

function FieldChecklist({
  config,
  selected,
  onChange,
}: {
  config: GalleryConfig;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {allFields(config).map((f) => {
        const checked = selected.includes(f.key);
        return (
          <label key={f.key} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) =>
                onChange(v ? [...selected, f.key] : selected.filter((k) => k !== f.key))
              }
            />
            {f.label}
          </label>
        );
      })}
    </div>
  );
}

export function PlaqueEditor({ config, artwork }: { config: GalleryConfig; artwork: Artwork }) {
  const p = artwork.plaque;
  const setPlaque = (patch: Partial<Artwork["plaque"]>) =>
    updateArtwork(artwork.id, `Targhetta (${artwork.id})`, (a) => ({
      ...a,
      plaque: { ...a.plaque, ...patch },
    }));

  const templateId = resolveTemplateId(config, artwork);
  const plaqueFields = resolvePlaqueFields(config, artwork);
  const bottomFields = resolveBottomFields(config, artwork);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Visibilità</h3>
        <TriStateFlag label="Mostra targhetta nella galleria" artwork={artwork} config={config} flag="showPlaque" />
        <TriStateFlag label="Mostra informazioni inferiori" artwork={artwork} config={config} flag="showBottomInfo" />
        <TriStateFlag label="Mostra titolo" artwork={artwork} config={config} flag="showTitle" />
        <TriStateFlag label="Mostra autore" artwork={artwork} config={config} flag="showArtist" />
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Configurazione targhetta
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Plaque position</Label>
            <Select value={p.position} onValueChange={(v) => setPlaque({ position: v as PlaquePosition })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["BOTTOM", "LEFT", "RIGHT", "CUSTOM"] as PlaquePosition[]).map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Plaque alignment</Label>
            <Select value={p.alignment} onValueChange={(v) => setPlaque({ alignment: v as PlaqueAlignment })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["left", "center", "right"] as PlaqueAlignment[]).map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumField label="Plaque offset X (m)" value={p.offset.x} step={0.05} onChange={(v) => setPlaque({ offset: { ...p.offset, x: v } })} />
          <NumField label="Plaque offset Y (m)" value={p.offset.y} step={0.05} onChange={(v) => setPlaque({ offset: { ...p.offset, y: v } })} />
          <NumField label="Plaque rotation (°)" value={p.rotation} step={1} onChange={(v) => setPlaque({ rotation: v })} />
          <NumField label="Plaque text size (×)" value={p.textSize} step={0.05} onChange={(v) => setPlaque({ textSize: v })} />
          <NumField label="Plaque width (m)" value={p.width} step={0.02} onChange={(v) => setPlaque({ width: v })} />
          <NumField label="Plaque height (m)" value={p.height} step={0.02} onChange={(v) => setPlaque({ height: v })} />
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Contenuto della targhetta
        </h3>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Template</Label>
          <Select
            value={artwork.display.plaqueTemplate ?? "inherit"}
            onValueChange={(v) =>
              updateArtwork(artwork.id, `Template targhetta (${artwork.id})`, (a) => ({
                ...a,
                display: { ...a.display, plaqueTemplate: v === "inherit" ? null : v },
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Eredita dalla galleria ({templateId})</SelectItem>
              {config.plaqueTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FieldChecklist
          config={config}
          selected={plaqueFields}
          onChange={(next) =>
            updateArtwork(artwork.id, `Campi targhetta (${artwork.id})`, (a) => ({
              ...a,
              display: { ...a.display, plaqueFields: next },
            }))
          }
        />
        {artwork.display.plaqueFields && (
          <button
            type="button"
            className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            onClick={() =>
              updateArtwork(artwork.id, `Campi targhetta da template (${artwork.id})`, (a) => ({
                ...a,
                display: { ...a.display, plaqueFields: null },
              }))
            }
          >
            Torna ai campi del template
          </button>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Custom plaque text</Label>
          {config.languages.map((lang) => (
            <div key={lang} className="flex items-start gap-2">
              <span className="mt-2 w-6 text-[11px] font-semibold uppercase text-muted-foreground">{lang}</span>
              <Textarea
                rows={2}
                value={artwork.customPlaqueText?.[lang] ?? ""}
                onChange={(e) =>
                  updateArtwork(artwork.id, `Testo targhetta (${artwork.id})`, (a) => ({
                    ...a,
                    customPlaqueText: { ...a.customPlaqueText, [lang]: e.target.value },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Campi della UI inferiore
        </h3>
        <FieldChecklist
          config={config}
          selected={bottomFields}
          onChange={(next) =>
            updateArtwork(artwork.id, `Campi UI inferiore (${artwork.id})`, (a) => ({
              ...a,
              display: { ...a.display, bottomFields: next },
            }))
          }
        />
      </section>
    </div>
  );
}

function NumField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
