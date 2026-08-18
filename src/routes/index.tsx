import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { useInputManager } from "@/hooks/useInputManager";
import { ControlsHint } from "@/components/ControlsHint";
import { TouchControls } from "@/components/TouchControls";

const Gallery3D = lazy(() => import("@/components/Gallery3D"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Galleria 3D — Controlli gamepad universali" },
      {
        name: "description",
        content:
          "Galleria d'arte 3D nel browser con supporto automatico per controller Xbox, PlayStation, Nintendo, touch, mouse/tastiera e WebXR.",
      },
      { property: "og:title", content: "Galleria 3D — Controlli gamepad universali" },
      {
        property: "og:description",
        content:
          "Collega un controller e il sistema riconosce automaticamente il mapping corretto: Xbox, PlayStation, Nintendo o gamepad generico.",
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
  const [focus, setFocus] = useState<{ title: string; author: string } | null>(null);
  const [hudVisible, setHudVisible] = useState(true);

  useEffect(() => {
    if (!manager) return;
    const off = manager.onAction((action) => {
      if (action === "INFO") setHudVisible((v) => !v);
      if (action === "MENU") toast("Menu della galleria");
      if (action === "CANCEL") document.exitPointerLock?.();
      if (action === "INTERACT" && focus) {
        toast(focus.title, { description: `Opera di ${focus.author}` });
      }
    });
  }, [manager, focus]);

  return (
    <>
      <Gallery3D manager={manager} onFocus={setFocus} />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 backdrop-blur-md">
            <h1 className="text-lg font-semibold text-foreground">Galleria Aurora</h1>
            <p className="text-xs text-muted-foreground">
              {snapshot.gamepadCount > 1
                ? `${snapshot.gamepadCount} controller collegati`
                : "Collega un controller: il mapping è automatico"}
            </p>
          </div>
          {hudVisible && <ControlsHint snapshot={snapshot} />}
        </header>

        <div className="flex items-end justify-between gap-4">
          <div className="min-h-16 rounded-xl border border-border/60 bg-card/80 px-4 py-3 backdrop-blur-md">
            {focus ? (
              <>
                <p className="text-sm font-semibold text-foreground">{focus.title}</p>
                <p className="text-xs text-muted-foreground">{focus.author}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Avvicinati a un'opera per vederne i dettagli
              </p>
            )}
          </div>
        </div>
      </div>

      <TouchControls manager={manager} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70" />
    </>
  );
}
