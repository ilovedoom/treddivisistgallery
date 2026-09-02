import { Maximize2 } from "lucide-react";
import { OverlayPanel } from "./OverlayPanel";
import { useOverlays } from "@/lib/ui/overlay";
import type { Artwork, GalleryConfig, LangCode } from "@/lib/gallery/types";
import { loc } from "@/lib/gallery/fields";
import { resolveBottomFields } from "@/lib/gallery/resolve";

/** Popup informativo dell'opera: sintesi curatoriale e accesso al viewer. */
export function ArtworkPopup({
  config,
  artwork,
  lang,
}: {
  config: GalleryConfig;
  artwork: Artwork;
  lang: LangCode;
}) {
  const { open, close } = useOverlays();
  const fallback = config.defaultLanguage;
  const title = loc(artwork.metadata.title, lang, fallback);
  const fields = resolveBottomFields(config, artwork);

  return (
    <OverlayPanel
      id="ARTWORK_INFO"
      title={title}
      description={`${artwork.metadata.artist} · ${artwork.metadata.year}`}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => close("ARTWORK_INFO")}
            className="focus-ring rounded-lg border border-border/60 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            Chiudi
          </button>
          <button
            type="button"
            onClick={() => open("ARTWORK_VIEWER", artwork.id)}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
            Osserva da vicino
          </button>
        </div>
      }
    >
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
        <div
          role="img"
          aria-label={loc(artwork.altText, lang, fallback) || title}
          className="aspect-[3/4] w-full rounded-md border border-border/50 shadow-floating"
          style={{
            backgroundColor: artwork.media.color,
            backgroundImage: artwork.media.url ? `url(${artwork.media.url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <dl className="min-w-0 space-y-3 text-sm">
          {fields.map((field) => (
            <div key={field.key} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </dt>
              <dd className="text-foreground">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </OverlayPanel>
  );
}
