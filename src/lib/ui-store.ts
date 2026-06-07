/**
 * Zustand UI store for client-side rendering preferences. Owns the
 * "Mode Ringan" (lite mode) flag that lets low-power machines (for
 * example puskesmas hardware without a GPU) opt out of the heavier
 * canvas and motion effects. This is the renderer-side counterpart to
 * the Electron main process calling `app.disableHardwareAcceleration()`.
 *
 * The flag is hydrated from and persisted to localStorage under the key
 * "medwatch-lite-mode". All access to `window`/`localStorage` is guarded
 * so the store stays SSR-safe under the Next.js app router.
 *
 * Key exports: `useUiStore` and the `useReducedMotion` hook.
 */
import { create } from "zustand";
import { useSyncExternalStore } from "react";

/** localStorage key used to persist the lite-mode preference. */
const STORAGE_KEY = "medwatch-lite-mode";

/**
 * Read the persisted lite-mode flag. Returns false on the server or
 * whenever `window`/`localStorage` is unavailable so the initial render
 * matches between server and client.
 *
 * @returns The stored preference, or false when not in a browser.
 */
function readStoredLiteMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Persist the lite-mode flag. No-op on the server or when storage is
 * unavailable (for example private-mode restrictions).
 *
 * @param value - The preference to write.
 */
function writeStoredLiteMode(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    // Ignore storage failures; the in-memory flag still works.
  }
}

type UiStore = {
  /** When true, render the lightweight, low-power variant of the UI. */
  liteMode: boolean;
  /** Set lite mode explicitly and persist the choice. */
  setLiteMode: (value: boolean) => void;
  /** Flip lite mode and persist the new value. */
  toggleLiteMode: () => void;
};

/**
 * Global Zustand UI store. The initial `liteMode` value is read from
 * localStorage on the client and defaults to false on the server.
 * Because the server always starts from false, components that depend on
 * `liteMode` for their markup must guard against a hydration mismatch
 * (see `NavBar`).
 */
export const useUiStore = create<UiStore>((set, get) => ({
  liteMode: readStoredLiteMode(),

  setLiteMode: (value) => {
    writeStoredLiteMode(value);
    set({ liteMode: value });
  },

  toggleLiteMode: () => {
    const next = !get().liteMode;
    writeStoredLiteMode(next);
    set({ liteMode: next });
  },
}));

/**
 * Hydration-safe read of `liteMode`. Returns false during SSR and the
 * first client paint (matching the server-rendered markup), then the
 * real persisted value. Use this in any component whose markup branches
 * on lite mode to avoid a hydration mismatch.
 *
 * @returns The lite-mode flag, forced to false until after hydration.
 */
export function useLiteModeHydrated(): boolean {
  return useSyncExternalStore(
    useUiStore.subscribe,
    () => useUiStore.getState().liteMode,
    () => false,
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Subscribe to changes in the `prefers-reduced-motion` media query.
 *
 * @param onChange - Called whenever the query result flips.
 * @returns Cleanup that removes the listener.
 */
function subscribePrefersReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Current value of the media query on the client. */
function getPrefersReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Server snapshot: motion is never reduced during SSR. */
function getPrefersReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * Hook that reports whether motion should be reduced. Returns true when
 * lite mode is on, or when the OS-level `prefers-reduced-motion` media
 * query matches.
 *
 * SSR-safe: it returns false during the server render and the first
 * client render via `useSyncExternalStore`'s server snapshot, then
 * reflects the live media-query value and updates on change so the value
 * never differs between the server and the initial client paint.
 *
 * @returns True when entrance/looping animations should be suppressed.
 */
export function useReducedMotion(): boolean {
  const liteMode = useUiStore((s) => s.liteMode);
  const prefersReduced = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    getPrefersReducedMotionServerSnapshot,
  );
  return liteMode || prefersReduced;
}
