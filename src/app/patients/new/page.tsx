"use client";

import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion } from "framer-motion";
import { patients } from "@/data/patients";
import { drugs } from "@/data/drugs";
import { provinceData } from "@/data/indonesia-map";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { ArrowLeft, Save, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  name: string;
  nik: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  province: string;
  complaint: string;
  assignedDrugs: string[];
  status: string;
}

interface FormErrors {
  name?: string;
  nik?: string;
  age?: string;
  gender?: string;
  phone?: string;
  address?: string;
  province?: string;
  complaint?: string;
}

const complaints = [
  "Hipertensi",
  "Demam",
  "Infeksi Saluran Napas",
  "Nyeri Sendi",
  "Diabetes Mellitus",
  "GERD",
  "Alergi",
  "Asma",
  "Migrain",
  "Infeksi Saluran Kemih",
  "Dermatitis",
  "Dispepsia",
  "Bronkitis",
  "Anemia",
  "Gangguan Kecemasan",
];

const inputClasses =
  "w-full px-4 py-2.5 rounded-xl text-sm bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200";

const selectClasses =
  "w-full px-4 py-2.5 rounded-xl text-sm bg-white/50 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200 appearance-none";

const labelClasses = "text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block";

const errorClasses = "text-xs text-red-500 mt-1";

function PatientFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  const editingPatient = isEditing
    ? patients.find((p) => p.id === editId)
    : null;

  const [formData, setFormData] = useState<FormData>(() =>
    editingPatient
      ? {
          name: editingPatient.name,
          nik: editingPatient.nik,
          age: String(editingPatient.age),
          gender: editingPatient.gender,
          phone: editingPatient.phone,
          address: editingPatient.address,
          province: editingPatient.province,
          complaint: editingPatient.complaint,
          assignedDrugs: editingPatient.assignedDrugs,
          status: editingPatient.status,
        }
      : {
          name: "",
          nik: "",
          age: "",
          gender: "",
          phone: "",
          address: "",
          province: "",
          complaint: "",
          assignedDrugs: [],
          status: "Aktif",
        }
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const sortedProvinces = useMemo(() => {
    return [...provinceData].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const validateField = (
    field: keyof FormErrors,
    value: string
  ): string | undefined => {
    switch (field) {
      case "name":
        if (!value || value.trim().length < 3)
          return "Nama harus minimal 3 karakter";
        return undefined;
      case "nik":
        if (!value || !/^\d{16}$/.test(value))
          return "NIK harus 16 digit angka";
        return undefined;
      case "age": {
        const ageNum = parseInt(value, 10);
        if (!value || isNaN(ageNum) || ageNum < 1 || ageNum > 120)
          return "Usia harus antara 1-120 tahun";
        return undefined;
      }
      case "gender":
        if (!value) return "Pilih jenis kelamin";
        return undefined;
      case "phone":
        if (!value || !/^08\d{8,11}$/.test(value))
          return "Nomor telepon harus dimulai dengan 08 dan 10-13 digit";
        return undefined;
      case "address":
        if (!value || value.trim().length === 0) return "Alamat wajib diisi";
        return undefined;
      case "province":
        if (!value) return "Pilih provinsi";
        return undefined;
      case "complaint":
        if (!value) return "Pilih keluhan utama";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field as keyof FormData];
    const error = validateField(field, typeof value === "string" ? value : "");
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (
    field: keyof FormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(
        field as keyof FormErrors,
        typeof value === "string" ? value : ""
      );
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const toggleDrug = (drugId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedDrugs: prev.assignedDrugs.includes(drugId)
        ? prev.assignedDrugs.filter((id) => id !== drugId)
        : [...prev.assignedDrugs, drugId],
    }));
  };

  const hasErrors = useMemo(() => {
    return Object.values(errors).some((e) => !!e);
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldsToValidate: (keyof FormErrors)[] = [
      "name",
      "nik",
      "age",
      "gender",
      "phone",
      "address",
      "province",
      "complaint",
    ];

    const newErrors: FormErrors = {};
    const newTouched: Record<string, boolean> = {};
    let hasValidationErrors = false;

    for (const field of fieldsToValidate) {
      newTouched[field] = true;
      const value = formData[field as keyof FormData];
      const error = validateField(field, typeof value === "string" ? value : "");
      if (error) {
        newErrors[field] = error;
        hasValidationErrors = true;
      }
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setErrors(newErrors);

    if (hasValidationErrors) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success(
      isEditing
        ? "Data pasien berhasil diperbarui"
        : "Pasien berhasil ditambahkan"
    );
    router.push("/patients");
  };

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
            {isEditing ? "Edit Data Pasien" : "Tambah Pasien Baru"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-sm text-slate-500 dark:text-slate-400 mt-1"
          >
            {isEditing
              ? "Perbarui informasi pasien"
              : "Isi formulir di bawah untuk mendaftarkan pasien baru"}
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <GlassCard>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nama Lengkap */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className={labelClasses}>
                    Nama Lengkap <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama lengkap pasien"
                    className={`${inputClasses} ${
                      errors.name && touched.name
                        ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
                        : ""
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

                {/* NIK */}
                <div className="md:col-span-1">
                  <label htmlFor="nik" className={labelClasses}>
                    NIK <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="nik"
                    type="text"
                    placeholder="16 digit NIK"
                    maxLength={16}
                    className={`${inputClasses} ${
                      errors.nik && touched.nik
                        ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
                        : ""
                    }`}
                    value={formData.nik}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      handleChange("nik", val);
                    }}
                    onBlur={() => handleBlur("nik")}
                  />
                  {errors.nik && touched.nik && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.nik}
                    </motion.p>
                  )}
                </div>

                {/* Usia */}
                <div className="md:col-span-1">
                  <label htmlFor="age" className={labelClasses}>
                    Usia <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    placeholder="Tahun"
                    min={1}
                    max={120}
                    className={`${inputClasses} ${
                      errors.age && touched.age
                        ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
                        : ""
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

                {/* Jenis Kelamin */}
                <div className="md:col-span-1">
                  <label htmlFor="gender" className={labelClasses}>
                    Jenis Kelamin <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      className={`${selectClasses} ${
                        !formData.gender
                          ? "text-slate-400 dark:text-slate-500"
                          : ""
                      } ${
                        errors.gender && touched.gender
                          ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
                          : ""
                      }`}
                      value={formData.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      onBlur={() => handleBlur("gender")}
                    >
                      <option value="" disabled>
                        Pilih jenis kelamin
                      </option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="h-4 w-4 text-slate-400 dark:text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
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

                {/* No. Telepon */}
                <div className="md:col-span-1">
                  <label htmlFor="phone" className={labelClasses}>
                    No. Telepon <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="phone"
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    maxLength={13}
                    className={`${inputClasses} ${
                      errors.phone && touched.phone
                        ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
                        : ""
                    }`}
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      handleChange("phone", val);
                    }}
                    onBlur={() => handleBlur("phone")}
                  />
                  {errors.phone && touched.phone && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.phone}
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
                        ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
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

                {/* Provinsi */}
                <div className="md:col-span-1">
                  <label htmlFor="province" className={labelClasses}>
                    Provinsi <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="province"
                      className={`${selectClasses} ${
                        !formData.province
                          ? "text-slate-400 dark:text-slate-500"
                          : ""
                      } ${
                        errors.province && touched.province
                          ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
                          : ""
                      }`}
                      value={formData.province}
                      onChange={(e) =>
                        handleChange("province", e.target.value)
                      }
                      onBlur={() => handleBlur("province")}
                    >
                      <option value="" disabled>
                        Pilih provinsi
                      </option>
                      {sortedProvinces.map((prov) => (
                        <option key={prov.id} value={prov.name}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="h-4 w-4 text-slate-400 dark:text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.province && touched.province && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={errorClasses}
                    >
                      {errors.province}
                    </motion.p>
                  )}
                </div>

                {/* Keluhan Utama */}
                <div className="md:col-span-1">
                  <label htmlFor="complaint" className={labelClasses}>
                    Keluhan Utama <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="complaint"
                      className={`${selectClasses} ${
                        !formData.complaint
                          ? "text-slate-400 dark:text-slate-500"
                          : ""
                      } ${
                        errors.complaint && touched.complaint
                          ? "border-red-400/50 focus:ring-red-500/20 focus:border-red-400/50"
                          : ""
                      }`}
                      value={formData.complaint}
                      onChange={(e) =>
                        handleChange("complaint", e.target.value)
                      }
                      onBlur={() => handleBlur("complaint")}
                    >
                      <option value="" disabled>
                        Pilih keluhan utama
                      </option>
                      {complaints.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="h-4 w-4 text-slate-400 dark:text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
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

                {/* Obat yang Diberikan */}
                <div className="md:col-span-2">
                  <label className={labelClasses}>Obat yang Diberikan</label>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    Pilih satu atau lebih obat yang diberikan kepada pasien
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/30 dark:bg-white/[0.02] p-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {drugs.map((drug) => {
                        const isSelected = formData.assignedDrugs.includes(
                          drug.id
                        );
                        return (
                          <motion.button
                            key={drug.id}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleDrug(drug.id)}
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
                    </div>
                  </div>
                  {formData.assignedDrugs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 flex flex-wrap gap-1.5"
                    >
                      {formData.assignedDrugs.map((drugId) => {
                        const drug = drugs.find((d) => d.id === drugId);
                        if (!drug) return null;
                        return (
                          <span
                            key={drugId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          >
                            {drug.name}
                            <button
                              type="button"
                              onClick={() => toggleDrug(drugId)}
                              className="hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label htmlFor="status" className={labelClasses}>
                    Status
                  </label>
                  <div className="relative max-w-xs">
                    <select
                      id="status"
                      className={selectClasses}
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="h-4 w-4 text-slate-400 dark:text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="md:col-span-2">
                  <div className="border-t border-black/[0.06] dark:border-white/[0.08]" />
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex justify-end gap-3">
                  <Link
                    href="/patients"
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/[0.05] border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.08] transition-all duration-200"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting || hasErrors}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all duration-200 ${
                      isSubmitting || hasErrors
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-blue-500/30"
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isEditing ? "Perbarui" : "Simpan"}
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

export default function NewPatientPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div>
            <div className="h-4 w-48 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse mb-4" />
            <div className="h-8 w-64 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-80 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse mt-2" />
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={i === 0 || i === 4 || i === 5 ? "md:col-span-2" : "md:col-span-1"}
                  >
                    <div className="h-4 w-24 rounded bg-white/50 dark:bg-white/[0.05] animate-pulse mb-1.5" />
                    <div className="h-10 w-full rounded-xl bg-white/50 dark:bg-white/[0.05] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <PatientFormContent />
    </Suspense>
  );
}
