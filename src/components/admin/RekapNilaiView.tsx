"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  Search,
  Filter,
  SlidersHorizontal,
  Loader2,
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

export default function RekapNilaiView() {
  const { activeExamId, availableClasses } = useCBTAdminStore();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [kkm, setKkm] = useState(75);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data nilai riil dari Backend API (NeonDB)
  useEffect(() => {
    let isMounted = true;
    async function loadNilai() {
      setIsLoading(true);
      try {
        const path = activeExamId ? `/api/nilai/${activeExamId}` : "/api/nilai";
        const res = await apiRequest<{ success: boolean; data: any }>(path);
        if (res.data && isMounted) {
          if (res.data.kkm) setKkm(res.data.kkm);
          if (Array.isArray(res.data.results)) {
            setStudents(res.data.results);
          }
        }
      } catch (err) {
        console.error("Gagal load nilai dari server:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadNilai();
    return () => {
      isMounted = false;
    };
  }, [activeExamId]);

  // Filter siswa berdasarkan pencarian dan kelas
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery);
    const matchClass = selectedClass === "all" || s.class === selectedClass;
    return matchSearch && matchClass;
  });

  // Urutkan nilai tertinggi ke terendah
  filteredStudents.sort((a, b) => b.score - a.score);

  // Perhitungan statistik KKM
  const totalCount = filteredStudents.length;
  const scores = filteredStudents.map((s) => s.score);
  const avgScore =
    totalCount > 0
      ? (scores.reduce((a, b) => a + b, 0) / totalCount).toFixed(1)
      : "0";
  const highestScore = totalCount > 0 ? Math.max(...scores) : 0;
  const lowestScore = totalCount > 0 ? Math.min(...scores) : 0;
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
      "KKM",
      "Status Ketuntasan",
    ];
    const rows = filteredStudents.map((r, i) => [
      i + 1,
      `"${r.name}"`,
      r.class,
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

  return (
    <div className="space-y-6">
      {/* 1. Header Rekap Nilai & Aksi Ekspor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Rekapitulasi Nilai & Ketuntasan Siswa
          </h2>
          <p className="text-xs text-slate-500">
            Perhitungan otomatis status KKM dan ekspor tabel administrasi sekolah (.xlsx).
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            File rekapitulasi nilai resmi (.xlsx) berhasil diunduh dari server!
          </span>
        </div>
      )}

      {/* 2. KPI Cards Statistik KKM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="soft-card p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Rata-Rata Nilai
            </span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-800 font-mono tabular-digits">
            {avgScore}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Tertinggi: <span className="font-bold text-emerald-600">{highestScore}</span> | Terendah: <span className="font-bold text-rose-500">{lowestScore}</span>
          </div>
        </div>

        <div className="soft-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Lulus KKM (≥{kkm})
            </span>
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono tabular-digits">
              {passedStudents}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {totalCount} Siswa</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">
            Telah memenuhi kriteria kelulusan
          </div>
        </div>

        <div className="soft-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Belum Tuntas (&lt;{kkm})
            </span>
            <Users className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono tabular-digits">
              {failedStudents}
            </span>
            <span className="text-xs font-semibold text-slate-400">Siswa Remedial</span>
          </div>
          <div className="text-[11px] text-rose-500 font-semibold mt-2">
            Memerlukan perbaikan / remedial
          </div>
        </div>

        <div className="soft-card p-5 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Persentase Ketuntasan
            </span>
            <span className="font-mono text-xs font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
              {passPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${passPercentage}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Target kelulusan kelas: 85%
          </div>
        </div>
      </div>

      {/* 3. Panel Filter & Pengaturan KKM */}
      <div className="soft-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa atau NIS..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
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

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-600">Ambang KKM:</span>
          <input
            type="number"
            min="0"
            max="100"
            value={kkm}
            onChange={(e) => setKkm(Number(e.target.value))}
            className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-sky-500"
          />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4 text-center">Benar</th>
                  <th className="py-3.5 px-4 text-center">Salah</th>
                  <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                  <th className="py-3.5 px-4 text-center">KKM</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
