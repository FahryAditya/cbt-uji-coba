"use client";

import React from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import {
  Users,
  UserX,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  AlertOctagon,
  Search,
  CheckCircle2,
  FileX,
} from "lucide-react";

export default function ProctoringView() {
  const {
    students,
    kpi,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    resetStudentLogin,
    unlockStudent,
    resetStudentAnswers,
    addStudentTime,
    warnStudent,
  } = useCBTAdminStore();

  // Filter students based on search and status
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery) ||
      s.class.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (filterStatus === "all") return true;
    if (filterStatus === "online") return s.status === "online";
    if (filterStatus === "not_started") return !s.isLoggedIn || s.status === "offline";
    if (filterStatus === "locked") return s.isLocked || s.status === "locked" || s.violations >= 3;
    if (filterStatus === "completed") return s.status === "completed";
    return true;
  });

  const activeCount = kpi?.activeStudents ?? students.filter((s) => s.status === "online").length;
  const notLoggedInCount = kpi?.notLoggedInCount ?? students.filter((s) => !s.isLoggedIn || s.status === "offline").length;
  const lockedCount = kpi?.lockedCount ?? students.filter((s) => s.isLocked || s.status === "locked" || s.violations >= 3).length;
  const completedCount = kpi?.completedCount ?? students.filter((s) => s.status === "completed").length;
  const totalCount = kpi?.totalStudents ?? students.length;

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Siswa Aktif Mengerjakan */}
        <div className="soft-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Siswa Aktif Ujian
            </span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tabular-digits">
              {activeCount}/{totalCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Online</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Sedang aktif mengerjakan di ruang ujian
          </div>
        </div>

        {/* Card 2: Siswa Belum Login */}
        <div className="soft-card p-5 border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Belum Login
            </span>
            <UserX className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-700 tabular-digits">
              {notLoggedInCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Belum login / belum memulai sesi ujian
          </div>
        </div>

        {/* Card 3: Siswa Terkunci / Pelanggaran */}
        <div className="soft-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ujian Terkunci (≥3x Pindah Tab)
            </span>
            <Lock className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tabular-digits">
              {lockedCount}
            </span>
            <span className="text-xs font-semibold text-rose-600">Perlu Intervensi</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Otomatis diblokir setelah 3x berpindah tab browser
          </div>
        </div>

        {/* Card 4: Siswa Selesai */}
        <div className="soft-card p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Selesai Mengerjakan
            </span>
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600 tabular-digits">
              {completedCount}
            </span>
            <span className="text-xs font-semibold text-blue-600">Selesai</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Jawaban tersimpan dan telah dikoreksi otomatis
          </div>
        </div>
      </div>

      {/* 2. Proctoring Table & Controls */}
      <div className="soft-card p-4 sm:p-6">
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
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
          </div>

          {/* Filter Pills dengan Material Icons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                {
                  id: "all",
                  label: "Semua Peserta",
                  icon: "group",
                  iconColor: "text-slate-500",
                },
                {
                  id: "online",
                  label: "Sedang Mengerjakan",
                  icon: "radio_button_checked",
                  iconColor: "text-emerald-500",
                },
                {
                  id: "not_started",
                  label: "Belum Login",
                  icon: "radio_button_unchecked",
                  iconColor: "text-slate-400",
                },
                {
                  id: "locked",
                  label: "Terkunci / Curiga",
                  icon: "gpp_maybe",
                  iconColor: "text-rose-500",
                },
                {
                  id: "completed",
                  label: "Selesai",
                  icon: "check_circle",
                  iconColor: "text-blue-500",
                },
              ] as const
            ).map((filter) => {
              const active = filterStatus === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span
                    className={`material-symbols-rounded text-[16px] ${
                      active ? "text-white" : filter.iconColor
                    }`}
                  >
                    {filter.icon}
                  </span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tampilan Kartu Mobile (< md) */}
        <div className="md:hidden mt-4 space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs font-semibold">
              Tidak ada siswa yang sesuai dengan filter atau pencarian saat ini.
            </div>
          ) : (
            filteredStudents.map((s) => {
              const progressPct = s.totalQ > 0 ? Math.round((s.progress / s.totalQ) * 100) : 0;
              const isLockedStudent = s.isLocked || s.status === "locked" || s.violations >= 3;
              const studentIdParam = s.siswaId || s.id;

              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-2xl border space-y-3 ${
                    isLockedStudent
                      ? "bg-rose-50/60 border-rose-200"
                      : "bg-white border-slate-200/80"
                  }`}
                >
                  {/* Header Kartu: Nama, Kelas, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                          isLockedStudent
                            ? "bg-rose-100 text-rose-700 ring-2 ring-rose-400"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate flex items-center gap-1">
                          <span className="truncate">{s.name}</span>
                          {isLockedStudent && <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {s.class}
                          </span>
                          <span className="font-mono text-slate-400 truncate">NIS: {s.nis}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isLockedStudent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                          <Lock className="w-3 h-3" />
                          Terkunci
                        </span>
                      ) : s.status === "online" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Sedang Ujian
                        </span>
                      ) : s.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Selesai
                        </span>
                      ) : s.status === "idle" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Idle
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Belum Login
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progres Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Progres: {s.progress}/{s.totalQ} Soal</span>
                      <span className={progressPct === 100 ? "text-emerald-600 font-bold" : "text-sky-600 font-bold"}>
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

                  {/* Info Pelanggaran & Sisa Waktu */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      {s.violations >= 3 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          <span className="material-symbols-rounded text-[14px] text-rose-600">gpp_maybe</span>
                          <span>{s.violations}x (TERKUNCI)</span>
                        </span>
                      ) : s.violations === 2 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                          <span className="material-symbols-rounded text-[14px] text-orange-600">warning</span>
                          <span>2x (Hampir Kunci)</span>
                        </span>
                      ) : s.violations === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <span className="material-symbols-rounded text-[14px] text-amber-600">warning</span>
                          <span>1x Keluar</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">0x Pelanggaran</span>
                      )}
                    </div>

                    <div
                      className={`font-mono font-bold text-xs ${
                        s.timeLeft === "00:00:00" ? "text-slate-400" : "text-slate-700"
                      }`}
                    >
                      ⏱ {s.timeLeft}
                    </div>
                  </div>

                  {/* Aksi Intervensi Admin */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    {isLockedStudent && (
                      <button
                        onClick={async () => {
                          await unlockStudent(studentIdParam, s.sesiId);
                        }}
                        className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Buka Kunci</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        const confirmReset = window.confirm(
                          `Perhatian: Apakah Anda yakin ingin mereset seluruh jawaban siswa "${s.name}"? Semua jawaban yang telah dikerjakan akan dihapus dan nilai diset ulang ke 0.`
                        );
                        if (confirmReset) {
                          await resetStudentAnswers(studentIdParam, s.sesiId);
                        }
                      }}
                      title="Reset Seluruh Jawaban Siswa"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    >
                      <FileX className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        resetStudentLogin(studentIdParam, s.sesiId);
                      }}
                      title="Reset Login (Siswa berganti perangkat)"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        addStudentTime(studentIdParam, 10);
                      }}
                      title="Tambah Waktu +10 Menit"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        warnStudent(studentIdParam);
                      }}
                      title="Kirim Peringatan Langsung"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition"
                    >
                      <AlertOctagon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tabel Data Siswa Realtime Desktop (>= md) */}
        <div className="hidden md:block overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Siswa</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Status Sesi</th>
                <th className="py-3 px-3">Progres Soal</th>
                <th className="py-3 px-3">Riwayat Pelanggaran</th>
                <th className="py-3 px-3">Sisa Waktu</th>
                <th className="py-3 px-3 text-right">Aksi Intervensi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    Tidak ada siswa yang sesuai dengan filter atau pencarian saat ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const progressPct = s.totalQ > 0 ? Math.round((s.progress / s.totalQ) * 100) : 0;
                  const isLockedStudent = s.isLocked || s.status === "locked" || s.violations >= 3;
                  const studentIdParam = s.siswaId || s.id;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLockedStudent ? "bg-rose-50/40" : ""
                      }`}
                    >
                      {/* Nama & Avatar */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${
                            isLockedStudent
                              ? "bg-rose-100 text-rose-700 ring-2 ring-rose-400"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {s.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              {s.name}
                              {isLockedStudent && (
                                <Lock className="w-3.5 h-3.5 text-rose-600 inline" />
                              )}
                            </div>
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

                      {/* Status Sesi */}
                      <td className="py-3.5 px-3">
                        {isLockedStudent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                            <Lock className="w-3 h-3" />
                            Terkunci
                          </span>
                        ) : s.status === "online" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sedang Ujian
                          </span>
                        ) : s.status === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Selesai
                          </span>
                        ) : s.status === "idle" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Idle
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Belum Login
                          </span>
                        )}
                      </td>

                      {/* Progres Soal */}
                      <td className="py-3.5 px-3">
                        <div className="w-32">
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

                      {/* Riwayat Pelanggaran (Tiered) */}
                      <td className="py-3.5 px-3">
                        {s.violations >= 3 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <span className="material-symbols-rounded text-[15px] text-rose-600">
                              gpp_maybe
                            </span>
                            <span>{s.violations}x (TERKUNCI)</span>
                          </span>
                        ) : s.violations === 2 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            <span className="material-symbols-rounded text-[15px] text-orange-600">
                              warning
                            </span>
                            <span>2x (Hampir Kunci)</span>
                          </span>
                        ) : s.violations === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                            <span className="material-symbols-rounded text-[15px] text-amber-600">
                              warning
                            </span>
                            <span>1x Keluar</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            0x (Bersih)
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

                      {/* Kontrol Intervensi Admin */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* 1. Tombol Buka Kunci Ujian */}
                          {isLockedStudent && (
                            <button
                              onClick={async () => {
                                await unlockStudent(studentIdParam, s.sesiId);
                              }}
                              title="Buka Kunci Ujian Siswa"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Buka Kunci</span>
                            </button>
                          )}

                          {/* 2. Tombol Reset Jawaban */}
                          <button
                            onClick={async () => {
                              const confirmReset = window.confirm(
                                `Perhatian: Apakah Anda yakin ingin mereset seluruh jawaban siswa "${s.name}"? Semua jawaban yang telah dikerjakan akan dihapus dan nilai diset ulang ke 0.`
                              );
                              if (confirmReset) {
                                await resetStudentAnswers(studentIdParam, s.sesiId);
                              }
                            }}
                            title="Reset Seluruh Jawaban Siswa"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          >
                            <FileX className="w-4 h-4" />
                          </button>

                          {/* 3. Tombol Reset Sesi Login */}
                          <button
                            onClick={() => {
                              resetStudentLogin(studentIdParam, s.sesiId);
                            }}
                            title="Reset Login (Siswa berganti perangkat)"
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {/* 4. Tambah Waktu */}
                          <button
                            onClick={() => {
                              addStudentTime(studentIdParam, 10);
                            }}
                            title="Tambah Waktu +10 Menit"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* 5. Kirim Peringatan */}
                          <button
                            onClick={() => {
                              warnStudent(studentIdParam);
                            }}
                            title="Kirim Peringatan Langsung"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition"
                          >
                            <AlertOctagon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

