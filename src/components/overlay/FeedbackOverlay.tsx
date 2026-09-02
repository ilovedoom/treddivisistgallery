import { useState } from "react";
import { toast } from "sonner";
import { OverlayPanel } from "./OverlayPanel";
import { useOverlays } from "@/lib/ui/overlay";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { value: "BUG", label: "Problema tecnico" },
  { value: "CONTENT", label: "Errore nei contenuti" },
  { value: "IDEA", label: "Suggerimento" },
  { value: "OTHER", label: "Altro" },
];

const APP_VERSION = "1.0.0";

function technicalContext() {
  if (typeof window === "undefined") return {};
  const ua = navigator.userAgent;
  const browser = /Firefox/.test(ua)
    ? "Firefox"
    : /Edg/.test(ua)
      ? "Edge"
      : /Chrome/.test(ua)
        ? "Chrome"
        : /Safari/.test(ua)
          ? "Safari"
          : "Sconosciuto";
  return {
    page: window.location.pathname,
    device: /Mobi|Android|iPhone|iPad/.test(ua) ? "Mobile" : "Desktop",
    browser,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    app_version: APP_VERSION,
  };
}

/** Segnalazione utente: messaggio, categoria e contesto tecnico automatico. */
export function FeedbackOverlay({
  galleryName,
  artworkId,
}: {
  galleryName: string;
  artworkId?: string | null;
}) {
  const { close } = useOverlays();
  const [category, setCategory] = useState("BUG");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      toast.error("Scrivi almeno qualche parola per aiutarci a capire.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      category,
      message: trimmed.slice(0, 4000),
      gallery_name: galleryName,
      artwork_id: artworkId ?? null,
      ...technicalContext(),
    });
    setSending(false);
    if (error) {
      toast.error("Invio non riuscito", { description: "Riprova tra qualche istante." });
      return;
    }
    toast.success("Grazie, segnalazione inviata");
    setMessage("");
    close("FEEDBACK");
  };

  return (
    <OverlayPanel
      id="FEEDBACK"
      title="Segnala un problema"
      description="Alleghiamo automaticamente dispositivo, browser e pagina corrente."
    >
      <form onSubmit={submit} className="space-y-4 px-5 py-4">
        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Categoria
          </legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={category === c.value}
                onClick={() => setCategory(c.value)}
                className={`focus-ring rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  category === c.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 text-foreground hover:bg-accent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="feedback-message"
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Descrizione
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={4000}
            required
            placeholder="Racconta cosa è successo o cosa miglioreresti…"
            className="focus-ring w-full resize-y rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => close("FEEDBACK")}
            className="focus-ring rounded-lg border border-border/60 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={sending}
            className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {sending ? "Invio…" : "Invia segnalazione"}
          </button>
        </div>
      </form>
    </OverlayPanel>
  );
}
