/**
 * React hook that reflects the current `prefers-reduced-motion`
 * media-query value. Marked `"use client"` because it subscribes to
 * the live `window.matchMedia` change event. Falls back to false on the
 * server so any motion components hydrate without flashing.
 *
 * Key export: `useReducedMotion`.
 */
"use client";

import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
};

const getSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getServerSnapshot = () => false;

/**
 * Returns true when the user has requested reduced motion. Stable
 * across renders thanks to `useSyncExternalStore`.
 *
 * @returns Whether the OS-level reduced-motion flag is set.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
