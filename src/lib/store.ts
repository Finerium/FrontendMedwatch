/**
 * Patient store backed by backend API. Replaces the previous localStorage Zustand store.
 * The Patient type now mirrors backend SOAP schema (api/storage canonical shape).
 */
import { create } from "zustand";
import { api } from "@/lib/api";
import type { Patient, PatientSummary } from "@/lib/patient-format";

export type { Patient, PatientSummary } from "@/lib/patient-format";

type PatientStore = {
  patients: PatientSummary[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  refresh: () => Promise<void>;
  add: (data: Omit<Patient, "id">) => Promise<Patient>;
  update: (id: string, updates: Partial<Patient>) => Promise<Patient>;
  remove: (id: string) => Promise<void>;
  fetchOne: (id: string) => Promise<Patient | null>;
};

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: [],
  loading: false,
  error: null,
  fetched: false,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const list = await api.get<PatientSummary[]>("/api/patients");
      set({ patients: list, loading: false, fetched: true });
    } catch (e) {
      set({ loading: false, error: String(e), fetched: true });
    }
  },

  add: async (data) => {
    const created = await api.post<Patient>("/api/patients", data);
    await get().refresh();
    return created;
  },

  update: async (id, updates) => {
    const updated = await api.put<Patient>(`/api/patients/${id}`, updates);
    await get().refresh();
    return updated;
  },

  remove: async (id) => {
    await api.delete<void>(`/api/patients/${id}`);
    await get().refresh();
  },

  fetchOne: async (id) => {
    try {
      return await api.get<Patient>(`/api/patients/${id}`);
    } catch {
      return null;
    }
  },
}));
