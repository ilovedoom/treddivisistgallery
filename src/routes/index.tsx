import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useInputManager } from "@/hooks/useInputManager";
import { ControlsHint } from "@/components/ControlsHint";
import { TouchControls } from "@/components/TouchControls";
import { ArtworkInfoPanel, GalleryAccessibilityLayer } from "@/components/ArtworkInfoPanel";
import { usePublishedConfig } from "@/lib/gallery/store";
import { loc } from "@/lib/gallery/fields";

const Gallery3D = lazy(() => import("@/components/Gallery3D"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Galleria Aurora — Esposizione 3D con targhette museali" },
      {
        name: "description",
        content:
          "Galleria d'arte 3D nel browser con targhette espositive, metadata multilingua, alt text accessibile e controlli gamepad universali.",
      },
      { property: "og:title", content: "Galleria Aurora — Esposizione 3D con targhette museali" },
      {
        property: "og:description",
        content:
          "Opere con metadata curatoriali, targhette 3D configurabili e informazioni accessibili in ogni lingua.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <ClientOnly fallback={<Loading />}>
        <Suspense fallback={<Loading />}>
          <GalleryExperience />
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
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hudVisible, setHudVisible] = useState(true);

  const lang = useMemo(() => {
    if (config.languageMode !== "auto") return config.languageMode;
    const nav = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "";
    return config.languages.includes(nav) ? nav : config.defaultLanguage;
  }, [config]);

  const focus = config.artworks.find((a) => a.id === focusId) ?? null;

  useEffect(() => {
    if (!manager) return;
    const off = manager.onAction((action) => {
      if (action === "INFO") setHudVisible((v) => !v);
      if (action === "MENU") toast("Menu della galleria");
      if (action === "CANCEL") document.exitPointerLock?.();
      if (action === "INTERACT" && focus) {
        toast(loc(focus.metadata.title, lang, config.defaultLanguage), {
          description: `${focus.metadata.artist} · ${focus.metadata.year}`,
        });
      }
    });
    return () => {
      off();
    };
  }, [manager, focus, lang, config.defaultLanguage]);

  return (
    <>
      <Gallery3D manager={manager} config={config} lang={lang} onFocus={setFocusId} />
      <GalleryAccessibilityLayer config={config} lang={lang} />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 backdrop-blur-md">
            <h1 className="text-lg font-semibold text-foreground">{config.name}</h1>
            <p className="text-xs text-muted-foreground">
              {snapshot.gamepadCount > 1
                ? `${snapshot.gamepadCount} controller collegati`
                : "Collega un controller: il mapping è automatico"}
            </p>
            <Link
              to="/admin"
              className="pointer-events-auto mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Apri il CMS
            </Link>
          </div>
          {hudVisible && <ControlsHint snapshot={snapshot} />}
        </header>

        <div className="flex items-end justify-between gap-4">
          {focus ? (
            <ArtworkInfoPanel config={config} artwork={focus} lang={lang} />
          ) : (
            <div className="min-h-16 rounded-xl border border-border/60 bg-card/80 px-4 py-3 backdrop-blur-md">
              <p className="text-xs text-muted-foreground">
                Avvicinati a un'opera per vederne i dettagli
              </p>
            </div>
          )}
        </div>
      </div>

      <TouchControls manager={manager} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70" />
    </>
  );
}
