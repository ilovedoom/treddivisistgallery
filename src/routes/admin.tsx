import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetadataEditor } from "@/components/cms/MetadataEditor";
import { PlaqueEditor } from "@/components/cms/PlaqueEditor";
import { BulkMetadataEditor } from "@/components/cms/BulkMetadataEditor";
import { AccessibilityPanel } from "@/components/cms/AccessibilityPanel";
import { GallerySettingsPanel } from "@/components/cms/GallerySettingsPanel";
import { ArtworkInfoPanel } from "@/components/ArtworkInfoPanel";
import {
  createVersion,
  getPendingChanges,
  publishVersion,
  resetGallery,
  useGalleryState,
} from "@/lib/gallery/store";
import { loc } from "@/lib/gallery/fields";

const Gallery3D = lazy(() => import("@/components/Gallery3D"));

const DEVICES = {
  desktop: { label: "Desktop", width: 960, height: 540 },
  "mobile-portrait": { label: "Mobile Portrait", width: 320, height: 640 },
  "mobile-landscape": { label: "Mobile Landscape", width: 640, height: 320 },
  vr: { label: "VR", width: 800, height: 450 },
} as const;

type DeviceKey = keyof typeof DEVICES;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "CMS Galleria — Metadata, alt text e targhette" },
      {
        name: "description",
        content:
          "Pannello di amministrazione della galleria 3D: metadata multilingua, alt text accessibile, targhette espositive e versioning delle pubblicazioni.",
      },
      { property: "og:title", content: "CMS Galleria — Metadata, alt text e targhette" },
      {
        property: "og:description",
        content:
          "Gestisci metadata, accessibilità, targhette 3D e anteprime multi-dispositivo della galleria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <main className="min-h-screen bg-background">
      <ClientOnly fallback={<div className="p-8 text-sm text-muted-foreground">Caricamento CMS…</div>}>
        <Admin />
      </ClientOnly>
    </main>
  );
}

function Admin() {
  const state = useGalleryState();
  const config = state.config;
  const [selectedId, setSelectedId] = useState(config.artworks[0]?.id ?? "");
  const artwork = config.artworks.find((a) => a.id === selectedId) ?? config.artworks[0];
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [distance, setDistance] = useState(2.6);
  const [previewLang, setPreviewLang] = useState(config.defaultLanguage);
  const [versionLabel, setVersionLabel] = useState("");

  const pending = getPendingChanges();

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">CMS · {config.name}</h1>
          <p className="text-sm text-muted-foreground">
            Metadata, alt text, targhette 3D e informazioni inferiori — un solo record per opera.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← Torna alla galleria
        </Link>
      </header>

      <Tabs defaultValue="artworks">
        <TabsList>
          <TabsTrigger value="artworks">Opere</TabsTrigger>
          <TabsTrigger value="bulk">Bulk editor</TabsTrigger>
          <TabsTrigger value="a11y">Accessibilità</TabsTrigger>
          <TabsTrigger value="settings">Galleria</TabsTrigger>
          <TabsTrigger value="versions">Versioni</TabsTrigger>
        </TabsList>

        <TabsContent value="artworks" className="mt-6">
          {artwork ? (
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,420px)]">
              <ScrollArea className="h-[70vh] rounded-lg border border-border/60">
                <div className="p-2">
                  {config.artworks.map((a) => {
                    const missingAlt = !config.languages.some((l) => (a.altText?.[l] ?? "").trim());
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedId(a.id)}
                        className={`flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left text-sm transition ${
                          a.id === artwork.id
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span className="font-medium">
                          {loc(a.metadata.title, config.defaultLanguage, config.defaultLanguage) || a.id}
                        </span>
                        <span className="text-xs">{a.metadata.artist}</span>
                        {missingAlt && (
                          <Badge variant="destructive" className="text-[10px]">
                            Alt text mancante
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <ScrollArea className="h-[70vh] rounded-lg border border-border/60">
                <div className="space-y-8 p-5">
                  <MetadataEditor config={config} artwork={artwork} />
                  <Separator />
                  <PlaqueEditor config={config} artwork={artwork} />
                </div>
              </ScrollArea>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {(Object.keys(DEVICES) as DeviceKey[]).map((k) => (
                    <Button
                      key={k}
                      size="sm"
                      variant={device === k ? "default" : "outline"}
                      onClick={() => setDevice(k)}
                    >
                      {DEVICES[k].label}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {config.languages.map((l) => (
                    <Button
                      key={l}
                      size="sm"
                      variant={previewLang === l ? "secondary" : "ghost"}
                      onClick={() => setPreviewLang(l)}
                    >
                      {l.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Viewing distance · {distance.toFixed(1)} m
                  </Label>
                  <Slider
                    min={1}
                    max={6}
                    step={0.1}
                    value={[distance]}
                    onValueChange={([v]) => setDistance(v ?? distance)}
                  />
                </div>

                <div className="mx-auto overflow-hidden rounded-xl border border-border/60 bg-black">
                  <div
                    className="relative"
                    style={{
                      width: "100%",
                      aspectRatio: `${DEVICES[device].width} / ${DEVICES[device].height}`,
                    }}
                  >
                    <Suspense fallback={null}>
                      <Gallery3D
                        key={`${artwork.id}-${device}`}
                        manager={null}
                        config={config}
                        lang={previewLang}
                        focusArtworkId={artwork.id}
                        viewingDistance={distance}
                      />
                    </Suspense>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                      <ArtworkInfoPanel config={config} artwork={artwork} lang={previewLang} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  La targhetta 3D resta visibile insieme alla UI inferiore: le due modalità sono
                  complementari.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna opera nella galleria.</p>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <BulkMetadataEditor config={config} />
        </TabsContent>

        <TabsContent value="a11y" className="mt-6">
          <AccessibilityPanel config={config} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <GallerySettingsPanel config={config} />
        </TabsContent>

        <TabsContent value="versions" className="mt-6 space-y-6">
          <section className="space-y-3 rounded-lg border border-border/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
              Modifiche non pubblicate
            </h3>
            {pending.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {pending.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna modifica in sospeso.</p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Input
                className="max-w-64"
                placeholder="Etichetta versione"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
              <Button
                onClick={() => {
                  const v = createVersion(versionLabel, true);
                  setVersionLabel("");
                  toast.success(`Pubblicata ${v.label}`);
                }}
              >
                Crea e pubblica
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const v = createVersion(versionLabel, false);
                  setVersionLabel("");
                  toast.success(`Salvata ${v.label}`);
                }}
              >
                Salva bozza
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetGallery();
                  toast("Galleria ripristinata ai dati di default");
                }}
              >
                Ripristina default
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            {state.versions.map((v) => (
              <div key={v.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {v.label}{" "}
                      {v.id === state.publishedVersionId && <Badge className="ml-2">Pubblicata</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleString("it-IT")}
                    </p>
                  </div>
                  {v.id !== state.publishedVersionId && (
                    <Button size="sm" variant="outline" onClick={() => publishVersion(v.id)}>
                      Pubblica questa versione
                    </Button>
                  )}
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {v.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
            {!state.versions.length && (
              <p className="text-sm text-muted-foreground">Nessuna versione salvata.</p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
