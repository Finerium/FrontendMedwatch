"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { usePatientStore, type Patient } from "@/lib/store";
import { todayDDMMYYYY } from "@/lib/patient-format";
import { toast } from "sonner";

export default function NewPatientPage() {
  const router = useRouter();
  const add = usePatientStore((s) => s.add);
  const [busy, setBusy] = useState(false);

  const [tanggal, setTanggal] = useState(todayDDMMYYYY());
  const [nama, setNama] = useState("");
  const [umur, setUmur] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kategori, setKategori] = useState("Umum");

  const [keluhan, setKeluhan] = useState("");
  const [riwayat, setRiwayat] = useState("");

  const [tekDarah, setTekDarah] = useState("");
  const [nadi, setNadi] = useState("");
  const [suhu, setSuhu] = useState("");
  const [respirasi, setRespirasi] = useState("");
  const [bb, setBb] = useState("");
  const [tb, setTb] = useState("");
  const [lila, setLila] = useState("");
  const [catatan, setCatatan] = useState("");

  const [diagnosa, setDiagnosa] = useState("");
  const [tindakan, setTindakan] = useState("");
  const [resep, setResep] = useState("");
  const [jadwalKontrol, setJadwalKontrol] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !keluhan || !diagnosa || !tindakan) {
      toast.error("Isi field wajib: nama, S.keluhan, A.diagnosa, P.tindakan");
      return;
    }
    setBusy(true);
    try {
      const data: Omit<Patient, "id"> = {
        tanggal_kunjungan: tanggal,
        nama,
        umur,
        alamat,
        kategori,
        S: { keluhan, riwayat },
        O: {
          tekanan_darah: tekDarah, nadi, suhu_c: suhu, respirasi,
          bb_kg: bb, tb_cm: tb, lila_cm: lila, catatan,
        },
        A: { diagnosa },
        P: { tindakan, resep, jadwal_kontrol: jadwalKontrol },
      };
      const created = await add(data);
      toast.success(`Pasien ${created.id} berhasil dibuat`);
      router.push(`/patients/${created.id}`);
    } catch (err) {
      toast.error(`Gagal: ${err}`);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/patients" className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Tambah Pasien Baru</h1>
        <p className="text-sm text-slate-500 mt-1">Format SOAP. Field wajib: nama, S.keluhan, A.diagnosa, P.tindakan.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <fieldset className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold px-2">Identitas</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tanggal Kunjungan (DD-MM-YYYY)</label>
              <input className={inputCls} value={tanggal} onChange={(e) => setTanggal(e.target.value)} placeholder="28-02-2026" />
            </div>
            <div>
              <label className={labelCls}>Kategori</label>
              <input className={inputCls} value={kategori} onChange={(e) => setKategori(e.target.value)} list="kategori-list" />
              <datalist id="kategori-list">
                <option value="Ibu Hamil" /><option value="KB" /><option value="Anak" /><option value="Imunisasi" /><option value="Umum" />
              </datalist>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Nama *</label>
              <input className={inputCls} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Ny. Dewi" required />
            </div>
            <div>
              <label className={labelCls}>Umur</label>
              <input className={inputCls} value={umur} onChange={(e) => setUmur(e.target.value)} placeholder="25" />
            </div>
            <div>
              <label className={labelCls}>Alamat</label>
              <input className={inputCls} value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Kp. Selang Cau" />
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold px-2">S - Subjective</legend>
          <div>
            <label className={labelCls}>Keluhan *</label>
            <textarea className={inputCls} rows={3} value={keluhan} onChange={(e) => setKeluhan(e.target.value)} placeholder="contoh: mengeluh mual, muntah, pusing, telat mens 1 bln" required />
          </div>
          <div>
            <label className={labelCls}>Riwayat (opsional)</label>
            <textarea className={inputCls} rows={2} value={riwayat} onChange={(e) => setRiwayat(e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold px-2">O - Objective</legend>
          <p className="text-xs text-slate-500">Isi yang diukur saja. Field kosong tidak ditampilkan.</p>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>td. (tekanan darah)</label><input className={inputCls} value={tekDarah} onChange={(e) => setTekDarah(e.target.value)} placeholder="110/70" /></div>
            <div><label className={labelCls}>nadi (x/menit)</label><input className={inputCls} value={nadi} onChange={(e) => setNadi(e.target.value)} /></div>
            <div><label className={labelCls}>suhu (°C)</label><input className={inputCls} value={suhu} onChange={(e) => setSuhu(e.target.value)} /></div>
            <div><label className={labelCls}>respirasi (x/menit)</label><input className={inputCls} value={respirasi} onChange={(e) => setRespirasi(e.target.value)} /></div>
            <div><label className={labelCls}>BB (kg)</label><input className={inputCls} value={bb} onChange={(e) => setBb(e.target.value)} placeholder="50" /></div>
            <div><label className={labelCls}>tb (cm)</label><input className={inputCls} value={tb} onChange={(e) => setTb(e.target.value)} placeholder="150" /></div>
            <div><label className={labelCls}>lila (cm)</label><input className={inputCls} value={lila} onChange={(e) => setLila(e.target.value)} placeholder="23" /></div>
          </div>
          <div>
            <label className={labelCls}>Catatan tambahan</label>
            <textarea className={inputCls} rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="contoh: tespek positif, DJJ 140 x/menit" />
          </div>
        </fieldset>

        <fieldset className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold px-2">A - Assessment</legend>
          <div>
            <label className={labelCls}>Diagnosa *</label>
            <input className={inputCls} value={diagnosa} onChange={(e) => setDiagnosa(e.target.value)} placeholder="contoh: G1P0A0 hamil 5 mg" required />
          </div>
        </fieldset>

        <fieldset className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold px-2">P - Plan</legend>
          <div>
            <label className={labelCls}>Tindakan * (bullet per baris)</label>
            <textarea className={inputCls} rows={4} value={tindakan} onChange={(e) => setTindakan(e.target.value)} placeholder={"Istirahat cukup\nMakan sedikit tapi sering"} required />
          </div>
          <div>
            <label className={labelCls}>Resep</label>
            <textarea className={inputCls} rows={2} value={resep} onChange={(e) => setResep(e.target.value)} placeholder="Asam folat 1x1 sehari" />
          </div>
          <div>
            <label className={labelCls}>Jadwal Kontrol</label>
            <input className={inputCls} value={jadwalKontrol} onChange={(e) => setJadwalKontrol(e.target.value)} placeholder="DD-MM-YYYY" />
          </div>
        </fieldset>

        <div className="flex justify-end gap-3">
          <Link href="/patients" className="px-4 py-2.5 text-sm rounded-xl text-slate-400 hover:text-white">Batal</Link>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
