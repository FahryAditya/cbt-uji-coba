"use client";

import React, { useState } from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  RotateCcw,
  PlusCircle,
  AlertOctagon,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function ProctoringView() {
  const {
    students,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    resetStudentLogin,
    addStudentTime,
    warnStudent,
  } = useCBTAdminStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter students based on search and status
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery) ||
      s.class.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (filterStatus === "all") return true;
    if (filterStatus === "online") return s.status === "online";
    if (filterStatus === "idle") return s.status === "idle";
    if (filterStatus === "flagged") return s.violations > 0;
    return true;
  });

  const totalViolations = students.reduce((acc, curr) => acc + curr.violations, 0);
  const activeCount = students.filter((s) => s.status === "online").length;

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Siswa Aktif */}
        <div className="soft-card p-5 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Siswa Aktif Ujian
            </span>
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tabular-digits">
              {activeCount}/{students.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Online</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Terkoneksi pada ruang ujian saat ini
          </div>
        </div>

        {/* Card 2: Rata-Rata Progres */}
        <div className="soft-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Rata-Rata Progres
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tabular-digits">
              68%
            </span>
            <span className="text-xs font-semibold text-sky-600">27/40 Soal</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Estimasi selesai tepat waktu
          </div>
        </div>

        {/* Card 3: Pelanggaran Terdeteksi */}
        <div className="soft-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Pelanggaran Terdeteksi
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tabular-digits">
              {totalViolations}
            </span>
            <span className="text-xs font-semibold text-amber-600">Peringatan</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Terdeteksi berpindah tab / keluar fullscreen
          </div>
        </div>

        {/* Card 4: Sisa Waktu Ujian */}
        <div className="soft-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Sisa Waktu Sesi
            </span>
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tabular-digits font-mono">
              01:50:21
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Sesi berakhir otomatis pada pukul 12:00
          </div>
        </div>
      </div>

      {/* 2. Proctoring Table & Controls */}
      <div className="soft-card p-6">
        {/* Header Tabel: Search & Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, NISN, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: "all", label: "Semua Siswa" },
                { id: "online", label: "🟢 Online" },
                { id: "idle", label: "🟡 Idle" },
                { id: "flagged", label: "⚠️ Curiga Tab" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === filter.id
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel Data Siswa Realtime */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Siswa</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Progres Soal</th>
                <th className="py-3 px-3">Pelanggaran</th>
                <th className="py-3 px-3">Sisa Waktu</th>
                <th className="py-3 px-3 text-right">Aksi Intervensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.map((s) => {
                const progressPct = Math.round((s.progress / s.totalQ) * 100);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nama & Avatar */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {s.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            NIS: {s.nis}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kelas */}
                    <td className="py-3.5 px-3">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {s.class}
                      </span>
                    </td>

                    {/* Status Koneksi */}
                    <td className="py-3.5 px-3">
                      {s.status === "online" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      )}
                      {s.status === "idle" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Idle
                        </span>
                      )}
                      {s.status === "offline" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Offline
                        </span>
                      )}
                    </td>

                    {/* Progres Soal */}
                    <td className="py-3.5 px-3">
                      <div className="w-36">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                          <span>
                            {s.progress}/{s.totalQ} Soal
                          </span>
                          <span
                            className={`font-bold ${
                              progressPct === 100
                                ? "text-emerald-600"
                                : "text-sky-600"
                            }`}
                          >
                            {progressPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progressPct === 100 ? "bg-emerald-500" : "bg-sky-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Pelanggaran */}
                    <td className="py-3.5 px-3">
                      {s.violations > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-800">
                          ⚠️ {s.violations}x Keluar
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Bersih
                        </span>
                      )}
                    </td>

                    {/* Sisa Waktu */}
                    <td
                      className={`py-3.5 px-3 font-mono font-bold text-xs ${
                        s.timeLeft === "00:00:00"
                          ? "text-slate-400"
                          : "text-slate-700"
                      }`}
                    >
                      {s.timeLeft}
                    </td>

                    {/* Quick Action Buttons */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            resetStudentLogin(s.id);
                            showToast(
                              `Sesi login ${s.name} berhasil di-reset. Siswa dapat login kembali di perangkat baru.`
                            );
                          }}
                          title="Reset Login (Siswa berganti perangkat)"
                          className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            addStudentTime(s.id, 10);
                            showToast(
                              `+10 Menit berhasil ditambahkan ke akun ${s.name}.`
                            );
                          }}
                          title="Tambah Waktu +10 Menit"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            warnStudent(s.id);
                            showToast(
                              `Peringatan pelanggaran dikirimkan ke layar ${s.name}!`
                            );
                          }}
                          title="Kirim Peringatan Langsung"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                        >
                          <AlertOctagon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

