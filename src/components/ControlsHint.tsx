import type { InputSnapshot } from "@/lib/input/InputManager";

const KEYBOARD_ROWS: Array<[string, string]> = [
  ["WASD", "Muovi"],
  ["Mouse", "Guarda"],
  ["E", "Interagisci"],
  ["Esc", "Indietro"],
  ["I", "Info / HUD"],
];

const TOUCH_ROWS: Array<[string, string]> = [
  ["Stick sx", "Muovi"],
  ["Trascina", "Guarda"],
  ["Tocca", "Interagisci"],
];

const XR_ROWS: Array<[string, string]> = [
  ["Thumbstick sx", "Muovi"],
  ["Thumbstick dx", "Guarda"],
  ["Trigger", "Interagisci"],
];

export function ControlsHint({ snapshot }: { snapshot: InputSnapshot }) {
  let title = "Mouse + Tastiera";
  let rows = KEYBOARD_ROWS;

  if (snapshot.source === "xr") {
    title = "Controller VR";
    rows = XR_ROWS;
  } else if (snapshot.source === "touch") {
    title = "Touch";
    rows = TOUCH_ROWS;
  } else if (snapshot.source === "gamepad" && snapshot.profile) {
    const l = snapshot.profile.labels;
    title = snapshot.profile.displayName.replace(" collegato", "");
    rows = [
      [l.moveStick, "Muovi"],
      [l.lookStick, "Guarda"],
      [l.interact, "Interagisci"],
      [l.cancel, "Indietro"],
      [l.info, "Info opera"],
      [l.menu, "Menu"],
    ];
  }

  return (
    <div className="pointer-events-none rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <dl className="mt-3 space-y-1.5">
        {rows.map(([key, label]) => (
          <div key={key + label} className="flex items-center gap-3 text-sm">
            <dt className="min-w-20 rounded-md border border-border bg-muted px-2 py-0.5 text-center font-mono text-xs text-foreground">
              {key}
            </dt>
            <dd className="text-muted-foreground">{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
