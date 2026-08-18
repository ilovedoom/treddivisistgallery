import { useRef } from "react";
import type { InputManager } from "@/lib/input/InputManager";

/** Virtual stick + action buttons feeding the same abstract actions. */
export function TouchControls({ manager }: { manager: InputManager | null }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);

  if (!manager) return null;

  const handleStart = (e: React.TouchEvent) => {
    const t = e.touches[0]!;
    originRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleMove = (e: React.TouchEvent) => {
    const o = originRef.current;
    const t = e.touches[0]!;
    if (!o) return;
    const dx = Math.max(-1, Math.min(1, (t.clientX - o.x) / 50));
    const dy = Math.max(-1, Math.min(1, (o.y - t.clientY) / 50));
    manager.setTouchMove(dx, dy);
  };
  const handleEnd = () => {
    originRef.current = null;
    manager.setTouchMove(0, 0);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-6 md:hidden">
      <div
        ref={stickRef}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="pointer-events-auto size-28 rounded-full border border-border/70 bg-card/60 backdrop-blur-md"
      />
      <div className="pointer-events-auto flex gap-3">
        <button
          onClick={() => manager.triggerTouchAction("INFO")}
          className="size-14 rounded-full border border-border/70 bg-card/70 text-xs font-semibold text-foreground backdrop-blur-md"
        >
          Info
        </button>
        <button
          onClick={() => manager.triggerTouchAction("INTERACT")}
          className="size-14 rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          Interagisci
        </button>
      </div>
    </div>
  );
}
