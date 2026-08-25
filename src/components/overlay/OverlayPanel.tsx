import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OVERLAY_Z, useFocusTrap, useOverlays, type OverlayId } from "@/lib/ui/overlay";

type Variant = "dialog" | "sheet" | "immersive";

/**
 * Guscio unico per ogni overlay: z-index dalla gerarchia centrale,
 * focus trap, ESC (gestito globalmente), click fuori e blocco della scena.
 */
export function OverlayPanel({
  id,
  title,
  description,
  variant = "dialog",
  className,
  hideHeader = false,
  children,
  footer,
}: {
  id: OverlayId;
  title: string;
  description?: string;
  variant?: Variant;
  className?: string;
  hideHeader?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { close, top } = useOverlays();
  const isTop = top === id;
  const ref = useFocusTrap(isTop);

  return (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center"
      style={{ zIndex: OVERLAY_Z[id] }}
      role="presentation"
    >
      <div
        className={cn(
          "absolute inset-0 bg-background/70 backdrop-blur-[2px] transition-opacity",
          variant === "immersive" && "bg-background/92",
        )}
        onClick={() => close(id)}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden glass-panel",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          variant === "dialog" && "max-w-lg sm:max-w-2xl",
          variant === "sheet" && "max-w-3xl",
          variant === "immersive" && "h-[100dvh] max-w-none rounded-none border-0 bg-background/95",
          className,
        )}
        style={{
          marginBottom: variant === "immersive" ? 0 : "max(0.75rem, env(safe-area-inset-bottom))",
          marginTop: variant === "immersive" ? 0 : "max(0.75rem, env(safe-area-inset-top))",
        }}
      >
        {!hideHeader && (
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/60 px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {description && (
                <p id={`${id}-desc`} className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => close(id)}
              aria-label="Chiudi"
              className="focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        {footer && <footer className="border-t border-border/60 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
