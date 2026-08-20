import { AlertTriangle } from "lucide-react";
import { LocalizedField, TextField } from "./LocalizedField";
import { Separator } from "@/components/ui/separator";
import type { Artwork, GalleryConfig, Localized } from "@/lib/gallery/types";
import { updateArtwork } from "@/lib/gallery/store";
import { emptyLocalized } from "@/lib/gallery/fields";

export function MetadataEditor({
  config,
  artwork,
}: {
  config: GalleryConfig;
  artwork: Artwork;
}) {
  const langs = config.languages;

  const setLocalized = (key: "title" | "description" | "technique", next: Localized) =>
    updateArtwork(artwork.id, `Metadata · ${key} (${artwork.id})`, (a) => ({
      ...a,
      metadata: { ...a.metadata, [key]: next },
    }));

  const setPlain = (key: keyof Artwork["metadata"], value: string) =>
    updateArtwork(artwork.id, `Metadata · ${String(key)} (${artwork.id})`, (a) => ({
      ...a,
      metadata: { ...a.metadata, [key]: value },
    }));

  const altMissing = !langs.some((l) => (artwork.altText?.[l] ?? "").trim());

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Metadata</h3>
        <LocalizedField
          label="Titolo"
          value={artwork.metadata.title}
          languages={langs}
          onChange={(v) => setLocalized("title", v)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Artista" value={artwork.metadata.artist} onChange={(v) => setPlain("artist", v)} />
          <TextField label="Anno" value={artwork.metadata.year} onChange={(v) => setPlain("year", v)} />
        </div>
        <LocalizedField
          label="Descrizione"
          value={artwork.metadata.description}
          languages={langs}
          multiline
          hint="Testo curatoriale/editoriale. Non viene usato come alt text né come targhetta."
          onChange={(v) => setLocalized("description", v)}
        />
        <LocalizedField
          label="Tecnica"
          value={artwork.metadata.technique}
          languages={langs}
          onChange={(v) => setLocalized("technique", v)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Dimensioni"
            value={artwork.metadata.dimensions}
            onChange={(v) => setPlain("dimensions", v)}
          />
          <TextField
            label="Categoria"
            value={artwork.metadata.category}
            onChange={(v) => setPlain("category", v)}
          />
          <TextField
            label="Collezione"
            value={artwork.metadata.collection}
            onChange={(v) => setPlain("collection", v)}
          />
          <TextField
            label="Numero opera"
            value={artwork.metadata.inventoryNumber}
            onChange={(v) => setPlain("inventoryNumber", v)}
          />
          <TextField label="Credit" value={artwork.metadata.credit} onChange={(v) => setPlain("credit", v)} />
          <TextField
            label="Copyright"
            value={artwork.metadata.copyright}
            onChange={(v) => setPlain("copyright", v)}
          />
        </div>
        <TextField
          label="URL / Link esterno"
          value={artwork.metadata.url}
          placeholder="https://"
          onChange={(v) => setPlain("url", v)}
        />
      </section>

      {config.customFields.length > 0 && (
        <>
          <Separator />
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
              Campi personalizzati
            </h3>
            {config.customFields.map((field) =>
              field.localized ? (
                <LocalizedField
                  key={field.key}
                  label={field.label}
                  languages={langs}
                  value={artwork.metadata.custom?.[field.key] ?? emptyLocalized(langs)}
                  onChange={(v) =>
                    updateArtwork(artwork.id, `Metadata · ${field.label} (${artwork.id})`, (a) => ({
                      ...a,
                      metadata: { ...a.metadata, custom: { ...a.metadata.custom, [field.key]: v } },
                    }))
                  }
                />
              ) : (
                <TextField
                  key={field.key}
                  label={field.label}
                  value={artwork.metadata.custom?.[field.key]?.[config.defaultLanguage] ?? ""}
                  onChange={(v) =>
                    updateArtwork(artwork.id, `Metadata · ${field.label} (${artwork.id})`, (a) => ({
                      ...a,
                      metadata: {
                        ...a.metadata,
                        custom: {
                          ...a.metadata.custom,
                          [field.key]: emptyLocalized(langs, v),
                        },
                      },
                    }))
                  }
                />
              ),
            )}
          </section>
        </>
      )}

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Alt text</h3>
        {altMissing && (
          <p className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="size-3.5" /> Alt text mancante — l'opera è pubblicabile ma priva di
            descrizione accessibile.
          </p>
        )}
        <LocalizedField
          label="Alt text"
          languages={langs}
          value={artwork.altText}
          multiline
          hint="Descrive il contenuto visivo dell'immagine. Indipendente da titolo e descrizione."
          onChange={(v) =>
            updateArtwork(artwork.id, `Alt text (${artwork.id})`, (a) => ({ ...a, altText: v }))
          }
        />
      </section>
    </div>
  );
}
