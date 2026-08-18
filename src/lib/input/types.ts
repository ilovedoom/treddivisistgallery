/**
 * Abstract input layer.
 *
 * GamepadInput -> ControllerMapper -> AbstractActions -> PlayerController
 * The rest of the app never needs to know which device produced an action.
 */

export type AbstractAction =
  | "INTERACT"
  | "CANCEL"
  | "MENU"
  | "INFO"
  | "ACTION_PRIMARY"
  | "ACTION_SECONDARY";

export const ABSTRACT_ACTIONS: AbstractAction[] = [
  "INTERACT",
  "CANCEL",
  "MENU",
  "INFO",
  "ACTION_PRIMARY",
  "ACTION_SECONDARY",
];

export type ControllerFamily = "xbox" | "playstation" | "nintendo" | "generic";

export type InputSource =
  | "keyboard"
  | "touch"
  | "gamepad"
  | "xr";

export interface Vector2 {
  x: number;
  y: number;
}

/** Continuous state sampled every frame by the PlayerController. */
export interface InputState {
  /** MOVE: -1..1 on both axes (x = strafe, y = forward). */
  move: Vector2;
  /** LOOK: -1..1 on both axes (x = yaw, y = pitch). */
  look: Vector2;
  /** Held state for each abstract action. */
  held: Record<AbstractAction, boolean>;
  /** Active input source, used to pick the correct on-screen hints. */
  source: InputSource;
  family: ControllerFamily | null;
}

export function emptyHeld(): Record<AbstractAction, boolean> {
  return {
    INTERACT: false,
    CANCEL: false,
    MENU: false,
    INFO: false,
    ACTION_PRIMARY: false,
    ACTION_SECONDARY: false,
  };
}
