"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  Search,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

export default function RekapNilaiView() {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [kkm, setKkm] = useState(75);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  const rawStudents = [
    { nis: "210402", name: "Bunga Citra Lestari", class: "XII MIPA 1", correct: 38, wrong: 2, score: 95.0 },
    { nis: "210405", name: "Fajar Pratama", class: "XII MIPA 2", correct: 36, wrong: 4, score: 90.0 },
    { nis: "210404", name: "Eka Putri Rahayu", class: "XII MIPA 1", correct: 34, wrong: 6, score: 85.0 },
    { nis: "210401", name: "Ahmad Fauzi", class: "XII MIPA 1", correct: 32, wrong: 8, score: 80.0 },
    { nis: "210408", name: "Indah Permatasari", class: "XII MIPA 2", correct: 30, wrong: 10, score: 75.0 },
    { nis: "210403", name: "Dimas Anggara", class: "XII MIPA 2", correct: 24, wrong: 16, score: 60.0 },
  ];

  // Filter siswa
  const filteredStudents = rawStudents.filter((s) => {
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
  const avgScore = totalCount > 0 ? (scores.reduce((a, b) => a + b, 0) / totalCount).toFixed(1) : "0";
  const highestScore = totalCount > 0 ? Math.max(...scores) : 0;
  const lowestScore = totalCount > 0 ? Math.min(...scores) : 0;
  const passedStudents = filteredStudents.filter((s) => s.score >= kkm).length;
  const failedStudents = totalCount - passedStudents;
  const passPercentage = totalCount > 0 ? Math.round((passedStudents / totalCount) * 100) : 0;

  const handleExportExcel = async () => {
    try {
      // Hubungkan ke endpoint export ExcelJS di backend
      const res = await fetch("http://localhost:5000/api/nilai/ex_1/export-excel");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Rekap_Nilai_PAS_Matematika_KKM_${kkm}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3500);
        return;
      }
    } catch {
      // Fallback CSV jika server backend offline
    }

    const headers = ["No.", "Nama Siswa", "Kelas", "Jawaban Benar", "Jawaban Salah", "Nilai Akhir", "KKM", "Status Ketuntasan"];
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
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_PAS_Matematika_KKM_${kkm}.csv`);
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
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Laporan Hasil Evaluasi Ujian
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 mt-1">
            Dashboard Rekapitulasi Nilai & Analisis KKM
          </h2>
          <p className="text-xs text-slate-500">
            Penilaian otomatis, komparasi standar KKM kelulusan, dan ekspor spreadsheet resmi.
          </p>
        </div>

        {/* Tombol Export Excel */}
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export ke Excel (.xlsx)</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            File Rekapitulasi Nilai (Format ExcelJS ber-styling warna KKM) berhasil diunduh!
          </span>
        </div>
      )}

      {/* 2. Pengaturan KKM oleh Admin & KPI Statistik Ketuntasan */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Kontrol KKM Admin */}
        <div className="soft-card p-4 border-l-4 border-l-sky-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Standar KKM
            </span>
            <SlidersHorizontal className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              min="0"
              max="100"
              value={kkm}
              onChange={(e) => setKkm(Number(e.target.value) || 75)}
              className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono font-extrabold text-xl text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <span className="text-xs font-bold text-slate-400">Poin</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Diatur mandiri oleh Admin/Guru
          </div>
        </div>

        {/* Rata-Rata Nilai */}
        <div className="soft-card p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Rata-Rata
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 tabular-digits mt-1">
            {avgScore}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Tertinggi: {highestScore} • Terendah: {lowestScore}
          </div>
        </div>

        {/* Siswa Lulus KKM (Hijau) */}
        <div className="soft-card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/20">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Tuntas KKM
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tabular-digits mt-1">
            {passedStudents}{" "}
            <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-2">
            Nilai &ge; {kkm} (Lulus)
          </div>
        </div>

        {/* Siswa Belum Lulus (Merah) */}
        <div className="soft-card p-4 border-l-4 border-l-rose-500 bg-rose-50/20">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Belum Tuntas
            </span>
            <Users className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 tabular-digits mt-1">
            {failedStudents}{" "}
            <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-2">
            Nilai &lt; {kkm} (Remedial)
          </div>
        </div>

        {/* Persentase Kelulusan */}
        <div className="soft-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              % Ketuntasan
            </span>
            <span className="text-xs font-extrabold text-amber-600">{passPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all ${
                passPercentage >= 75 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${passPercentage}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Dari total {totalCount} peserta ujian
          </div>
        </div>
      </div>

      {/* 3. Filter dan Pencarian Tabel Nilai */}
      <div className="soft-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Kelas:
            </span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Seluruh Kelas</option>
              <option value="XII MIPA 1">XII MIPA 1</option>
              <option value="XII MIPA 2">XII MIPA 2</option>
            </select>
          </div>
        </div>

        {/* Tabel Data Rekapitulasi Nilai Lengkap dengan Penanda Warna KKM */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">No.</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3 text-center">Jawaban Benar</th>
                <th className="py-3 px-3 text-center">Jawaban Salah</th>
                <th className="py-3 px-3 text-center">Nilai Akhir</th>
                <th className="py-3 px-3 text-center">KKM</th>
                <th className="py-3 px-3 text-right">Status Ketuntasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((r, index) => {
                const isPassed = r.score >= kkm;
                return (
                  <tr key={r.nis} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">{r.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIS: {r.nis}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {r.class}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600">
                      {r.correct}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-rose-500">
                      {r.wrong}
                    </td>

                    {/* Nilai Akhir dengan Format Warna Berdasarkan KKM */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-base font-extrabold px-2.5 py-1 rounded-lg tabular-digits ${
                          isPassed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {r.score.toFixed(1)}
                      </span>
                    </td>

                    {/* Nilai KKM Acuan */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                      {kkm}
                    </td>

                    {/* Status Ketuntasan Otomatis */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                          isPassed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isPassed ? "Tuntas" : "Belum Tuntas"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
