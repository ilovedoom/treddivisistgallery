import { useCallback, useRef, useState } from "react";
import { Hand, Info, Maximize2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputManager } from "@/lib/input/InputManager";
import type { AbstractAction } from "@/lib/input/types";

const RADIUS = 52;
const KNOB = 34;

/** Analogico virtuale: ritorno a zero, dead zone e knob che segue il dito. */
function VirtualStick({
  label,
  side,
  onChange,
}: {
  label: string;
  side: "left" | "right";
  onChange: (x: number, y: number) => void;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const reset = useCallback(() => {
    origin.current = null;
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  }, [onChange]);

  return (
    <div
      role="application"
      aria-label={label}
      className={cn(
        "pointer-events-auto relative touch-none select-none rounded-full border border-border/60 bg-card/45 backdrop-blur-md transition-opacity",
        "active:bg-card/70",
      )}
      style={{ width: RADIUS * 2, height: RADIUS * 2 }}
      onPointerDown={(e) => {
        if (pointerId.current !== null) return;
        pointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }}
      onPointerMove={(e) => {
        const o = origin.current;
        if (!o || pointerId.current !== e.pointerId) return;
        let dx = (e.clientX - o.x) / RADIUS;
        let dy = (o.y - e.clientY) / RADIUS;
        const len = Math.hypot(dx, dy);
        if (len > 1) {
          dx /= len;
          dy /= len;
        }
        const dead = 0.12;
        const out = len < dead ? { x: 0, y: 0 } : { x: dx, y: dy };
        setKnob({ x: dx * (RADIUS - KNOB / 2), y: -dy * (RADIUS - KNOB / 2) });
        onChange(out.x, out.y);
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
    >
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {side === "left" ? "Muovi" : "Guarda"}
      </span>
      <span
        className="pointer-events-none absolute rounded-full border border-primary/50 bg-primary/70 shadow-floating transition-transform"
        style={{
          width: KNOB,
          height: KNOB,
          left: RADIUS - KNOB / 2,
          top: RADIUS - KNOB / 2,
          transform: `translate(${knob.x}px, ${knob.y}px)`,
        }}
      />
    </div>
  );
}

function TouchButton({
  label,
  icon,
  primary,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={cn(
        "focus-ring pointer-events-auto grid size-14 min-h-11 min-w-11 place-items-center rounded-full border text-foreground backdrop-blur-md transition-transform active:scale-95",
        primary
          ? "border-primary/50 bg-primary text-primary-foreground shadow-floating"
          : "border-border/60 bg-card/60",
      )}
    >
      {icon}
    </button>
  );
}

/**
 * Controlli touch a due analogici: stick sinistro per il movimento,
 * stick destro per la camera, azioni contestuali sul lato destro.
 * Rispetta le safe area e si disattiva quando un overlay è aperto.
 */
export function TouchControls({
  manager,
  visible = true,
  focusedArtwork,
  onAction,
}: {
  manager: InputManager | null;
  visible?: boolean;
  focusedArtwork?: boolean;
  onAction?: (action: AbstractAction) => void;
}) {
  const fire = useCallback(
    (action: AbstractAction) => {
      manager?.triggerTouchAction(action);
      onAction?.(action);
    },
    [manager, onAction],
  );

  if (!manager || !visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 md:hidden"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <VirtualStick
        label="Analogico movimento"
        side="left"
        onChange={(x, y) => manager.setTouchMove(x, y)}
      />

      <div className="flex flex-col items-end gap-3">
        <div className="flex gap-3">
          <TouchButton label="Menu" icon={<Menu className="size-5" />} onPress={() => fire("MENU")} />
          <TouchButton label="Info" icon={<Info className="size-5" />} onPress={() => fire("INFO")} />
        </div>
        <div className="flex items-end gap-3">
          <TouchButton
            label={focusedArtwork ? "Osserva l'opera" : "Interagisci"}
            icon={focusedArtwork ? <Maximize2 className="size-5" /> : <Hand className="size-5" />}
            primary
            onPress={() => fire("INTERACT")}
          />
          <VirtualStick
            label="Analogico camera"
            side="right"
            onChange={(x, y) => manager.setTouchLook(x, y)}
          />
        </div>
      </div>
    </div>
  );
}
