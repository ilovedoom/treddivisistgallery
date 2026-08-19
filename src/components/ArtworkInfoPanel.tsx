import type { Artwork, GalleryConfig, LangCode } from "@/lib/gallery/types";
import { fieldLabel, fieldValue, loc } from "@/lib/gallery/fields";
import { resolveBottomFields, resolveFlag } from "@/lib/gallery/resolve";

/** UI inferiore: informazioni complete, complementare alla targhetta 3D. */
export function ArtworkInfoPanel({
  config,
  artwork,
  lang,
  compact = false,
}: {
  config: GalleryConfig;
  artwork: Artwork;
  lang: LangCode;
  compact?: boolean;
}) {
  const fallback = config.defaultLanguage;
  if (!resolveFlag(config, artwork, "showBottomInfo")) return null;

  const showTitle = resolveFlag(config, artwork, "showTitle");
  const showArtist = resolveFlag(config, artwork, "showArtist");
  const fields = resolveBottomFields(config, artwork).filter((f) => f !== "title" && f !== "artist");
  const title = loc(artwork.metadata.title, lang, fallback);
  const year = artwork.metadata.year;

  const inline = fields.filter((f) => f !== "description");
  const description = fields.includes("description")
    ? loc(artwork.metadata.description, lang, fallback)
    : "";

  return (
    <section
      aria-label={`Informazioni su ${title}`}
      className="pointer-events-auto w-full max-w-2xl rounded-xl border border-border/60 bg-card/85 px-5 py-4 backdrop-blur-md"
    >
      {showTitle && (
        <h2 className="text-base font-semibold uppercase tracking-wide text-foreground">{title}</h2>
      )}
      {(showArtist || year) && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          {[showArtist ? artwork.metadata.artist : "", fields.includes("year") || true ? year : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {inline.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {inline.map((key) => {
            const value = fieldValue(artwork, key, lang, fallback);
            if (!value || key === "year") return null;
            return (
              <div key={key} className="flex gap-1.5">
                <dt className="font-medium text-foreground/80">{fieldLabel(config, key)}:</dt>
                <dd>{value}</dd>
              </div>
            );
          })}
        </dl>
      )}
      {description && !compact && (
        <p className="mt-3 max-w-prose text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
    </section>
  );
}

/** Livello di accessibilità per il canvas WebGL: espone le opere con il loro alt text. */
export function GalleryAccessibilityLayer({
  config,
  lang,
}: {
  config: GalleryConfig;
  lang: LangCode;
}) {
  const fallback = config.defaultLanguage;
  return (
    <ul className="sr-only">
      {config.artworks.map((a) => (
        <li key={a.id}>
          <figure>
            <img
              src={
                a.media.url ??
                `data:image/svg+xml;utf8,${encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${a.media.color}"/></svg>`,
                )}`
              }
              alt={loc(a.altText, lang, fallback) || `Opera senza descrizione accessibile: ${loc(a.metadata.title, lang, fallback)}`}
              width={a.media.width}
              height={a.media.height}
            />
            <figcaption>
              {loc(a.metadata.title, lang, fallback)} — {a.metadata.artist}, {a.metadata.year}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
