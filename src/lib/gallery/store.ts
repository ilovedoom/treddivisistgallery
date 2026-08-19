import { useSyncExternalStore } from "react";
import type { Artwork, GalleryConfig, GalleryState, GalleryVersion } from "./types";
import { DEFAULT_STATE } from "./defaults";

const STORAGE_KEY = "aurora-gallery-cms-v1";

let state: GalleryState = DEFAULT_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage non disponibile: la sessione resta in memoria */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GalleryState;
      if (parsed?.config?.artworks) state = parsed;
    }
  } catch {
    /* dati corrotti: si riparte dai default */
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): GalleryState {
  hydrate();
  return state;
}

function getServerSnapshot(): GalleryState {
  return DEFAULT_STATE;
}

export function useGalleryState(): GalleryState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Stato pubblicato: usa lo snapshot immutabile della versione pubblicata, se esiste. */
export function usePublishedConfig(): GalleryConfig {
  const s = useGalleryState();
  const published = s.versions.find((v) => v.id === s.publishedVersionId);
  return published?.snapshot ?? s.config;
}

const pendingChanges: string[] = [];

export function updateConfig(change: string, updater: (config: GalleryConfig) => GalleryConfig) {
  hydrate();
  state = { ...state, config: updater(state.config) };
  if (change && !pendingChanges.includes(change)) pendingChanges.push(change);
  persist();
  emit();
}

export function updateArtwork(id: string, change: string, updater: (a: Artwork) => Artwork) {
  updateConfig(change, (config) => ({
    ...config,
    artworks: config.artworks.map((a) => (a.id === id ? updater(a) : a)),
  }));
}

export function getPendingChanges(): string[] {
  return [...pendingChanges];
}

export function createVersion(label: string, publish: boolean): GalleryVersion {
  hydrate();
  const version: GalleryVersion = {
    id: `v-${Date.now()}`,
    createdAt: new Date().toISOString(),
    label: label || `Versione ${state.versions.length + 1}`,
    published: publish,
    changes: pendingChanges.length ? [...pendingChanges] : ["Nessuna modifica registrata"],
    snapshot: JSON.parse(JSON.stringify(state.config)) as GalleryConfig,
  };
  state = {
    ...state,
    versions: [version, ...state.versions],
    publishedVersionId: publish ? version.id : state.publishedVersionId,
  };
  pendingChanges.length = 0;
  persist();
  emit();
  return version;
}

export function publishVersion(id: string) {
  hydrate();
  state = {
    ...state,
    publishedVersionId: id,
    versions: state.versions.map((v) => ({ ...v, published: v.id === id })),
  };
  persist();
  emit();
}

export function resetGallery() {
  state = JSON.parse(JSON.stringify(DEFAULT_STATE)) as GalleryState;
  pendingChanges.length = 0;
  persist();
  emit();
}
