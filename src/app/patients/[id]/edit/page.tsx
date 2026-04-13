"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import { drugs } from "@/data/drugs";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { ArrowLeft, Save, Loader2, X, Check, Search, User } from "lucide-react";
import { toast } from "sonner";

const inputClasses =
  "w-full px-4 py-2.5 rounded-xl text-sm bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200";

const labelClasses = "text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block";

const errorClasses = "text-xs text-red-500 mt-1";

interface FormErrors {
  name?: string;
  age?: string;
  gender?: string;
  address?: string;
  complaint?: string;
  diagnosis?: string;
  prescribedDrugs?: string;
}

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const { patients, updatePatient, hydrated } = useHydratedPatientStore();

  const id = params.id as string;
  const patient = patients.find((p) => p.id === id);

  const [formData, setFormData] = useState(() =>
    patient
      ? {
          name: patient.name,
          age: String(patient.age),
          gender: patient.gender,
          address: patient.address,
          phone: patient.phone ?? "",
          visitDate: patient.visitDate,
          complaint: patient.complaint,
          vitalSigns: patient.vitalSigns ?? "",
          diagnosis: patient.diagnosis,
          prescribedDrugs: [...patient.prescribedDrugs],
        }
      : {
          name: "",
          age: "",
          gender: "",
          address: "",
          phone: "",
          visitDate: new Date().toISOString().slice(0, 10),
          complaint: "",
          vitalSigns: "",
          diagnosis: "",
          prescribedDrugs: [] as string[],
        }
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drugSearch, setDrugSearch] = useState("");

  const filteredDrugs = useMemo(() => {
    if (!drugSearch.trim()) return drugs;
    const q = drugSearch.toLowerCase();
    return drugs.filter(
      (d) => d.name.toLowerCase().includes(q) || d.genericName.toLowerCase().includes(q)
    );
  }, [drugSearch]);

  if (!hydrated) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="h-4 w-48 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-8 w-64 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-96 rounded-2xl bg-white/50 dark:bg-white/[0.05] animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  if (!patient) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Data Pasien
          </Link>
          <GlassCard className="flex flex-col items-center justify-center py-16">
            <User className="w-16 h-16 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mt-4">
              Pasien tidak ditemukan
            </p>
            <Link
              href="/patients"
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Kembali ke Daftar Pasien
            </Link>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case "name":
        return !value || value.trim().length < 2 ? "Nama harus minimal 2 karakter" : undefined;
      case "age": {
        const n = parseInt(value, 10);
        return !value || isNaN(n) || n < 0 || n > 120 ? "Usia harus antara 0-120" : undefined;
      }
      case "gender":
        return !value ? "Pilih jenis kelamin" : undefined;
      case "address":
        return !value || !value.trim() ? "Alamat wajib diisi" : undefined;
      case "complaint":
        return !value || value.trim().length < 5 ? "Keluhan minimal 5 karakter" : undefined;
      case "diagnosis":
        return !value || value.trim().length < 3 ? "Diagnosa minimal 3 karakter" : undefined;
      case "prescribedDrugs":
        return "";
      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const val = formData[field as keyof typeof formData];
    const error = validateField(field, typeof val === "string" ? val : "");
    setErrors((p) => ({ ...p, [field]: error }));
  };

  const handleChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (touched[field]) {
      const error = validateField(field as keyof FormErrors, typeof value === "string" ? value : "");
      setErrors((p) => ({ ...p, [field]: error }));
    }
  };

  const toggleDrug = (drugName: string) => {
    setFormData((p) => ({
      ...p,
      prescribedDrugs: p.prescribedDrugs.includes(drugName)
        ? p.prescribedDrugs.filter((d) => d !== drugName)
        : [...p.prescribedDrugs, drugName],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fields: (keyof FormErrors)[] = ["name", "age", "gender", "address", "complaint", "diagnosis"];
    const newErrors: FormErrors = {};
    const newTouched: Record<string, boolean> = {};
    let hasValidationErrors = false;

    for (const field of fields) {
      newTouched[field] = true;
      const val = formData[field as keyof typeof formData];
      const error = validateField(field, typeof val === "string" ? val : "");
      if (error) {
        newErrors[field] = error;
        hasValidationErrors = true;
      }
    }

    if (formData.prescribedDrugs.length === 0) {
      newErrors.prescribedDrugs = "Pilih minimal 1 obat";
      hasValidationErrors = true;
    }

    setTouched((p) => ({ ...p, ...newTouched }));
    setErrors(newErrors);
    if (hasValidationErrors) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));

    updatePatient(patient.id, {
      name: formData.name.trim(),
      age: parseInt(formData.age, 10),
      gender: formData.gender as "Perempuan" | "Laki-laki",
      address: formData.address.trim(),
      phone: formData.phone.trim() || undefined,
      visitDate: formData.visitDate,
      complaint: formData.complaint.trim(),
      vitalSigns: formData.vitalSigns.trim() || undefined,
      diagnosis: formData.diagnosis.trim(),
      prescribedDrugs: formData.prescribedDrugs,
    });

    toast.success("Data pasien diperbarui");
    router.push("/patients");
  };

  const hasErrors = Object.values(errors).some((e) => !!e);

  return (
    <PageTransition>
      <div className="space-y-6">
        <Link
          href={`/patients/${patient.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail Pasien
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50"
        >
          Edit Data Pasien
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-sm text-slate-500 dark:text-slate-400"
        >
          Perbarui informasi pasien {patient.name}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <GlassCard>
            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Section 1: Identitas */}
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                    Identitas Pasien
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className={labelClasses}>Nama Lengkap <span className="text-red-400">*</span></label>
                      <input id="name" type="text" className={`${inputClasses} ${errors.name && touched.name ? "border-red-400/50" : ""}`}
                        value={formData.name} onChange={(e) => handleChange("name", e.target.value)} onBlur={() => handleBlur("name")} />
                      {errors.name && touched.name && <p className={errorClasses}>{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="age" className={labelClasses}>Umur <span className="text-red-400">*</span></label>
                      <input id="age" type="number" min={0} max={120} className={`${inputClasses} ${errors.age && touched.age ? "border-red-400/50" : ""}`}
                        value={formData.age} onChange={(e) => handleChange("age", e.target.value)} onBlur={() => handleBlur("age")} />
                      {errors.age && touched.age && <p className={errorClasses}>{errors.age}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Gender <span className="text-red-400">*</span></label>
                      <div className="flex gap-3">
                        {(["Perempuan", "Laki-laki"] as const).map((g) => (
                          <button key={g} type="button" onClick={() => handleChange("gender", g)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                              formData.gender === g
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                : "bg-white/50 dark:bg-white/[0.05] border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-white/[0.08]"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {errors.gender && touched.gender && <p className={errorClasses}>{errors.gender}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address" className={labelClasses}>Alamat <span className="text-red-400">*</span></label>
                      <textarea id="address" rows={2} className={`${inputClasses} resize-none ${errors.address && touched.address ? "border-red-400/50" : ""}`}
                        value={formData.address} onChange={(e) => handleChange("address", e.target.value)} onBlur={() => handleBlur("address")} />
                      {errors.address && touched.address && <p className={errorClasses}>{errors.address}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className={labelClasses}>No. HP</label>
                      <input id="phone" type="text" placeholder="08xxxxxxxxxx" className={inputClasses}
                        value={formData.phone} onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Kunjungan */}
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    Kunjungan
                  </h2>
                  <div>
                    <label htmlFor="visitDate" className={labelClasses}>Tanggal Kunjungan</label>
                    <input id="visitDate" type="date" className={inputClasses}
                      value={formData.visitDate} onChange={(e) => handleChange("visitDate", e.target.value)} />
                  </div>
                </div>

                {/* Section 3: SOAP */}
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                    Data Klinis (SOAP)
                  </h2>

                  <div>
                    <label htmlFor="complaint" className={labelClasses}>Keluhan / Subjective <span className="text-red-400">*</span></label>
                    <textarea id="complaint" rows={2} placeholder="Keluhan utama pasien" className={`${inputClasses} resize-none ${errors.complaint && touched.complaint ? "border-red-400/50" : ""}`}
                      value={formData.complaint} onChange={(e) => handleChange("complaint", e.target.value)} onBlur={() => handleBlur("complaint")} />
                    {errors.complaint && touched.complaint && <p className={errorClasses}>{errors.complaint}</p>}
                  </div>

                  <div>
                    <label htmlFor="vitalSigns" className={labelClasses}>Tanda Vital / Objective</label>
                    <textarea id="vitalSigns" rows={2} placeholder="TD: 120/80, Nadi: 80x/m, Suhu: 36.5°C" className={`${inputClasses} resize-none`}
                      value={formData.vitalSigns} onChange={(e) => handleChange("vitalSigns", e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="diagnosis" className={labelClasses}>Diagnosa / Assessment <span className="text-red-400">*</span></label>
                    <input id="diagnosis" type="text" placeholder="Diagnosa pasien" className={`${inputClasses} ${errors.diagnosis && touched.diagnosis ? "border-red-400/50" : ""}`}
                      value={formData.diagnosis} onChange={(e) => handleChange("diagnosis", e.target.value)} onBlur={() => handleBlur("diagnosis")} />
                    {errors.diagnosis && touched.diagnosis && <p className={errorClasses}>{errors.diagnosis}</p>}
                  </div>

                  {/* Drug picker */}
                  <div>
                    <label className={labelClasses}>Resep Obat / Planning <span className="text-red-400">*</span></label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Pilih minimal 1 obat</p>

                    {/* Selected drugs */}
                    {formData.prescribedDrugs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <AnimatePresence>
                          {formData.prescribedDrugs.map((name) => (
                            <motion.span key={name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            >
                              {name}
                              <button type="button" onClick={() => toggleDrug(name)} className="hover:text-blue-800 dark:hover:text-blue-200">
                                <X className="w-3 h-3" />
                              </button>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Drug search */}
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Cari obat..." className={`${inputClasses} pl-9`}
                        value={drugSearch} onChange={(e) => setDrugSearch(e.target.value)} />
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/30 dark:bg-white/[0.02] p-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredDrugs.map((drug) => {
                          const isSelected = formData.prescribedDrugs.includes(drug.name);
                          return (
                            <button key={drug.id} type="button" onClick={() => toggleDrug(drug.name)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left ${
                                isSelected
                                  ? "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium"
                                  : "bg-white/30 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all ${
                                isSelected ? "bg-blue-500 text-white" : "border border-slate-300 dark:border-slate-600"
                              }`}>
                                {isSelected && <Check className="w-3 h-3" />}
                              </span>
                              <span className="truncate">{drug.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {errors.prescribedDrugs && <p className={errorClasses}>{errors.prescribedDrugs}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-6 flex justify-end gap-3">
                  <Link href={`/patients/${patient.id}`}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/[0.05] border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.08] transition-all"
                  >
                    Batal
                  </Link>
                  <button type="submit" disabled={isSubmitting || hasErrors}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all ${
                      isSubmitting || hasErrors ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Perbarui
                  </button>
                </div>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </PageTransition>
  );
}
