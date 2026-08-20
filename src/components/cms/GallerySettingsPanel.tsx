import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import type { GalleryConfig, PlaqueAlignment } from "@/lib/gallery/types";
import { updateConfig } from "@/lib/gallery/store";
import { allFields } from "@/lib/gallery/fields";

export function GallerySettingsPanel({ config }: { config: GalleryConfig }) {
  const [newField, setNewField] = useState("");
  const style = config.plaqueStyle;

  const setStyle = (patch: Partial<typeof style>) =>
    updateConfig("Stile targhette", (c) => ({ ...c, plaqueStyle: { ...c.plaqueStyle, ...patch } }));

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Lingue</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Lingua mostrata</Label>
            <Select
              value={config.languageMode}
              onValueChange={(v) => updateConfig("Lingua galleria", (c) => ({ ...c, languageMode: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatica (lingua interfaccia)</SelectItem>
                {config.languages.map((l) => (
                  <SelectItem key={l} value={l}>
                    Forza {l.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Lingue disponibili</Label>
            <Input
              value={config.languages.join(", ")}
              onChange={(e) =>
                updateConfig("Lingue disponibili", (c) => ({
                  ...c,
                  languages: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Campi metadata personalizzati
        </h3>
        {config.customFields.map((f) => (
          <div key={f.key} className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2">
            <Input
              className="max-w-56"
              value={f.label}
              onChange={(e) =>
                updateConfig("Campi personalizzati", (c) => ({
                  ...c,
                  customFields: c.customFields.map((x) =>
                    x.key === f.key ? { ...x, label: e.target.value } : x,
                  ),
                }))
              }
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={f.localized}
                onCheckedChange={(v) =>
                  updateConfig("Campi personalizzati", (c) => ({
                    ...c,
                    customFields: c.customFields.map((x) =>
                      x.key === f.key ? { ...x, localized: Boolean(v) } : x,
                    ),
                  }))
                }
              />
              multilingua
            </label>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">{f.key}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                updateConfig("Campi personalizzati", (c) => ({
                  ...c,
                  customFields: c.customFields.filter((x) => x.key !== f.key),
                }))
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="Nuovo campo (es. Curatore, Location, Periodo…)"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
          />
          <Button
            onClick={() => {
              const label = newField.trim();
              if (!label) return;
              const key = label
                .toLowerCase()
                .normalize("NFD")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
              updateConfig("Campi personalizzati", (c) => ({
                ...c,
                customFields: [...c.customFields, { key: key || `field-${Date.now()}`, label, localized: false }],
              }));
              setNewField("");
            }}
          >
            <Plus className="size-4" /> Aggiungi
          </Button>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Template delle targhette
        </h3>
        {config.plaqueTemplates.map((t) => (
          <div key={t.id} className="rounded-md border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{t.name}</p>
              <span className="font-mono text-[11px] text-muted-foreground">{t.id}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {allFields(config).map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={t.fields.includes(f.key)}
                    onCheckedChange={(v) =>
                      updateConfig(`Template targhetta ${t.name}`, (c) => ({
                        ...c,
                        plaqueTemplates: c.plaqueTemplates.map((x) =>
                          x.id === t.id
                            ? {
                                ...x,
                                fields: v ? [...x.fields, f.key] : x.fields.filter((k) => k !== f.key),
                              }
                            : x,
                        ),
                      }))
                    }
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Template di default</Label>
          <Select
            value={config.defaults.plaqueTemplate}
            onValueChange={(v) =>
              updateConfig("Template di default", (c) => ({
                ...c,
                defaults: { ...c.defaults, plaqueTemplate: v },
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.plaqueTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Plaque style</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Background</Label>
            <Input type="color" value={style.background} onChange={(e) => setStyle({ background: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Text color</Label>
            <Input type="color" value={style.textColor} onChange={(e) => setStyle({ textColor: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Border</Label>
            <Input type="color" value={style.border} onChange={(e) => setStyle({ border: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Font</Label>
            <Input value={style.fontFamily} onChange={(e) => setStyle({ fontFamily: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Font size (px texture)</Label>
            <Input type="number" value={style.fontSize} onChange={(e) => setStyle({ fontSize: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Padding</Label>
            <Input type="number" value={style.padding} onChange={(e) => setStyle({ padding: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Border width</Label>
            <Input type="number" value={style.borderWidth} onChange={(e) => setStyle({ borderWidth: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Opacity</Label>
            <Input
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={style.opacity}
              onChange={(e) => setStyle({ opacity: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Width di default (m)</Label>
            <Input type="number" step={0.02} value={style.width} onChange={(e) => setStyle({ width: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Alignment</Label>
            <Select value={style.alignment} onValueChange={(v) => setStyle({ alignment: v as PlaqueAlignment })}>
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
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Default della galleria
        </h3>
        {(
          [
            ["showPlaque", "Mostra targhetta nella galleria"],
            ["showBottomInfo", "Mostra informazioni inferiori"],
            ["showTitle", "Mostra titolo"],
            ["showArtist", "Mostra autore"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <span className="text-sm text-foreground">{label}</span>
            <Switch
              checked={config.defaults[key]}
              onCheckedChange={(v) =>
                updateConfig(`Default galleria ${key}`, (c) => ({
                  ...c,
                  defaults: { ...c.defaults, [key]: v },
                }))
              }
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">Campi UI inferiore (default)</Label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {allFields(config).map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={config.defaults.bottomFields.includes(f.key)}
                  onCheckedChange={(v) =>
                    updateConfig("Campi UI inferiore (default)", (c) => ({
                      ...c,
                      defaults: {
                        ...c.defaults,
                        bottomFields: v
                          ? [...c.defaults.bottomFields, f.key]
                          : c.defaults.bottomFields.filter((k) => k !== f.key),
                      },
                    }))
                  }
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Impostazioni per stanza
        </h3>
        {config.rooms.map((room) => (
          <div key={room.id} className="rounded-md border border-border/60 p-3">
            <p className="text-sm font-medium text-foreground">{room.name}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["showPlaque", "Targhette"],
                  ["showBottomInfo", "UI inferiore"],
                  ["showTitle", "Titolo"],
                  ["showArtist", "Autore"],
                ] as const
              ).map(([key, label]) => {
                const value = room.display[key];
                return (
                  <div key={key} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {label} — {value === null ? "eredita" : value ? "sì" : "no"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={value ?? config.defaults[key]}
                        onCheckedChange={(v) =>
                          updateConfig(`Stanza ${room.name} · ${key}`, (c) => ({
                            ...c,
                            rooms: c.rooms.map((r) =>
                              r.id === room.id ? { ...r, display: { ...r.display, [key]: v } } : r,
                            ),
                          }))
                        }
                      />
                      {value !== null && (
                        <button
                          type="button"
                          className="text-[11px] underline-offset-2 hover:underline"
                          onClick={() =>
                            updateConfig(`Stanza ${room.name} · ${key}`, (c) => ({
                              ...c,
                              rooms: c.rooms.map((r) =>
                                r.id === room.id ? { ...r, display: { ...r.display, [key]: null } } : r,
                              ),
                            }))
                          }
                        >
                          eredita
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
