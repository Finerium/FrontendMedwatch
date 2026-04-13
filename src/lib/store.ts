import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { patients as seedPatients } from "@/data/patients";

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "Perempuan" | "Laki-laki";
  address: string;
  phone?: string;
  complaint: string;
  vitalSigns?: string;
  diagnosis: string;
  prescribedDrugs: string[];
  visitDate: string;
  createdAt: string;
  updatedAt: string;
};

type PatientStore = {
  patients: Patient[];
  addPatient: (data: Omit<Patient, "id" | "createdAt" | "updatedAt">) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  resetToSeed: () => void;
};

export const usePatientStore = create<PatientStore>()(
  persist(
    (set, get) => ({
      patients: seedPatients,

      addPatient: (data) => {
        const id = `PAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const newPatient: Patient = { ...data, id, createdAt: now, updatedAt: now };
        set((state) => ({ patients: [newPatient, ...state.patients] }));
        return newPatient;
      },

      updatePatient: (id, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePatient: (id) => {
        set((state) => ({ patients: state.patients.filter((p) => p.id !== id) }));
      },

      getPatientById: (id) => get().patients.find((p) => p.id === id),

      resetToSeed: () => set({ patients: seedPatients }),
    }),
    {
      name: "medwatch-patients-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
