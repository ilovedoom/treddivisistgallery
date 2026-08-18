import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InputManager, type InputSnapshot } from "@/lib/input/InputManager";

export function useInputManager() {
  const managerRef = useRef<InputManager | null>(null);
  if (!managerRef.current && typeof window !== "undefined") {
    managerRef.current = new InputManager();
  }
  const [snapshot, setSnapshot] = useState<InputSnapshot>({
    source: "keyboard",
    family: null,
    profile: null,
    gamepadCount: 0,
  });

  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;
    manager.start();
    const offSnapshot = manager.onSnapshot(setSnapshot);
    const offConnection = manager.onConnection((profile, connected) => {
      toast(connected ? profile.displayName : "Controller scollegato", {
        description: connected
          ? "Mapping applicato automaticamente."
          : "Puoi continuare con mouse, tastiera o touch.",
      });
    });
    return () => {
      offSnapshot();
      offConnection();
      manager.dispose();
    };
  }, []);

  return { manager: managerRef.current, snapshot };
}
