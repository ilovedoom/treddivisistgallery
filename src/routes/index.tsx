import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { CircleHelp, MessageSquareWarning, Settings2 } from "lucide-react";
import { useInputManager } from "@/hooks/useInputManager";
import { ControlsHint } from "@/components/ControlsHint";
import { TouchControls } from "@/components/TouchControls";
import { ArtworkInfoPanel, GalleryAccessibilityLayer } from "@/components/ArtworkInfoPanel";
import { OverlayRoot } from "@/components/overlay/OverlayRoot";
import { OverlayProvider, useOverlays } from "@/lib/ui/overlay";
import { usePublishedConfig } from "@/lib/gallery/store";
import { loc } from "@/lib/gallery/fields";

const Gallery3D = lazy(() => import("@/components/Gallery3D"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Galleria Aurora — Esposizione d'arte 3D nel browser" },
      {
        name: "description",
        content:
          "Visita una galleria d'arte 3D con targhette museali, schede curatoriali, zoom professionale sulle opere e controlli per mouse, touch e gamepad.",
      },
      { property: "og:title", content: "Galleria Aurora — Esposizione d'arte 3D nel browser" },
      {
        property: "og:description",
        content:
          "Opere con metadata curatoriali, targhette 3D configurabili, visualizzatore con zoom e informazioni accessibili in ogni lingua.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <ClientOnly fallback={<Loading />}>
        <Suspense fallback={<Loading />}>
          <OverlayProvider>
            <GalleryExperience />
          </OverlayProvider>
        </Suspense>
      </ClientOnly>
    </main>
  );
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Caricamento della galleria…
    </div>
  );
}

function GalleryExperience() {
  const { manager, snapshot } = useInputManager();
  const config = usePublishedConfig();
  const overlays = useOverlays();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hudVisible, setHudVisible] = useState(true);

  const lang = useMemo(() => {
    if (config.languageMode !== "auto") return config.languageMode;
    const nav = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "";
    return config.languages.includes(nav) ? nav : config.defaultLanguage;
  }, [config]);

  const focus = config.artworks.find((a) => a.id === focusId) ?? null;
  const exploring = overlays.mode === "EXPLORING";

  // Un solo punto di verità: quando un overlay è aperto la navigazione è sospesa.
  useEffect(() => {
    manager?.setEnabled(!overlays.inputBlocked);
    if (overlays.inputBlocked) document.exitPointerLock?.();
  }, [manager, overlays.inputBlocked]);

  useEffect(() => {
    if (!manager) return;
    const off = manager.onAction((action) => {
      if (action === "INFO") setHudVisible((v) => !v);
      if (action === "MENU") overlays.toggle("HELP");
      if (action === "CANCEL") {
        if (overlays.stack.length) overlays.close();
        else document.exitPointerLock?.();
      }
      if (action === "INTERACT" && focus && !overlays.inputBlocked) {
        overlays.open("ARTWORK_INFO", focus.id);
      }
    });
    return () => {
      off();
    };
  }, [manager, focus, overlays]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "h") overlays.toggle("HELP");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlays]);

  return (
    <>
      <Gallery3D manager={manager} config={config} lang={lang} onFocus={setFocusId} />
      <GalleryAccessibilityLayer config={config} lang={lang} />

      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between"
        style={{
          padding: "max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))",
        }}
      >
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="glass-panel min-w-0 px-4 py-3">
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
              {config.name}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {snapshot.profile
                ? snapshot.profile.displayName
                : "Muoviti con WASD, tocca lo schermo o collega un controller"}
            </p>
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <HudButton label="Guida ai comandi" onClick={() => overlays.toggle("HELP")}>
              <CircleHelp className="size-4" />
            </HudButton>
            <HudButton label="Segnala un problema" onClick={() => overlays.toggle("FEEDBACK")}>
              <MessageSquareWarning className="size-4" />
            </HudButton>
            <Link
              to="/admin"
              aria-label="Area di gestione"
              className="focus-ring grid size-11 place-items-center rounded-lg border border-border/60 bg-card/60 text-foreground backdrop-blur-md transition-colors hover:bg-accent"
            >
              <Settings2 className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {hudVisible && exploring && (
          <div className="hidden justify-end md:flex">
            <ControlsHint snapshot={snapshot} />
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          {focus && exploring ? (
            <button
              type="button"
              onClick={() => overlays.open("ARTWORK_INFO", focus.id)}
              className="pointer-events-auto max-w-full text-left"
            >
              <ArtworkInfoPanel config={config} artwork={focus} lang={lang} />
            </button>
          ) : (
            exploring && (
              <p className="glass-panel px-4 py-3 text-xs text-muted-foreground">
                Avvicinati a un'opera per vederne i dettagli
              </p>
            )
          )}
        </div>
      </div>

      <TouchControls
        manager={manager}
        visible={exploring}
        focusedArtwork={Boolean(focus)}
        onAction={(action) => {
          if (action === "INTERACT" && focus) overlays.open("ARTWORK_INFO", focus.id);
        }}
      />

      {exploring && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
            focus ? "size-3 bg-primary/80 ring-2 ring-primary/30" : "size-1.5 bg-foreground/60"
          }`}
        />
      )}

      <OverlayRoot config={config} lang={lang} snapshot={snapshot} focusId={focusId} />
    </>
  );
}

function HudButton({
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
      className="focus-ring grid size-11 place-items-center rounded-lg border border-border/60 bg-card/60 text-foreground backdrop-blur-md transition-colors hover:bg-accent"
    >
      {children}
    </button>
  );
}
