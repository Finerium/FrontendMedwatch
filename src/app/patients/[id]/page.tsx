"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { GlassCard } from "@/components/shared/GlassCard";
import { useHydratedPatientStore } from "@/lib/use-hydrated-store";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  Activity,
  FileText,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDate(dateStr: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { patients, deletePatient, hydrated } = useHydratedPatientStore();
  const [showDelete, setShowDelete] = useState(false);

  const id = params.id as string;
  const patient = patients.find((p) => p.id === id);

  if (!hydrated) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="h-4 w-48 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-8 w-64 rounded-lg bg-white/50 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-64 rounded-2xl bg-white/50 dark:bg-white/[0.05] animate-pulse" />
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

  const handleDelete = () => {
    deletePatient(patient.id);
    toast.success("Pasien berhasil dihapus");
    router.push("/patients");
  };

  const sectionClass = "space-y-3";
  const sectionTitle = "text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2";
  const fieldLabel = "text-xs text-slate-500 dark:text-slate-400";
  const fieldValue = "text-sm text-slate-900 dark:text-slate-50 font-medium";

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Data Pasien
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {patient.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {patient.id}
            </p>
          </motion.div>

          <div className="flex items-center gap-2">
            <Link
              href={`/patients/${patient.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 border border-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Identitas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <GlassCard>
              <div className={sectionClass}>
                <h2 className={sectionTitle}>
                  <User className="w-4 h-4" />
                  Identitas Pasien
                </h2>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className={fieldLabel}>Nama Lengkap</p>
                    <p className={fieldValue}>{patient.name}</p>
                  </div>
                  <div>
                    <p className={fieldLabel}>Umur / Gender</p>
                    <p className={fieldValue}>
                      {patient.age} tahun / {patient.gender}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className={fieldLabel}>
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Alamat
                    </p>
                    <p className={fieldValue}>{patient.address}</p>
                  </div>
                  {patient.phone && (
                    <div>
                      <p className={fieldLabel}>
                        <Phone className="w-3 h-3 inline mr-1" />
                        No. HP
                      </p>
                      <p className={fieldValue}>{patient.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className={fieldLabel}>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Tanggal Kunjungan
                    </p>
                    <p className={fieldValue}>{formatDate(patient.visitDate)}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* SOAP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <GlassCard>
              <div className={sectionClass}>
                <h2 className={sectionTitle}>
                  <Stethoscope className="w-4 h-4" />
                  Data Klinis (SOAP)
                </h2>

                <div className="space-y-4 pt-2">
                  {/* Subjective */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">
                      <FileText className="w-3 h-3 inline mr-1" />
                      Subjective - Keluhan
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {patient.complaint}
                    </p>
                  </div>

                  {/* Objective */}
                  {patient.vitalSigns && (
                    <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3">
                      <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">
                        <Activity className="w-3 h-3 inline mr-1" />
                        Objective - Tanda Vital
                      </p>
                      <p className="text-sm text-slate-900 dark:text-slate-50 font-mono">
                        {patient.vitalSigns}
                      </p>
                    </div>
                  )}

                  {/* Assessment */}
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3">
                    <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">
                      Assessment - Diagnosa
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                      {patient.diagnosis}
                    </p>
                  </div>

                  {/* Planning */}
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
                      <Pill className="w-3 h-3 inline mr-1" />
                      Planning - Resep Obat
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {patient.prescribedDrugs.map((drug) => (
                        <span
                          key={drug}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          {drug}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <GlassCard variant="subtle">
            <div className="flex flex-wrap gap-6 text-xs text-slate-400 dark:text-slate-500">
              <span>Dibuat: {new Date(patient.createdAt).toLocaleString("id-ID")}</span>
              <span>Terakhir diubah: {new Date(patient.updatedAt).toLocaleString("id-ID")}</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Delete Dialog */}
        <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
          <AlertDialogContent className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900 dark:text-slate-50">
                Hapus Pasien?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                Hapus pasien{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {patient.name}
                </span>
                ? Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
