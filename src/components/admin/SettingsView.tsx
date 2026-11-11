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

export default function SettingsView() {
  const { activeExamId, exams, updateExamSettings, showToast } = useCBTAdminStore();
  const activeExam = exams.find((e) => e.id === activeExamId) || exams[0];

  const [kkmInput, setKkmInput] = useState<number>(activeExam?.kkm ?? 75);
  const [showStudentScore, setShowStudentScore] = useState<boolean>(
    activeExam?.tampilkanNilai ?? true
  );
  const [showAllStudentsTable, setShowAllStudentsTable] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

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
      setShowStudentScore(activeExam.tampilkanNilai ?? true);
    }
  }, [activeExam?.id, activeExam?.kkm, activeExam?.tampilkanNilai]);

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
  }, [loadScoreOverview]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = activeExam?.id || activeExamId;
    if (!targetId) return;

    setIsSaving(true);
    const ok = await updateExamSettings(targetId, {
      kkm: Math.min(100, Math.max(0, Number(kkmInput) || 0)),
      tampilkanNilai: showStudentScore,
    });
    setIsSaving(false);

    if (ok) {
      setSaveToast("Pengaturan KKM & visibilitas nilai berhasil disimpan!");
      setTimeout(() => setSaveToast(null), 3500);
      loadScoreOverview();
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
              Pengaturan Standar KKM & Visibilitas Nilai
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
                className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-extrabold text-sky-700 focus:outline-none focus:border-sky-500"
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
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa atau kelas/jurusan..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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

            {/* Tabel Daftar Nilai */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
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
    </div>
  );
}
