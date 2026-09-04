import { ArtworkPopup } from "./ArtworkPopup";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { HelpOverlay } from "./HelpOverlay";
import { ImageViewer } from "./ImageViewer";
import { useOverlays } from "@/lib/ui/overlay";
import type { GalleryConfig, LangCode } from "@/lib/gallery/types";
import type { InputSnapshot } from "@/lib/input/InputManager";

/** Punto unico di rendering degli overlay: nessun popup vive fuori da qui. */
export function OverlayRoot({
  config,
  lang,
  snapshot,
  focusId,
}: {
  config: GalleryConfig;
  lang: LangCode;
  snapshot: InputSnapshot;
  focusId: string | null;
}) {
  const { isOpen, payloadOf } = useOverlays();

  const infoId = payloadOf<string>("ARTWORK_INFO") ?? focusId;
  const viewerId = payloadOf<string>("ARTWORK_VIEWER") ?? infoId;
  const infoArtwork = config.artworks.find((a) => a.id === infoId) ?? null;
  const viewerArtwork = config.artworks.find((a) => a.id === viewerId) ?? null;

  return (
    <>
      {isOpen("ARTWORK_INFO") && infoArtwork && (
        <ArtworkPopup config={config} artwork={infoArtwork} lang={lang} />
      )}
      {isOpen("ARTWORK_VIEWER") && viewerArtwork && (
        <ImageViewer config={config} artwork={viewerArtwork} lang={lang} />
      )}
      {isOpen("HELP") && <HelpOverlay snapshot={snapshot} />}
      {isOpen("FEEDBACK") && (
        <FeedbackOverlay galleryName={config.name} artworkId={focusId} />
      )}
    </>
  );
}
