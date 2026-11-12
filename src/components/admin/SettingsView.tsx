"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle2,
  Search,
  Loader2,
  SlidersHorizontal,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  Database,
} from "lucide-react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { apiRequest } from "@/lib/api";

interface StudentScoreRow {
  rank: number;
  id: string;
  nis: string;
  name: string;
  class: string;
  correct: number;
  wrong: number;
  score: number;
  status: string;
}

interface NilaiStats {
  totalStudents: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  passedStudents: number;
  failedStudents: number;
  passPercentage: number;
}

interface CleanupSummary {
  sesiCount: number;
  jawabanCount: number;
  siswaCount: number;
  kelasCount: number;
  emptyKelasCount: number;
  soalCount: number;
}

export default function SettingsView() {
  const {
    activeExamId,
    activeBankSoalId,
    exams,
    updateExamSettings,
    fetchAllData,
    showToast,
  } = useCBTAdminStore();
  const activeExam = exams.find((e) => e.id === activeExamId) || exams[0];

  const [kkmInput, setKkmInput] = useState<number>(activeExam?.kkm ?? 75);
  const [batasPelanggaranInput, setBatasPelanggaranInput] = useState<number>(
    activeExam?.batasPelanggaran ?? 3
  );
  const [showStudentScore, setShowStudentScore] = useState<boolean>(
    activeExam?.tampilkanNilai ?? true
  );
  const [showAllStudentsTable, setShowAllStudentsTable] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // State Pembersihan Data
  const [cleanupSummary, setCleanupSummary] = useState<CleanupSummary>({
    sesiCount: 0,
    jawabanCount: 0,
    siswaCount: 0,
    kelasCount: 0,
    emptyKelasCount: 0,
    soalCount: 0,
  });
  const [isLoadingCleanup, setIsLoadingCleanup] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupTargets, setCleanupTargets] = useState<{
    sessions: boolean;
    students: boolean;
    classes: boolean;
    questions: boolean;
  }>({
    sessions: true,
    students: false,
    classes: false,
    questions: false,
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<NilaiStats>({
    totalStudents: 0,
    avgScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passedStudents: 0,
    failedStudents: 0,
    passPercentage: 0,
  });
  const [allScores, setAllScores] = useState<StudentScoreRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all");

  useEffect(() => {
    if (activeExam) {
      setKkmInput(activeExam.kkm ?? 75);
      setBatasPelanggaranInput(activeExam.batasPelanggaran ?? 3);
      setShowStudentScore(activeExam.tampilkanNilai ?? true);
    }
  }, [
    activeExam?.id,
    activeExam?.kkm,
    activeExam?.batasPelanggaran,
    activeExam?.tampilkanNilai,
  ]);

  const loadCleanupSummary = useCallback(async () => {
    const targetExamId = activeExam?.id || activeExamId;
    setIsLoadingCleanup(true);
    try {
      const params = new URLSearchParams();
      if (targetExamId) params.set("ujianId", targetExamId);
      if (activeBankSoalId) params.set("bankSoalId", activeBankSoalId);
      const res = await apiRequest<{ success: boolean; data: CleanupSummary }>(
        `/api/ujian/cleanup/summary?${params.toString()}`
      );
      if (res.data) {
        setCleanupSummary(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat ringkasan pembersihan data:", err);
    } finally {
      setIsLoadingCleanup(false);
    }
  }, [activeExam?.id, activeExamId, activeBankSoalId]);

  const loadScoreOverview = useCallback(async () => {
    const targetId = activeExam?.id || activeExamId;
    if (!targetId) return;
    setIsLoadingStats(true);
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(
        `/api/nilai/${targetId}`
      );
      if (res.data) {
        if (res.data.stats) setStats(res.data.stats);
        if (Array.isArray(res.data.results)) setAllScores(res.data.results);
      }
    } catch (err) {
      console.error("Gagal memuat statistik nilai:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [activeExam?.id, activeExamId]);

  useEffect(() => {
    loadScoreOverview();
    loadCleanupSummary();
  }, [loadScoreOverview, loadCleanupSummary]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = activeExam?.id || activeExamId;
    if (!targetId) return;

    setIsSaving(true);
    const safeBatas = Math.min(50, Math.max(0, Math.floor(Number(batasPelanggaranInput) || 0)));
    const ok = await updateExamSettings(targetId, {
      kkm: Math.min(100, Math.max(0, Number(kkmInput) || 0)),
      tampilkanNilai: showStudentScore,
      batasPelanggaran: safeBatas,
    });
    setIsSaving(false);

    if (ok) {
      setSaveToast("Pengaturan KKM, batas blokir & visibilitas nilai berhasil disimpan!");
      setTimeout(() => setSaveToast(null), 3500);
      loadScoreOverview();
    }
  };

  const selectedCleanupList = (
    Object.entries(cleanupTargets) as [keyof typeof cleanupTargets, boolean][]
  )
    .filter(([, checked]) => checked)
    .map(([key]) => key);

  const handleExecuteCleanup = async () => {
    if (selectedCleanupList.length === 0) {
      showToast("Pilih minimal 1 jenis data yang ingin dibersihkan.", "error");
      return;
    }

    setIsCleaning(true);
    try {
      const targetExamId = activeExam?.id || activeExamId;
      const res = await apiRequest<{ success: boolean; message?: string }>(
        "/api/ujian/cleanup",
        {
          method: "POST",
          body: JSON.stringify({
            targets: selectedCleanupList,
            ujianId: targetExamId || undefined,
            bankSoalId: activeBankSoalId || undefined,
          }),
        }
      );
      showToast(res.message || "Pembersihan data selesai dilakukan.", "success");
      setShowCleanupModal(false);
      await Promise.all([fetchAllData(), loadScoreOverview(), loadCleanupSummary()]);
    } catch (err: any) {
      showToast(err?.message || "Gagal melakukan pembersihan data.", "error");
    } finally {
      setIsCleaning(false);
    }
  };

  const highestStudent =
    allScores.length > 0
      ? allScores.reduce((prev, curr) => (curr.score > prev.score ? curr : prev))
      : null;
  const lowestStudent =
    allScores.length > 0
      ? allScores.reduce((prev, curr) => (curr.score < prev.score ? curr : prev))
      : null;

  const filteredScores = allScores.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class.toLowerCase().includes(searchQuery.toLowerCase());
    const isPassed = s.score >= kkmInput;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "passed" && isPassed) ||
      (statusFilter === "failed" && !isPassed);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Pengaturan */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            Konfigurasi Penilaian & Evaluasi
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 mt-0.5 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Pengaturan Nilai KKM & Monitoring Hasil Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ujian Aktif:{" "}
            <span className="font-bold text-slate-700">
              {activeExam?.title || "Belum ada ujian dipilih"}
            </span>
          </p>
        </div>

        <button
          onClick={async () => {
            await loadScoreOverview();
            showToast("Data statistik & nilai siswa berhasil dimuat ulang.", "info");
          }}
          disabled={isLoadingStats}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? "animate-spin" : ""}`} />
          <span>Refresh Nilai</span>
        </button>
      </div>

      {/* Form Pengaturan KKM & Tampilkan Nilai */}
      <form onSubmit={handleSaveSettings} className="soft-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Pengaturan Standar KKM, Anti-Curang & Visibilitas Nilai
            </h3>
          </div>
          {saveToast && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveToast}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Input KKM */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Nilai KKM (Kriteria Ketuntasan Minimal)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={kkmInput}
                onChange={(e) => setKkmInput(Number(e.target.value))}
                className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm font-extrabold text-sky-700 focus:outline-none focus:border-sky-500"
                required
              />
              <span className="text-xs text-slate-500">
                Siswa dengan nilai ≥ <strong className="text-slate-800">{kkmInput}</strong> dinyatakan{" "}
                <span className="text-emerald-600 font-bold">Tuntas</span>.
              </span>
            </div>
          </div>

          {/* Toggle Tampilkan Nilai ke Siswa */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="pr-4">
              <div className="text-xs font-bold text-slate-800">
                Tampilkan Nilai Akhir ke Siswa
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Jika aktif, siswa langsung melihat skor setelah mengumpulkan ujian.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowStudentScore(!showStudentScore)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                showStudentScore ? "bg-sky-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  showStudentScore ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pengaturan Batas Keluar / Pelanggaran Sebelum Diblokir */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Batas Keluar Halaman / Pindah Tab Sebelum Diblokir
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Atur berapa kali siswa diperbolehkan keluar dari tab ujian sebelum akun/lembar ujiannya diblokir (dikunci) otomatis oleh sistem.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={batasPelanggaranInput}
                onChange={(e) => setBatasPelanggaranInput(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="w-24 px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-base sm:text-sm font-extrabold text-amber-700 focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs font-bold text-slate-600">kali keluar</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "1x (Ketat)", value: 1 },
                { label: "3x (Standar)", value: 3 },
                { label: "5x", value: 5 },
                { label: "0 (Nonaktif)", value: 0 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setBatasPelanggaranInput(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    batasPelanggaranInput === preset.value
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] font-semibold text-amber-800">
            {batasPelanggaranInput === 0
              ? "Mode pemblokiran otomatis dinonaktifkan (pelanggaran tetap dicatat di Live Proctoring, namun ujian siswa tidak dikunci otomatis)."
              : `Siswa akan otomatis diblokir/dikunci saat terdeteksi keluar layar ujian sebanyak ${batasPelanggaranInput} kali.`}
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving || !activeExam}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold text-xs transition shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Kartu Statistik: KKM, Nilai Tertinggi, Nilai Terendah, Total Siswa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="soft-card p-5 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>STANDAR KKM</span>
            <Award className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">{kkmInput}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.passedStudents} dari {stats.totalStudents} siswa tuntas ({stats.passPercentage}%)
          </div>
        </div>

        <div className="soft-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>NILAI TERTINGGI</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {stats.highestScore}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {highestStudent
              ? `${highestStudent.name} (${highestStudent.class})`
              : "Belum ada nilai masuk"}
          </div>
        </div>

        <div className="soft-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>NILAI TERENDAH</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {stats.lowestScore}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {lowestStudent
              ? `${lowestStudent.name} (${lowestStudent.class})`
              : "Belum ada nilai masuk"}
          </div>
        </div>

        <div className="soft-card p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>RATA-RATA KELAS</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-2">
            {stats.avgScore}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total {stats.totalStudents} peserta ujian tercatat
          </div>
        </div>
      </div>

      {/* Bagian Tampilkan Nilai Semua Siswa */}
      <div className="soft-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Nilai Semua Siswa
            </h3>
            <p className="text-xs text-slate-400">
              Daftar lengkap nilai seluruh peserta ujian berdasarkan KKM ({kkmInput}).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAllStudentsTable(!showAllStudentsTable)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
          >
            {showAllStudentsTable ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Sembunyikan Nilai Semua Siswa</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Tampilkan Nilai Semua Siswa</span>
              </>
            )}
          </button>
        </div>

        {showAllStudentsTable && (
          <>
            {/* Pencarian & Filter Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa atau kelas/jurusan..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                {(
                  [
                    { id: "all", label: "Semua" },
                    { id: "passed", label: "Tuntas" },
                    { id: "failed", label: "Belum Tuntas" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusFilter === tab.id
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tampilan Kartu Mobile (< md) */}
            <div className="md:hidden space-y-2.5">
              {isLoadingStats ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-sky-500" />
                  Memuat nilai siswa...
                </div>
              ) : filteredScores.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada data nilai siswa untuk ujian ini.
                </div>
              ) : (
                filteredScores.map((s) => {
                  const isPassed = s.score >= kkmInput;
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-400">
                              #{s.rank}
                            </span>
                            <span className="font-bold text-sm text-slate-800 truncate">
                              {s.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.class}</div>
                        </div>

                        <span
                          className={`text-base font-extrabold font-mono shrink-0 ${
                            isPassed ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {s.score}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <div className="font-mono">
                          <span className="text-emerald-600 font-bold">{s.correct} Benar</span>
                          {" • "}
                          <span className="text-rose-500 font-bold">{s.wrong} Salah</span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPassed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isPassed ? "Tuntas" : "Belum Tuntas"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Tabel Daftar Nilai Desktop (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas & Jurusan</th>
                    <th className="py-3 px-4 text-center">Benar / Salah</th>
                    <th className="py-3 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3 px-4 text-center">Status (KKM {kkmInput})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingStats ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-sky-500" />
                        Memuat nilai siswa...
                      </td>
                    </tr>
                  ) : filteredScores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada data nilai siswa untuk ujian ini.
                      </td>
                    </tr>
                  ) : (
                    filteredScores.map((s) => {
                      const isPassed = s.score >= kkmInput;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">
                            #{s.rank}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                          <td className="py-3 px-4 text-slate-600">{s.class}</td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className="text-emerald-600 font-bold">{s.correct}</span>
                            {" / "}
                            <span className="text-rose-500 font-bold">{s.wrong}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-sm font-extrabold ${
                                isPassed ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {s.score}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isPassed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {isPassed ? "Tuntas" : "Belum Tuntas"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Bagian Pembersihan Data Database */}
      <div className="soft-card p-5 sm:p-6 border border-rose-200/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pembersihan Data Sistem (Reset Data Ujian)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bersihkan data uji coba sebelum pelaksanaan ujian resmi. Akun Admin & Guru tidak akan pernah terhapus.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadCleanupSummary}
            disabled={isLoadingCleanup}
            className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCleanup ? "animate-spin" : ""}`} />
            <span>Perbarui Hitungan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opsi 1: Sesi & Nilai */}
          <label
            className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
              cleanupTargets.sessions
                ? "bg-rose-50/60 border-rose-300"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={cleanupTargets.sessions}
              onChange={(e) =>
                setCleanupTargets((prev) => ({ ...prev, sessions: e.target.checked }))
              }
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Riwayat Sesi, Nilai & Jawaban Ujian
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {cleanupSummary.sesiCount} Sesi • {cleanupSummary.jawabanCount} Jawaban
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mengosongkan proctoring, skor, pelanggaran, dan jawaban siswa pada ujian aktif (akun siswa & bank soal tetap tersimpan).
              </p>
            </div>
          </label>

          {/* Opsi 2: Akun Siswa */}
          <label
            className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
              cleanupTargets.students
                ? "bg-rose-50/60 border-rose-300"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={cleanupTargets.students}
              onChange={(e) =>
                setCleanupTargets((prev) => ({ ...prev, students: e.target.checked }))
              }
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Seluruh Data Akun Siswa
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {cleanupSummary.siswaCount} Siswa
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Menghapus seluruh daftar peserta siswa agar siap untuk import peserta baru (sesi ujian siswa ikut dibersihkan).
              </p>
            </div>
          </label>

          {/* Opsi 3: Kelas Kosong */}
          <label
            className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
              cleanupTargets.classes
                ? "bg-rose-50/60 border-rose-300"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={cleanupTargets.classes}
              onChange={(e) =>
                setCleanupTargets((prev) => ({ ...prev, classes: e.target.checked }))
              }
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Data Kelas Kosong / Tanpa Siswa
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {cleanupSummary.emptyKelasCount} Kosong / {cleanupSummary.kelasCount} Total
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Menghapus kelas yang tidak memiliki siswa terdaftar (otomatis membersihkan semua kelas jika opsi Akun Siswa ikut dicentang).
              </p>
            </div>
          </label>

          {/* Opsi 4: Butir Soal */}
          <label
            className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
              cleanupTargets.questions
                ? "bg-rose-50/60 border-rose-300"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={cleanupTargets.questions}
              onChange={(e) =>
                setCleanupTargets((prev) => ({ ...prev, questions: e.target.checked }))
              }
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Butir Soal Bank Soal Aktif
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {cleanupSummary.soalCount} Soal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mengosongkan seluruh pertanyaan pada paket Bank Soal aktif saat ini untuk persiapan import soal baru.
              </p>
            </div>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Penghapusan data bersifat permanen dan memerlukan konfirmasi akhir.
          </span>
          <button
            type="button"
            disabled={selectedCleanupList.length === 0 || isCleaning}
            onClick={() => setShowCleanupModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Data Terpilih ({selectedCleanupList.length})</span>
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi Pembersihan Data */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Konfirmasi Pembersihan Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan menghapus permanen kategori data berikut dari database Neon PostgreSQL:
                </p>
              </div>
            </div>

            <ul className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1.5 list-disc list-inside font-semibold">
              {cleanupTargets.sessions && (
                <li>
                  Riwayat Sesi & Nilai Ujian ({cleanupSummary.sesiCount} sesi,{" "}
                  {cleanupSummary.jawabanCount} jawaban)
                </li>
              )}
              {cleanupTargets.students && (
                <li>Seluruh Akun Siswa ({cleanupSummary.siswaCount} siswa)</li>
              )}
              {cleanupTargets.classes && (
                <li>
                  Data Kelas Kosong ({cleanupTargets.students ? cleanupSummary.kelasCount : cleanupSummary.emptyKelasCount} kelas)
                </li>
              )}
              {cleanupTargets.questions && (
                <li>Butir Soal Bank Soal Aktif ({cleanupSummary.soalCount} soal)</li>
              )}
            </ul>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isCleaning}
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isCleaning}
                onClick={handleExecuteCleanup}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold transition"
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Bersihkan Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
