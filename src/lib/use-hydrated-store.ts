/**
 * Hooks to lazily hydrate stores from backend API on first mount.
 */
import { useEffect } from "react";
import { usePatientStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";

export function useHydratedPatientStore() {
  const state = usePatientStore();
  const fetched = state.fetched;
  const loading = state.loading;
  const refresh = state.refresh;
  useEffect(() => {
    if (!fetched && !loading) {
      refresh();
    }
  }, [fetched, loading, refresh]);
  return { ...state, hydrated: fetched };
}

export function useHydratedAuth() {
  const state = useAuthStore();
  const hydrated = state.hydrated;
  const fetchMe = state.fetchMe;
  useEffect(() => {
    if (!hydrated) {
      fetchMe();
    }
  }, [hydrated, fetchMe]);
  return state;
}
