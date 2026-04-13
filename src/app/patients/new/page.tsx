"use client";

import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { drugs } from "@/data/drugs";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { ArrowLeft, Save, Loader2, X, Check, Search } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  name: string;
  age: string;
  gender: string;
  address: string;
  phone: string;
  visitDate: string;
  complaint: string;
  vitalSigns: string;
  diagnosis: string;
  prescribedDrugs: string[];
}

interface FormErrors {
  name?: string;
  age?: string;
  gender?: string;
  address?: string;
  complaint?: string;
  diagnosis?: string;
  prescribedDrugs?: string;
}

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const inputClasses =
  "w-full px-4 py-2.5 rounded-xl text-sm bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200";

const labelClasses =
  "text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block";

const errorClasses = "text-xs text-red-500 mt-1";

const errorInputClasses =
  "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50";

const sectionTitleClasses =
  "text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function FormSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-4 w-48 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse mb-4" />
        <div className="h-8 w-64 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse" />
        <div className="h-4 w-80 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse mt-2" />
      </div>
      <div className="max-w-3xl mx-auto space-y-6">
        {[1, 2, 3].map((section) => (
          <div
            key={section}
            className="bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6"
          >
            <div className="h-5 w-32 rounded bg-white/50 dark:bg-white/[0.05] animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: section === 3 ? 4 : 3 }).map((_, i) => (
                <div
                  key={i}
                  className={i === 0 ? "md:col-span-2" : "md:col-span-1"}
                >
                  <div className="h-4 w-24 rounded bg-white/50 dark:bg-white/[0.05] animate-pulse mb-1.5" />
                  <div className="h-10 w-full rounded-xl bg-white/50 dark:bg-white/[0.05] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form component
// ---------------------------------------------------------------------------

function PatientFormContent() {
  const router = useRouter();
  const { addPatient, hydrated } = useHydratedPatientStore();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    gender: "",
    address: "",
    phone: "",
    visitDate: todayISO(),
    complaint: "",
    vitalSigns: "",
    diagnosis: "",
    prescribedDrugs: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drugSearch, setDrugSearch] = useState("");

  // -- Validation -----------------------------------------------------------

  const validateField = (
    field: keyof FormErrors,
    value: string | string[]
  ): string | undefined => {
    switch (field) {
      case "name": {
        const v = (value as string).trim();
        if (!v || v.length < 2) return "Nama harus minimal 2 karakter";
        return undefined;
      }
      case "age": {
        const num = parseInt(value as string, 10);
        if (!value || isNaN(num) || num < 0 || num > 120)
          return "Usia harus antara 0-120 tahun";
        return undefined;
      }
      case "gender":
        if (!value) return "Pilih jenis kelamin";
        return undefined;
      case "address": {
        const v = (value as string).trim();
        if (!v) return "Alamat wajib diisi";
        return undefined;
      }
      case "complaint": {
        const v = (value as string).trim();
        if (!v || v.length < 5) return "Keluhan harus minimal 5 karakter";
        return undefined;
      }
      case "diagnosis": {
        const v = (value as string).trim();
        if (!v || v.length < 3) return "Diagnosa harus minimal 3 karakter";
        return undefined;
      }
      case "prescribedDrugs":
        if (!value || (value as string[]).length === 0)
          return "Pilih minimal 1 obat";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field as keyof FormData];
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field as keyof FormErrors, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const toggleDrug = (drugName: string) => {
    const next = formData.prescribedDrugs.includes(drugName)
      ? formData.prescribedDrugs.filter((n) => n !== drugName)
      : [...formData.prescribedDrugs, drugName];
    handleChange("prescribedDrugs", next);
  };

  // -- Filtered drugs for search --------------------------------------------

  const filteredDrugs = useMemo(() => {
    if (!drugSearch.trim()) return drugs;
    const q = drugSearch.toLowerCase();
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q)
    );
  }, [drugSearch]);

  // -- Submit ---------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldsToValidate: (keyof FormErrors)[] = [
      "name",
      "age",
      "gender",
      "address",
      "complaint",
      "diagnosis",
      "prescribedDrugs",
    ];

    const newErrors: FormErrors = {};
    const newTouched: Record<string, boolean> = {};
    let hasValidationErrors = false;

    for (const field of fieldsToValidate) {
      newTouched[field] = true;
      const value = formData[field as keyof FormData];
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        hasValidationErrors = true;
      }
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setErrors(newErrors);

    if (hasValidationErrors) return;

    setIsSubmitting(true);

    addPatient({
      name: formData.name.trim(),
      age: parseInt(formData.age, 10),
      gender: formData.gender as "Perempuan" | "Laki-laki",
      address: formData.address.trim(),
      phone: formData.phone.trim() || undefined,
      complaint: formData.complaint.trim(),
      vitalSigns: formData.vitalSigns.trim() || undefined,
      diagnosis: formData.diagnosis.trim(),
      prescribedDrugs: formData.prescribedDrugs,
      visitDate: formData.visitDate,
    });

    toast.success("Pasien berhasil ditambahkan");
    router.push("/patients");
  };

  // -- Loading state --------------------------------------------------------

  if (!hydrated) {
    return <FormSkeleton />;
  }

  // -- Render ---------------------------------------------------------------

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Data Pasien
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50"
          >
            Tambah Pasien Baru
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-sm text-slate-500 dark:text-slate-400 mt-1"
          >
            Isi formulir di bawah untuk mendaftarkan pasien baru
          </motion.p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {/* ============================================================= */}
          {/* Section 1 - Identitas */}
          {/* ============================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
          >
            <GlassCard>
              <h2 className={sectionTitleClasses}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                  1
                </span>
                Identitas Pasien
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nama */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className={labelClasses}>
                    Nama Lengkap <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama lengkap pasien"
                    className={`${inputClasses} ${
                      errors.name && touched.name ? errorInputClasses : ""
                    }`}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                  />
                  {errors.name && touched.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                {/* Umur */}
                <div>
                  <label htmlFor="age" className={labelClasses}>
                    Umur <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    placeholder="Tahun"
                    min={0}
                    max={120}
                    className={`${inputClasses} ${
                      errors.age && touched.age ? errorInputClasses : ""
                    }`}
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    onBlur={() => handleBlur("age")}
                  />
                  {errors.age && touched.age && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.age}
                    </motion.p>
                  )}
                </div>

                {/* Gender - radio buttons */}
                <div>
                  <label className={labelClasses}>
                    Jenis Kelamin <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-3 mt-1">
                    {(["Perempuan", "Laki-laki"] as const).map((option) => (
                      <label
                        key={option}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-200 border ${
                          formData.gender === option
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium"
                            : "bg-white/50 dark:bg-white/[0.05] border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-white/[0.08]"
                        } ${
                          errors.gender && touched.gender
                            ? errorInputClasses
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={formData.gender === option}
                          onChange={(e) =>
                            handleChange("gender", e.target.value)
                          }
                          className="sr-only"
                        />
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            formData.gender === option
                              ? "border-blue-500 bg-blue-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {formData.gender === option && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.gender && touched.gender && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.gender}
                    </motion.p>
                  )}
                </div>

                {/* Alamat */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className={labelClasses}>
                    Alamat <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    placeholder="Masukkan alamat lengkap"
                    className={`${inputClasses} resize-none ${
                      errors.address && touched.address
                        ? errorInputClasses
                        : ""
                    }`}
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    onBlur={() => handleBlur("address")}
                  />
                  {errors.address && touched.address && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.address}
                    </motion.p>
                  )}
                </div>

                {/* No HP */}
                <div className="md:col-span-2">
                  <label htmlFor="phone" className={labelClasses}>
                    No. HP{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="phone"
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    maxLength={15}
                    className={inputClasses}
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      handleChange("phone", val);
                    }}
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ============================================================= */}
          {/* Section 2 - Kunjungan */}
          {/* ============================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.3 }}
          >
            <GlassCard>
              <h2 className={sectionTitleClasses}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold">
                  2
                </span>
                Kunjungan
              </h2>

              <div>
                <label htmlFor="visitDate" className={labelClasses}>
                  Tanggal Kunjungan
                </label>
                <input
                  id="visitDate"
                  type="date"
                  className={`${inputClasses} max-w-xs`}
                  value={formData.visitDate}
                  onChange={(e) => handleChange("visitDate", e.target.value)}
                />
              </div>
            </GlassCard>
          </motion.div>

          {/* ============================================================= */}
          {/* Section 3 - SOAP */}
          {/* ============================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.3 }}
          >
            <GlassCard>
              <h2 className={sectionTitleClasses}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                  3
                </span>
                SOAP
              </h2>

              <div className="space-y-5">
                {/* Subjective - Keluhan */}
                <div>
                  <label htmlFor="complaint" className={labelClasses}>
                    Keluhan / Subjective{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="complaint"
                    rows={3}
                    placeholder="Tuliskan keluhan pasien secara detail"
                    className={`${inputClasses} resize-none ${
                      errors.complaint && touched.complaint
                        ? errorInputClasses
                        : ""
                    }`}
                    value={formData.complaint}
                    onChange={(e) => handleChange("complaint", e.target.value)}
                    onBlur={() => handleBlur("complaint")}
                  />
                  {errors.complaint && touched.complaint && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.complaint}
                    </motion.p>
                  )}
                </div>

                {/* Objective - Tanda Vital */}
                <div>
                  <label htmlFor="vitalSigns" className={labelClasses}>
                    Tanda Vital / Objective{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      (opsional)
                    </span>
                  </label>
                  <textarea
                    id="vitalSigns"
                    rows={2}
                    placeholder="TD: 120/80, Nadi: 80x/m, Suhu: 36.5&deg;C"
                    className={`${inputClasses} resize-none`}
                    value={formData.vitalSigns}
                    onChange={(e) => handleChange("vitalSigns", e.target.value)}
                  />
                </div>

                {/* Assessment - Diagnosa */}
                <div>
                  <label htmlFor="diagnosis" className={labelClasses}>
                    Diagnosa / Assessment{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="diagnosis"
                    type="text"
                    placeholder="Masukkan diagnosa"
                    className={`${inputClasses} ${
                      errors.diagnosis && touched.diagnosis
                        ? errorInputClasses
                        : ""
                    }`}
                    value={formData.diagnosis}
                    onChange={(e) => handleChange("diagnosis", e.target.value)}
                    onBlur={() => handleBlur("diagnosis")}
                  />
                  {errors.diagnosis && touched.diagnosis && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.diagnosis}
                    </motion.p>
                  )}
                </div>

                {/* Planning - Resep Obat */}
                <div>
                  <label className={labelClasses}>
                    Resep Obat / Planning{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    Pilih satu atau lebih obat yang diresepkan untuk pasien
                  </p>

                  {/* Selected drugs as tags */}
                  <AnimatePresence>
                    {formData.prescribedDrugs.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-1.5 mb-3"
                      >
                        {formData.prescribedDrugs.map((drugName) => (
                          <motion.span
                            key={drugName}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          >
                            {drugName}
                            <button
                              type="button"
                              onClick={() => toggleDrug(drugName)}
                              className="hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Drug search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari obat..."
                      className={`${inputClasses} pl-9`}
                      value={drugSearch}
                      onChange={(e) => setDrugSearch(e.target.value)}
                    />
                  </div>

                  {/* Drug grid */}
                  <div
                    className={`max-h-56 overflow-y-auto rounded-xl border bg-white/30 dark:bg-white/[0.02] p-3 ${
                      errors.prescribedDrugs && touched.prescribedDrugs
                        ? "border-red-400/50"
                        : "border-black/[0.06] dark:border-white/[0.08]"
                    }`}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredDrugs.map((drug) => {
                        const isSelected = formData.prescribedDrugs.includes(
                          drug.name
                        );
                        return (
                          <motion.button
                            key={drug.id}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleDrug(drug.name)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 text-left ${
                              isSelected
                                ? "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium"
                                : "bg-white/30 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/[0.06]"
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 ${
                                isSelected
                                  ? "bg-blue-500 text-white"
                                  : "border border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </span>
                            <span className="truncate">{drug.name}</span>
                          </motion.button>
                        );
                      })}
                      {filteredDrugs.length === 0 && (
                        <p className="col-span-full text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                          Tidak ada obat ditemukan
                        </p>
                      )}
                    </div>
                  </div>
                  {errors.prescribedDrugs && touched.prescribedDrugs && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.prescribedDrugs}
                    </motion.p>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ============================================================= */}
          {/* Actions */}
          {/* ============================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex justify-end gap-3 pb-8"
          >
            <Link
              href="/patients"
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/[0.05] border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.08] transition-all duration-200"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all duration-200 ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-blue-500/30"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan
            </button>
          </motion.div>
        </form>
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// Page export with Suspense boundary
// ---------------------------------------------------------------------------

export default function NewPatientPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <PatientFormContent />
    </Suspense>
  );
}
