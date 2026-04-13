import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePatientStore } from "./store";

function subscribe(callback: () => void) {
  return usePatientStore.persist.onFinishHydration(callback);
}

function getSnapshot() {
  return usePatientStore.persist.hasHydrated();
}

function getServerSnapshot() {
  return false;
}

export function useHydratedPatientStore() {
  const hydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const rehydrated = useRef(false);

  useEffect(() => {
    if (!rehydrated.current) {
      rehydrated.current = true;
      if (!usePatientStore.persist.hasHydrated()) {
        usePatientStore.persist.rehydrate();
      }
    }
  }, []);

  const store = usePatientStore();
  return { ...store, hydrated };
}
