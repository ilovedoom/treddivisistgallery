import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { GalleryConfig } from "@/lib/gallery/types";
import { updateArtwork } from "@/lib/gallery/store";
import { loc } from "@/lib/gallery/fields";

export function AccessibilityPanel({ config }: { config: GalleryConfig }) {
  const [onlyMissing, setOnlyMissing] = useState(true);
  const lang = config.defaultLanguage;
  const missing = config.artworks.filter((a) => !(a.altText?.[lang] ?? "").trim());
  const complete = config.artworks.length - missing.length;
  const list = onlyMissing ? missing : config.artworks;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-card/60 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Alt text</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <Check className="size-4 text-emerald-500" /> {complete} opere complete
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
            <AlertTriangle className="size-4 text-amber-500" /> {missing.length} opere senza alt text
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-4">
          <Label htmlFor="only-missing" className="text-sm">
            Mostra solo opere senza alt text
          </Label>
          <Switch id="only-missing" checked={onlyMissing} onCheckedChange={setOnlyMissing} />
        </div>
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <div key={a.id} className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                {loc(a.metadata.title, lang, lang)}{" "}
                <span className="text-xs text-muted-foreground">· {a.metadata.artist}</span>
              </p>
              {!(a.altText?.[lang] ?? "").trim() && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-600">
                  Alt text mancante
                </span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {config.languages.map((l) => (
                <div key={l} className="flex items-start gap-2">
                  <span className="mt-2 w-6 text-[11px] font-semibold uppercase text-muted-foreground">{l}</span>
                  <Textarea
                    rows={2}
                    placeholder="Descrivi il contenuto visivo dell'immagine"
                    value={a.altText?.[l] ?? ""}
                    onChange={(e) =>
                      updateArtwork(a.id, `Alt text (${a.id})`, (art) => ({
                        ...art,
                        altText: { ...art.altText, [l]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
            Tutte le opere hanno un alt text.
          </p>
        )}
      </div>
    </div>
  );
}
