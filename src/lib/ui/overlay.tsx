import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * OverlayManager centralizzato + APP_STATE.
 * Un solo sistema per popup, viewer, help, feedback e messaggi di sistema:
 * gerarchia z-index, mutua esclusione, ESC/back e blocco degli input di gioco.
 */
export type OverlayId =
  | "ARTWORK_INFO"
  | "ARTWORK_VIEWER"
  | "HELP"
  | "FEEDBACK"
  | "SETTINGS"
  | "SYSTEM";

export type AppMode =
  | "EXPLORING"
  | "INTERACTING"
  | "ARTWORK_VIEWER"
  | "HELP"
  | "FEEDBACK"
  | "MENU"
  | "PAUSED"
  | "VR";

/** Gerarchia esplicita: scena → hud → hint → info → viewer → help/feedback → sistema. */
export const OVERLAY_Z: Record<OverlayId, number> = {
  ARTWORK_INFO: 40,
  ARTWORK_VIEWER: 50,
  HELP: 60,
  FEEDBACK: 60,
  SETTINGS: 60,
  SYSTEM: 80,
};

/** Overlay che non possono convivere: aprirne uno chiude gli altri del gruppo. */
const EXCLUSIVE_GROUPS: OverlayId[][] = [["HELP", "FEEDBACK", "SETTINGS"]];

/** Overlay che non bloccano la navigazione sottostante. */
const NON_BLOCKING: OverlayId[] = [];

const MODE_BY_OVERLAY: Record<OverlayId, AppMode> = {
  ARTWORK_INFO: "INTERACTING",
  ARTWORK_VIEWER: "ARTWORK_VIEWER",
  HELP: "HELP",
  FEEDBACK: "FEEDBACK",
  SETTINGS: "MENU",
  SYSTEM: "PAUSED",
};

interface OverlayEntry {
  id: OverlayId;
  payload?: unknown;
}

interface OverlayContextValue {
  stack: OverlayEntry[];
  top: OverlayId | null;
  mode: AppMode;
  /** true quando movimento, camera e interazione con la scena devono essere sospesi. */
  inputBlocked: boolean;
  xr: boolean;
  setXr: (active: boolean) => void;
  open: (id: OverlayId, payload?: unknown) => void;
  close: (id?: OverlayId) => void;
  closeAll: () => void;
  toggle: (id: OverlayId, payload?: unknown) => void;
  isOpen: (id: OverlayId) => boolean;
  payloadOf: <T>(id: OverlayId) => T | undefined;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<OverlayEntry[]>([]);
  const [xr, setXr] = useState(false);

  const open = useCallback((id: OverlayId, payload?: unknown) => {
    setStack((prev) => {
      const blocked = EXCLUSIVE_GROUPS.filter((g) => g.includes(id)).flat();
      const next = prev.filter((e) => e.id !== id && !blocked.includes(e.id));
      return [...next, { id, payload }];
    });
  }, []);

  const close = useCallback((id?: OverlayId) => {
    setStack((prev) => (id ? prev.filter((e) => e.id !== id) : prev.slice(0, -1)));
  }, []);

  const closeAll = useCallback(() => setStack([]), []);

  const toggle = useCallback(
    (id: OverlayId, payload?: unknown) =>
      setStack((prev) => {
        if (prev.some((e) => e.id === id)) return prev.filter((e) => e.id !== id);
        const blocked = EXCLUSIVE_GROUPS.filter((g) => g.includes(id)).flat();
        return [...prev.filter((e) => !blocked.includes(e.id)), { id, payload }];
      }),
    [],
  );

  // ESC / back globale: chiude sempre solo l'overlay più in alto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setStack((prev) => (prev.length ? prev.slice(0, -1) : prev));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<OverlayContextValue>(() => {
    const sorted = [...stack].sort((a, b) => OVERLAY_Z[a.id] - OVERLAY_Z[b.id]);
    const top = sorted.length ? sorted[sorted.length - 1]!.id : null;
    const inputBlocked = stack.some((e) => !NON_BLOCKING.includes(e.id));
    const mode: AppMode = xr ? "VR" : top ? MODE_BY_OVERLAY[top] : "EXPLORING";
    return {
      stack,
      top,
      mode,
      inputBlocked,
      xr,
      setXr,
      open,
      close,
      closeAll,
      toggle,
      isOpen: (id) => stack.some((e) => e.id === id),
      payloadOf: <T,>(id: OverlayId) => stack.find((e) => e.id === id)?.payload as T | undefined,
    };
  }, [stack, xr, open, close, closeAll, toggle]);

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlays(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlays deve essere usato dentro OverlayProvider");
  return ctx;
}

/** Focus trap accessibile per i pannelli dell'OverlayManager. */
export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    (focusables()[0] ?? node).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return ref;
}
