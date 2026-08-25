import {
  emptyHeld,
  type AbstractAction,
  type ControllerFamily,
  type InputSource,
  type InputState,
} from "./types";
import { profileFor, type ControllerProfile } from "./controllerProfiles";

const DEADZONE = 0.18;

function dz(v: number) {
  return Math.abs(v) < DEADZONE ? 0 : v;
}

export interface InputSnapshot {
  source: InputSource;
  family: ControllerFamily | null;
  profile: ControllerProfile | null;
  gamepadCount: number;
}

type SnapshotListener = (s: InputSnapshot) => void;
type ActionListener = (a: AbstractAction) => void;
type ConnectionListener = (p: ControllerProfile, connected: boolean) => void;

/**
 * Single entry point for every input device:
 * mouse + keyboard, touch, gamepads (Xbox / PlayStation / Nintendo / generic)
 * and WebXR controllers. Produces one abstract InputState per frame.
 */
export class InputManager {
  private keys = new Set<string>();
  private mouseLook = { x: 0, y: 0 };
  private touchMove = { x: 0, y: 0 };
  private touchLook = { x: 0, y: 0 };
  private prevButtons = new Map<number, boolean[]>();
  private activeGamepadIndex: number | null = null;
  private profile: ControllerProfile | null = null;
  private source: InputSource = "keyboard";
  private xrActive = false;
  private xrState = { move: { x: 0, y: 0 }, look: { x: 0, y: 0 } };
  private snapshotListeners = new Set<SnapshotListener>();
  private actionListeners = new Set<ActionListener>();
  private connectionListeners = new Set<ConnectionListener>();
  private disposers: Array<() => void> = [];
  /** Quando un overlay prende il focus i controlli di navigazione vengono sospesi. */
  private enabled = true;

  /** Attiva/disattiva movimento, camera e azioni: usato dall'OverlayManager. */
  setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.mouseLook = { x: 0, y: 0 };
      this.touchMove = { x: 0, y: 0 };
      this.touchLook = { x: 0, y: 0 };
    }
  }

  isEnabled() {
    return this.enabled;
  }


  start() {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      this.setSource("keyboard");
    };
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        this.mouseLook.x += e.movementX;
        this.mouseLook.y += e.movementY;
        this.setSource("keyboard");
      }
    };
    const onTouch = () => this.setSource("touch");
    const onConnect = (e: Event) => this.handleConnection(e as GamepadEvent, true);
    const onDisconnect = (e: Event) => this.handleConnection(e as GamepadEvent, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    this.disposers.push(() => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    });

    // Pick up controllers already connected before the page loaded.
    this.rescanGamepads();
  }

  dispose() {
    this.disposers.forEach((d) => d());
    this.disposers = [];
    this.snapshotListeners.clear();
    this.actionListeners.clear();
    this.connectionListeners.clear();
  }

  onSnapshot(l: SnapshotListener) {
    this.snapshotListeners.add(l);
    l(this.snapshot());
    return () => this.snapshotListeners.delete(l);
  }

  onAction(l: ActionListener) {
    this.actionListeners.add(l);
    return () => this.actionListeners.delete(l);
  }

  onConnection(l: ConnectionListener) {
    this.connectionListeners.add(l);
    return () => this.connectionListeners.delete(l);
  }

  /** WebXR controllers take priority while an immersive session is running. */
  setXrActive(active: boolean) {
    this.xrActive = active;
    if (active) this.setSource("xr");
    else this.setSource(this.activeGamepadIndex !== null ? "gamepad" : "keyboard");
  }

  setXrAxes(move: { x: number; y: number }, look: { x: number; y: number }) {
    this.xrState.move = move;
    this.xrState.look = look;
  }

  setTouchMove(x: number, y: number) {
    this.touchMove = { x, y };
    if (x || y) this.setSource("touch");
  }

  setTouchLook(x: number, y: number) {
    this.touchLook = { x, y };
    if (x || y) this.setSource("touch");
  }

  triggerTouchAction(action: AbstractAction) {
    this.setSource("touch");
    this.actionListeners.forEach((l) => l(action));
  }

  snapshot(): InputSnapshot {
    return {
      source: this.source,
      family: this.profile?.family ?? null,
      profile: this.profile,
      gamepadCount: this.listGamepads().length,
    };
  }

  /** Called once per animation frame by the PlayerController. */
  sample(): InputState {
    const held = emptyHeld();
    const move = { x: 0, y: 0 };
    const look = { x: 0, y: 0 };

    // Keyboard + mouse
    const k = this.keys;
    if (k.has("KeyW") || k.has("ArrowUp")) move.y += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) move.y -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) move.x += 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) move.x -= 1;
    if (k.has("KeyE")) held.INTERACT = true;
    if (k.has("Escape")) held.CANCEL = true;
    if (k.has("KeyI")) held.INFO = true;
    if (k.has("ShiftLeft")) held.ACTION_SECONDARY = true;
    look.x += this.mouseLook.x * 0.15;
    look.y += this.mouseLook.y * 0.15;
    this.mouseLook = { x: 0, y: 0 };

    // Touch virtual sticks
    move.x += this.touchMove.x;
    move.y += this.touchMove.y;
    look.x += this.touchLook.x;
    look.y += this.touchLook.y;
    this.touchLook = { x: 0, y: 0 };

    // Gamepad (mapped through the active controller profile)
    const pad = this.activePad();
    if (pad && !this.xrActive) {
      const axes = pad.axes;
      const mx = dz(axes[0] ?? 0);
      const my = dz(axes[1] ?? 0);
      const lx = dz(axes[2] ?? 0);
      const ly = dz(axes[3] ?? 0);
      if (mx || my || lx || ly) this.setSource("gamepad");
      move.x += mx;
      move.y -= my;
      look.x += lx * 12;
      look.y += ly * 12;

      const profile = this.profile ?? profileFor(pad.id);
      const prev = this.prevButtons.get(pad.index) ?? [];
      const now = pad.buttons.map((b) => b.pressed || b.value > 0.5);
      (Object.keys(profile.buttons) as AbstractAction[]).forEach((action) => {
        for (const idx of profile.buttons[action]) {
          if (now[idx]) held[action] = true;
          if (now[idx] && !prev[idx]) {
            this.setSource("gamepad");
            this.actionListeners.forEach((l) => l(action));
          }
        }
      });
      this.prevButtons.set(pad.index, now);
    }

    // WebXR wins while an immersive session is active.
    if (this.xrActive) {
      move.x = this.xrState.move.x;
      move.y = this.xrState.move.y;
      look.x = this.xrState.look.x;
      look.y = this.xrState.look.y;
    }

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    return {
      move: { x: clamp(move.x), y: clamp(move.y) },
      look,
      held,
      source: this.source,
      family: this.profile?.family ?? null,
    };
  }

  private listGamepads(): Gamepad[] {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return [];
    return Array.from(navigator.getGamepads()).filter((g): g is Gamepad => !!g);
  }

  private activePad(): Gamepad | null {
    const pads = this.listGamepads();
    if (!pads.length) {
      if (this.activeGamepadIndex !== null) {
        this.activeGamepadIndex = null;
        this.profile = null;
        this.setSource("keyboard");
      }
      return null;
    }
    const current = pads.find((p) => p.index === this.activeGamepadIndex);
    if (current) return current;
    // Controller replaced / hot-swapped: adopt the first available one.
    this.adopt(pads[0]!);
    return pads[0]!;
  }

  private rescanGamepads() {
    const pads = this.listGamepads();
    if (pads[0]) this.adopt(pads[0]);
  }

  private adopt(pad: Gamepad) {
    this.activeGamepadIndex = pad.index;
    this.profile = profileFor(pad.id);
    this.prevButtons.set(pad.index, []);
    if (!this.xrActive) this.setSource("gamepad");
    this.emitSnapshot();
  }

  private handleConnection(e: GamepadEvent, connected: boolean) {
    const pad = e.gamepad;
    const profile = profileFor(pad.id);
    if (connected) {
      // A second controller may join without stealing the active one.
      if (this.activeGamepadIndex === null) this.adopt(pad);
      this.connectionListeners.forEach((l) => l(profile, true));
      this.emitSnapshot();
      return;
    }
    this.prevButtons.delete(pad.index);
    if (this.activeGamepadIndex === pad.index) {
      this.activeGamepadIndex = null;
      this.profile = null;
      const remaining = this.listGamepads();
      if (remaining[0]) this.adopt(remaining[0]);
      else this.setSource(this.xrActive ? "xr" : "keyboard");
    }
    this.connectionListeners.forEach((l) => l(profile, false));
    this.emitSnapshot();
  }

  private setSource(source: InputSource) {
    if (this.xrActive && source !== "xr") return;
    if (this.source === source) return;
    this.source = source;
    this.emitSnapshot();
  }

  private emitSnapshot() {
    const s = this.snapshot();
    this.snapshotListeners.forEach((l) => l(s));
  }
}
