import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GalleryConfig } from "@/lib/gallery/types";
import { updateArtwork } from "@/lib/gallery/store";
import { resolveFlag } from "@/lib/gallery/resolve";

export function BulkMetadataEditor({ config }: { config: GalleryConfig }) {
  const lang = config.defaultLanguage;

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Opera</TableHead>
            <TableHead className="min-w-40">Titolo ({lang})</TableHead>
            <TableHead className="min-w-32">Artista</TableHead>
            <TableHead className="w-20">Anno</TableHead>
            <TableHead className="min-w-56">Alt text ({lang})</TableHead>
            <TableHead className="min-w-32">Tecnica</TableHead>
            <TableHead className="min-w-28">Categoria</TableHead>
            <TableHead className="w-24">Targhetta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {config.artworks.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-mono text-[11px] text-muted-foreground">{a.id}</TableCell>
              <TableCell>
                <Input
                  value={a.metadata.title?.[lang] ?? ""}
                  onChange={(e) =>
                    updateArtwork(a.id, `Metadata · titolo (${a.id})`, (art) => ({
                      ...art,
                      metadata: { ...art.metadata, title: { ...art.metadata.title, [lang]: e.target.value } },
                    }))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={a.metadata.artist}
                  onChange={(e) =>
                    updateArtwork(a.id, `Metadata · artista (${a.id})`, (art) => ({
                      ...art,
                      metadata: { ...art.metadata, artist: e.target.value },
                    }))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={a.metadata.year}
                  onChange={(e) =>
                    updateArtwork(a.id, `Metadata · anno (${a.id})`, (art) => ({
                      ...art,
                      metadata: { ...art.metadata, year: e.target.value },
                    }))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Alt text mancante"
                  className={(a.altText?.[lang] ?? "").trim() ? "" : "border-amber-500/60"}
                  value={a.altText?.[lang] ?? ""}
                  onChange={(e) =>
                    updateArtwork(a.id, `Alt text (${a.id})`, (art) => ({
                      ...art,
                      altText: { ...art.altText, [lang]: e.target.value },
                    }))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={a.metadata.technique?.[lang] ?? ""}
                  onChange={(e) =>
                    updateArtwork(a.id, `Metadata · tecnica (${a.id})`, (art) => ({
                      ...art,
                      metadata: {
                        ...art.metadata,
                        technique: { ...art.metadata.technique, [lang]: e.target.value },
                      },
                    }))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={a.metadata.category}
                  onChange={(e) =>
                    updateArtwork(a.id, `Metadata · categoria (${a.id})`, (art) => ({
                      ...art,
                      metadata: { ...art.metadata, category: e.target.value },
                    }))
                  }
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={resolveFlag(config, a, "showPlaque")}
                  onCheckedChange={(v) =>
                    updateArtwork(a.id, `Visibilità targhetta (${a.id})`, (art) => ({
                      ...art,
                      display: { ...art.display, showPlaque: v },
                    }))
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
