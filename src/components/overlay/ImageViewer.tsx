import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { OverlayPanel } from "./OverlayPanel";
import { useOverlays } from "@/lib/ui/overlay";
import type { Artwork, GalleryConfig, LangCode } from "@/lib/gallery/types";
import { loc } from "@/lib/gallery/fields";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

interface View {
  zoom: number;
  x: number;
  y: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Visualizzatore professionale: zoom con rotellina/pinch ancorato al puntatore,
 * pan con trascinamento, doppio tap per zoom rapido, reset e limiti di scala.
 */
export function ImageViewer({
  config,
  artwork,
  lang,
}: {
  config: GalleryConfig;
  artwork: Artwork;
  lang: LangCode;
}) {
  const { close } = useOverlays();
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const lastTap = useRef(0);

  const title = loc(artwork.metadata.title, lang, config.defaultLanguage);
  const alt =
    loc(artwork.altText, lang, config.defaultLanguage) ||
    `${title}, ${artwork.metadata.artist}, ${artwork.metadata.year}`;

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    setView((prev) => {
      const next = clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const k = next / prev.zoom;
      const nx = px - (px - prev.x) * k;
      const ny = py - (py - prev.y) * k;
      return next === MIN_ZOOM ? { zoom: 1, x: 0, y: 0 } : { zoom: next, x: nx, y: ny };
    });
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  // Listener nativo non passive: React registra onWheel come passive.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      zoomAtRef.current(
        Math.exp(-dy * 0.0018),
        e.clientX - rect.left - rect.width / 2,
        e.clientY - rect.top - rect.height / 2,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const centerZoom = (factor: number) => zoomAt(factor, 0, 0);
  const reset = () => setView({ zoom: 1, x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: viewRef.current.zoom };
    }
    const now = Date.now();
    if (now - lastTap.current < 280 && pointers.current.size === 1) {
      viewRef.current.zoom > 1.05 ? reset() : centerZoom(2.5);
    }
    lastTap.current = now;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prevPoint = pointers.current.get(e.pointerId);
    if (!prevPoint) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const target = clamp((dist / pinch.current.dist) * pinch.current.zoom, MIN_ZOOM, MAX_ZOOM);
      setView((prev) => ({ ...prev, zoom: target }));
      return;
    }
    if (viewRef.current.zoom <= 1) return;
    setView((prev) => ({
      ...prev,
      x: prev.x + (e.clientX - prevPoint.x),
      y: prev.y + (e.clientY - prevPoint.y),
    }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") centerZoom(1.3);
      if (e.key === "-") centerZoom(1 / 1.3);
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <OverlayPanel
      id="ARTWORK_VIEWER"
      title={title}
      description={`${artwork.metadata.artist} · ${artwork.metadata.year} · ${artwork.metadata.dimensions}`}
      variant="immersive"
    >
      <div className="flex h-full flex-col">
        <div
          ref={containerRef}
          className="relative flex-1 touch-none overflow-hidden bg-muted/30"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: view.zoom > 1 ? "grab" : "zoom-in" }}
        >
          <div
            className="absolute inset-0 grid place-items-center transition-transform duration-75"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          >
            {artwork.media.url ? (
              <img
                src={artwork.media.url}
                alt={alt}
                draggable={false}
                className="max-h-[70dvh] max-w-[90vw] object-contain shadow-floating"
              />
            ) : (
              <div
                role="img"
                aria-label={alt}
                className="aspect-[3/2] w-[min(90vw,52rem)] max-h-[70dvh] rounded-sm shadow-floating"
                style={{ backgroundColor: artwork.media.color }}
              />
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {Math.round(view.zoom * 100)}% · trascina per spostare, pizzica o rotella per zoomare
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <ViewerButton label="Riduci" onClick={() => centerZoom(1 / 1.3)}>
              <Minus className="size-4" />
            </ViewerButton>
            <ViewerButton label="Reimposta zoom" onClick={reset}>
              <RotateCcw className="size-4" />
            </ViewerButton>
            <ViewerButton label="Ingrandisci" onClick={() => centerZoom(1.3)}>
              <Plus className="size-4" />
            </ViewerButton>
            <button
              type="button"
              onClick={() => close("ARTWORK_VIEWER")}
              className="focus-ring ml-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
            >
              Torna alla galleria
            </button>
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}

function ViewerButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="focus-ring grid size-11 place-items-center rounded-lg border border-border/60 text-foreground transition-colors hover:bg-accent"
    >
      {children}
    </button>
  );
}
