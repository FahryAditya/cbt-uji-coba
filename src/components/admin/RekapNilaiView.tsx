"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Search,
  Filter,
  SlidersHorizontal,
  Loader2,
  Eye,
  X,
  Check,
  XCircle,
  HelpCircle,
  Save,
} from "lucide-react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { apiRequest, API_BASE_URL } from "@/lib/api";

interface StudentResult {
  id?: string;
  nis: string;
  name: string;
  class: string;
  correct: number;
  wrong: number;
  score: number;
  isPassed?: boolean;
}

interface AnswerOptionDetail {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
}

interface QuestionAnswerDetail {
  soalId: string;
  nomorUrut: number;
  pertanyaan: string;
  bobotNilai: number;
  kunciLabel: string;
  kunciTeks: string;
  jawabanLabel: string | null;
  jawabanTeks: string | null;
  status: "BENAR" | "SALAH" | "KOSONG";
  options: AnswerOptionDetail[];
}

interface StudentAnswerDetailData {
  sesiId: string;
  studentName: string;
  studentClass: string;
  examTitle: string;
  kkm: number;
  score: number;
  status: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  answers: QuestionAnswerDetail[];
}

export default function RekapNilaiView() {
  const { activeExamId, availableClasses, updateExamSettings, showToast } = useCBTAdminStore();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [kkm, setKkm] = useState(75);
  const [isSavingKkm, setIsSavingKkm] = useState(false);
  const [kkmSavedToast, setKkmSavedToast] = useState(false);
  const [enableViewAnswers, setEnableViewAnswers] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Detail Hasil Jawaban Soal Benar & Salah
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailData, setDetailData] = useState<StudentAnswerDetailData | null>(null);
  const [detailFilter, setDetailFilter] = useState<"ALL" | "BENAR" | "SALAH">("ALL");

  const loadNilai = useCallback(async () => {
    setIsLoading(true);
    try {
      const path = activeExamId ? `/api/nilai/${activeExamId}` : "/api/nilai";
      const res = await apiRequest<{ success: boolean; data: any }>(path);
      if (res.data) {
        if (res.data.kkm !== undefined) setKkm(res.data.kkm);
        if (Array.isArray(res.data.results)) {
          setStudents(res.data.results);
        }
      }
    } catch (err) {
      console.error("Gagal load nilai dari server:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeExamId]);

  useEffect(() => {
    loadNilai();
  }, [loadNilai]);

  const handleSaveKkm = async () => {
    if (!activeExamId) return;
    setIsSavingKkm(true);
    const ok = await updateExamSettings(activeExamId, {
      kkm: Math.min(100, Math.max(0, Number(kkm) || 0)),
    });
    setIsSavingKkm(false);
    if (ok) {
      setKkmSavedToast(true);
      setTimeout(() => setKkmSavedToast(false), 3000);
      loadNilai();
    }
  };

  const handleOpenDetailAnswers = async (sesiId?: string) => {
    if (!sesiId) return;
    setDetailModalOpen(true);
    setIsLoadingDetail(true);
    setDetailData(null);
    setDetailFilter("ALL");
    try {
      const res = await apiRequest<{ success: boolean; data: StudentAnswerDetailData }>(
        `/api/nilai/detail/${sesiId}`
      );
      if (res.data) {
        setDetailData(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat detail jawaban siswa:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Filter siswa berdasarkan pencarian dan kelas
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = selectedClass === "all" || s.class === selectedClass;
    return matchSearch && matchClass;
  });

  // Urutkan nilai tertinggi ke terendah
  filteredStudents.sort((a, b) => b.score - a.score);

  // Perhitungan statistik KKM, Tertinggi, Terendah
  const totalCount = filteredStudents.length;
  const scores = filteredStudents.map((s) => s.score);
  const avgScore =
    totalCount > 0
      ? (scores.reduce((a, b) => a + b, 0) / totalCount).toFixed(1)
      : "0";
  const highestScore = totalCount > 0 ? Math.max(...scores) : 0;
  const lowestScore = totalCount > 0 ? Math.min(...scores) : 0;
  const highestStudent =
    totalCount > 0
      ? filteredStudents.reduce((a, b) => (b.score > a.score ? b : a))
      : null;
  const lowestStudent =
    totalCount > 0
      ? filteredStudents.reduce((a, b) => (b.score < a.score ? b : a))
      : null;
  const passedStudents = filteredStudents.filter((s) => s.score >= kkm).length;
  const failedStudents = totalCount - passedStudents;
  const passPercentage =
    totalCount > 0 ? Math.round((passedStudents / totalCount) * 100) : 0;

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const targetId = activeExamId || "all";
      const token =
        typeof window !== "undefined" ? localStorage.getItem("cbt_token") : null;
      const res = await fetch(`${API_BASE_URL}/api/nilai/${targetId}/export-excel`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Rekap_Nilai_CBT_KKM_${kkm}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        showToast("File Excel rekap nilai (.xlsx) berhasil diunduh!", "success");
        setTimeout(() => setDownloadSuccess(false), 3500);
        return;
      }
    } catch (err) {
      console.warn("Gagal download excel backend, beralih ke CSV fallback:", err);
    } finally {
      setIsExporting(false);
    }

    // Fallback CSV
    const headers = [
      "No.",
      "Nama Siswa",
      "Kelas",
      "Jawaban Benar",
      "Jawaban Salah",
      "Nilai Akhir",
      "Minimal KKM",
      "Status Ketuntasan",
    ];
    const rows = filteredStudents.map((r, i) => [
      i + 1,
      `"${r.name}"`,
      `"${r.class}"`,
      r.correct,
      r.wrong,
      r.score,
      kkm,
      r.score >= kkm ? "Tuntas" : "Belum Tuntas",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_CBT_KKM_${kkm}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const filteredDetailAnswers = (detailData?.answers || []).filter((a) => {
    if (detailFilter === "ALL") return true;
    return a.status === detailFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Rekap Nilai & Aksi Ekspor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Rekapitulasi Nilai & Hasil Jawaban Siswa
          </h2>
          <p className="text-xs text-slate-500">
            Pantau nilai tertinggi, nilai terendah, standar minimal KKM, serta detail jawaban benar dan salah tiap soal.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-semibold text-xs transition shadow-sm"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          <span>{isExporting ? "Memproses Excel..." : "Ekspor Nilai ke Excel (.xlsx)"}</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            File rekapitulasi nilai resmi (.xlsx) berhasil diunduh dari server!
          </span>
        </div>
      )}

      {kkmSavedToast && (
        <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Nilai Minimal KKM ({kkm}) berhasil disimpan ke database!</span>
        </div>
      )}

      {/* 2. KPI Cards Statistik: Nilai Tertinggi, Nilai Terendah, Minimal KKM, Ketuntasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Nilai Tertinggi */}
        <div className="soft-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Nilai Tertinggi
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono tabular-digits">
            {highestScore}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            {highestStudent
              ? `${highestStudent.name} (${highestStudent.class})`
              : "Belum ada nilai masuk"}
          </div>
        </div>

        {/* Card 2: Nilai Terendah */}
        <div className="soft-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Nilai Terendah
            </span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 font-mono tabular-digits">
            {lowestScore}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            {lowestStudent
              ? `${lowestStudent.name} (${lowestStudent.class})`
              : "Belum ada nilai masuk"}
          </div>
        </div>

        {/* Card 3: Minimal KKM & Lulus */}
        <div className="soft-card p-5 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Minimal KKM ({kkm})
            </span>
            <Award className="w-5 h-5 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-600 font-mono tabular-digits">
              {passedStudents}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {totalCount} Tuntas
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Belum Tuntas: <strong className="text-rose-500">{failedStudents}</strong> | Rata-rata:{" "}
            <strong className="text-indigo-600">{avgScore}</strong>
          </div>
        </div>

        {/* Card 4: Persentase Ketuntasan */}
        <div className="soft-card p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ketuntasan (≥ {kkm})
            </span>
            <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {passPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${passPercentage}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Total {totalCount} peserta terdata</span>
          </div>
        </div>
      </div>

      {/* 3. Panel Filter, Pengaturan Lihat Hasil Jawaban, & Minimal KKM */}
      <div className="soft-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau kelas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-base sm:text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-base sm:text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Semua Kelas</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Pengaturan Lihat Hasil Jawaban */}
          <button
            type="button"
            onClick={() => {
              const next = !enableViewAnswers;
              setEnableViewAnswers(next);
              showToast(
                next
                  ? "Kolom Lihat Hasil Jawaban diaktifkan."
                  : "Kolom Lihat Hasil Jawaban disembunyikan.",
                "info"
              );
            }}
            className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
              enableViewAnswers
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>
              Lihat Hasil Jawaban: {enableViewAnswers ? "AKTIF" : "NONAKTIF"}
            </span>
          </button>

          {/* Pengaturan Minimal KKM */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">Minimal KKM:</span>
            <input
              type="number"
              min="0"
              max="100"
              value={kkm}
              onChange={(e) => setKkm(Number(e.target.value))}
              className="w-16 px-2 py-1 text-center font-bold text-base sm:text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={handleSaveKkm}
              disabled={isSavingKkm || !activeExamId}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-[11px] font-bold transition"
            >
              {isSavingKkm ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabel Hasil Nilai Siswa Riil dari Database */}
      <div className="soft-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
            <span className="text-xs font-semibold">Memuat data nilai dari Neon PostgreSQL...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Belum ada data pengerjaan ujian siswa untuk sesi ini.
          </div>
        ) : (
          <>
            {/* Tampilan Kartu Mobile (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredStudents.map((s, idx) => {
                const isPassed = s.score >= kkm;
                return (
                  <div key={s.id || s.nis || idx} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-slate-800 truncate">
                            {s.name}
                          </h4>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-700">{s.class}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{s.nis}</span>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-extrabold text-base px-3 py-1 rounded-xl shrink-0 ${
                          isPassed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {s.score}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 font-bold">
                          Benar: {s.correct}
                        </span>
                        <span className="text-rose-500 font-bold">
                          Salah: {s.wrong}
                        </span>
                        <span className="text-slate-400 font-mono">
                          KKM {kkm}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isPassed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPassed ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        ></span>
                        <span>{isPassed ? "Tuntas" : "Belum Tuntas"}</span>
                      </span>
                    </div>

                    {enableViewAnswers && (
                      <button
                        type="button"
                        onClick={() => handleOpenDetailAnswers(s.id)}
                        className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Hasil Jawaban</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tabel Desktop (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Kelas & Jurusan</th>
                    <th className="py-3.5 px-4 text-center">Benar</th>
                    <th className="py-3.5 px-4 text-center">Salah</th>
                    <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3.5 px-4 text-center">Minimal KKM</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    {enableViewAnswers && (
                      <th className="py-3.5 px-4 text-center">Hasil Jawaban</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s, idx) => {
                    const isPassed = s.score >= kkm;
                    return (
                      <tr key={s.id || s.nis || idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.nis}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {s.class}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">
                          {s.correct}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-rose-500">
                          {s.wrong}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg ${
                              isPassed
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {s.score}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-500">
                          {kkm}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              isPassed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPassed ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            ></span>
                            <span>{isPassed ? "Tuntas" : "Belum Tuntas"}</span>
                          </span>
                        </td>
                        {enableViewAnswers && (
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailAnswers(s.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Jawaban</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 5. Modal Detail Hasil Jawaban Soal yang Benar dan Salah */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Detail Hasil Jawaban Soal — {detailData?.studentName || "Memuat..."}
                </h3>
                <p className="text-xs text-slate-500">
                  {detailData ? `${detailData.studentClass} • ${detailData.examTitle}` : "Mengambil rincian jawaban dari database..."}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isLoadingDetail ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500 mb-2" />
                  <span className="text-xs font-semibold">Memuat rincian jawaban benar & salah...</span>
                </div>
              ) : !detailData ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Gagal memuat rincian jawaban siswa.
                </div>
              ) : (
                <>
                  {/* Ringkasan Nilai & KKM di Modal */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-center">
                      <div className="text-[10px] font-bold text-sky-700 uppercase">Nilai Akhir</div>
                      <div className="text-xl font-extrabold text-sky-700 font-mono mt-0.5">
                        {detailData.score}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Minimal KKM</div>
                      <div className="text-xl font-extrabold text-slate-700 font-mono mt-0.5">
                        {kkm}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">Soal Benar</div>
                      <div className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5">
                        {detailData.correctCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                      <div className="text-[10px] font-bold text-rose-700 uppercase">Soal Salah</div>
                      <div className="text-xl font-extrabold text-rose-600 font-mono mt-0.5">
                        {detailData.wrongCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center col-span-2 sm:col-span-1">
                      <div className="text-[10px] font-bold text-amber-700 uppercase">Status</div>
                      <div
                        className={`text-xs font-extrabold mt-1.5 ${
                          detailData.score >= kkm ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {detailData.score >= kkm ? "Tuntas" : "Belum Tuntas"}
                      </div>
                    </div>
                  </div>

                  {/* Filter Benar / Salah */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-600">
                      Rincian Butir Soal ({filteredDetailAnswers.length} dari {detailData.totalQuestions} Soal)
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {(
                        [
                          { id: "ALL", label: "Semua" },
                          { id: "BENAR", label: `Benar (${detailData.correctCount})` },
                          { id: "SALAH", label: `Salah (${detailData.wrongCount})` },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDetailFilter(tab.id)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                            detailFilter === tab.id
                              ? "bg-white text-slate-800 shadow-xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daftar Soal & Jawaban */}
                  <div className="space-y-3">
                    {filteredDetailAnswers.map((item) => (
                      <div
                        key={item.soalId}
                        className={`p-4 rounded-2xl border ${
                          item.status === "BENAR"
                            ? "bg-emerald-50/30 border-emerald-200"
                            : item.status === "SALAH"
                            ? "bg-rose-50/30 border-rose-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {item.nomorUrut}
                            </span>
                            <p className="text-xs font-bold text-slate-800 leading-relaxed">
                              {item.pertanyaan}
                            </p>
                          </div>
                          {item.status === "BENAR" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold shrink-0">
                              <Check className="w-3 h-3" /> Benar
                            </span>
                          ) : item.status === "SALAH" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold shrink-0">
                              <XCircle className="w-3 h-3" /> Salah
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold shrink-0">
                              <HelpCircle className="w-3 h-3" /> Kosong
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-8">
                          {item.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                                opt.isCorrect && opt.isSelected
                                  ? "bg-emerald-100/80 border-emerald-400 text-emerald-900 font-bold"
                                  : opt.isCorrect
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                                  : opt.isSelected
                                  ? "bg-rose-100/80 border-rose-400 text-rose-900 font-bold"
                                  : "bg-white border-slate-200 text-slate-600"
                              }`}
                            >
                              <span>
                                <strong className="mr-1.5">{opt.label}.</strong>
                                {opt.text}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {opt.isSelected && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">
                                    Dipilih
                                  </span>
                                )}
                                {opt.isCorrect && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                                    Kunci
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
