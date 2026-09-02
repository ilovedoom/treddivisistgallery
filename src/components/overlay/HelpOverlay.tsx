import { OverlayPanel } from "./OverlayPanel";
import { useOverlays } from "@/lib/ui/overlay";
import type { InputSnapshot } from "@/lib/input/InputManager";

const SECTIONS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Tastiera e mouse",
    rows: [
      ["W A S D / frecce", "Muoviti nella sala"],
      ["Mouse", "Ruota lo sguardo (clic per bloccare il puntatore)"],
      ["Shift", "Cammina più veloce"],
      ["E", "Apri la scheda dell'opera inquadrata"],
      ["I", "Mostra o nascondi l'interfaccia"],
      ["H", "Apri questa guida"],
      ["Esc", "Chiudi il pannello in primo piano"],
    ],
  },
  {
    title: "Touch",
    rows: [
      ["Analogico sinistro", "Movimento"],
      ["Analogico destro", "Camera"],
      ["Pulsante centrale", "Interagisci con l'opera"],
      ["Pizzica nel viewer", "Zoom sull'immagine"],
    ],
  },
  {
    title: "Controller",
    rows: [
      ["Levetta sinistra", "Movimento"],
      ["Levetta destra", "Camera"],
      ["Tasto azione (A / X / B)", "Interagisci"],
      ["Tasto annulla (B / O / A)", "Indietro"],
      ["Start / Options / +", "Menu"],
    ],
  },
];

/** Guida ai controlli, adattiva rispetto al dispositivo attivo. */
export function HelpOverlay({ snapshot }: { snapshot: InputSnapshot }) {
  const { close } = useOverlays();
  return (
    <OverlayPanel
      id="HELP"
      title="Come muoversi nella galleria"
      description={
        snapshot.profile
          ? `Dispositivo attivo: ${snapshot.profile.displayName}`
          : "I comandi si adattano automaticamente al dispositivo in uso."
      }
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => close("HELP")}
            className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            Ho capito
          </button>
        </div>
      }
    >
      <div className="grid gap-6 px-5 py-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <section key={section.title} className="min-w-0">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h3>
            <ul className="space-y-2 text-sm">
              {section.rows.map(([keys, desc]) => (
                <li key={keys} className="min-w-0">
                  <span className="inline-block rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                    {keys}
                  </span>
                  <span className="ml-2 text-muted-foreground">{desc}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </OverlayPanel>
  );
}
