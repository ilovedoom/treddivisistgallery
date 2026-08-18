import type { AbstractAction, ControllerFamily } from "./types";

/**
 * Standard Gamepad API button indices (mapping === "standard"):
 * 0 south, 1 east, 2 west, 3 north, 4 L1, 5 R1, 6 L2, 7 R2,
 * 8 select/back/view/-, 9 start/menu/options/+, 10/11 sticks, 12-15 dpad.
 */
export const BTN = {
  SOUTH: 0,
  EAST: 1,
  WEST: 2,
  NORTH: 3,
  L1: 4,
  R1: 5,
  L2: 6,
  R2: 7,
  SELECT: 8,
  START: 9,
} as const;

export interface ControllerProfile {
  family: ControllerFamily;
  /** Human readable name shown in the connection toast. */
  displayName: string;
  /** Abstract action -> list of button indices that trigger it. */
  buttons: Record<AbstractAction, number[]>;
  /** Glyphs shown in the adaptive HUD. */
  labels: {
    moveStick: string;
    lookStick: string;
    interact: string;
    cancel: string;
    info: string;
    menu: string;
  };
}

const commonTriggers = {
  ACTION_PRIMARY: [BTN.L2, BTN.R2],
  ACTION_SECONDARY: [BTN.L1, BTN.R1],
};

export const PROFILES: Record<ControllerFamily, ControllerProfile> = {
  xbox: {
    family: "xbox",
    displayName: "Controller Xbox collegato",
    buttons: {
      INTERACT: [BTN.SOUTH], // A
      CANCEL: [BTN.EAST], // B
      INFO: [BTN.WEST, BTN.NORTH, BTN.SELECT], // X / Y / View
      MENU: [BTN.START], // Menu
      ...commonTriggers,
    },
    labels: {
      moveStick: "L Stick",
      lookStick: "R Stick",
      interact: "A",
      cancel: "B",
      info: "X",
      menu: "Menu",
    },
  },
  playstation: {
    family: "playstation",
    displayName: "Controller PlayStation collegato",
    buttons: {
      INTERACT: [BTN.SOUTH], // Cross
      CANCEL: [BTN.EAST], // Circle
      INFO: [BTN.WEST, BTN.NORTH, BTN.SELECT], // Square / Triangle / Create
      MENU: [BTN.START], // Options
      ...commonTriggers,
    },
    labels: {
      moveStick: "L Stick",
      lookStick: "R Stick",
      interact: "✕",
      cancel: "○",
      info: "□",
      menu: "Options",
    },
  },
  nintendo: {
    family: "nintendo",
    displayName: "Controller Nintendo collegato",
    // Nintendo's physical layout is mirrored: the east button is A and the
    // south button is B, so we must not reuse the Xbox positional assumption.
    buttons: {
      INTERACT: [BTN.EAST], // A
      CANCEL: [BTN.SOUTH], // B
      INFO: [BTN.NORTH, BTN.WEST, BTN.SELECT], // X / Y / -
      MENU: [BTN.START], // +
      ...commonTriggers,
    },
    labels: {
      moveStick: "L Stick",
      lookStick: "R Stick",
      interact: "A",
      cancel: "B",
      info: "X",
      menu: "+",
    },
  },
  generic: {
    family: "generic",
    displayName: "Controller collegato",
    buttons: {
      INTERACT: [BTN.SOUTH],
      CANCEL: [BTN.EAST],
      INFO: [BTN.WEST, BTN.NORTH, BTN.SELECT],
      MENU: [BTN.START],
      ...commonTriggers,
    },
    labels: {
      moveStick: "L Stick",
      lookStick: "R Stick",
      interact: "Btn 1",
      cancel: "Btn 2",
      info: "Btn 3",
      menu: "Start",
    },
  },
};

/** Best-effort family detection from the browser-provided id string. */
export function detectFamily(id: string): ControllerFamily {
  const s = id.toLowerCase();
  if (/xbox|xinput|microsoft|x-box/.test(s)) return "xbox";
  if (/dualsense|dualshock|playstation|sony|054c|wireless controller/.test(s))
    return "playstation";
  if (/nintendo|switch|joy-?con|pro controller|057e/.test(s)) return "nintendo";
  return "generic";
}

export function profileFor(id: string): ControllerProfile {
  return PROFILES[detectFamily(id)];
}
