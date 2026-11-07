"use client";

import React, { useState } from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import {
  Calendar,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  Tag,
  Key,
} from "lucide-react";

export default function JadwalView() {
  const {
    exams,
    createExam,
    availableClasses,
    addNewClass,
  } = useCBTAdminStore();

  const [isCreating, setIsCreating] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [subject, setSubject] = useState("Matematika");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["XII MIPA 1"]);
  const [newClassInput, setNewClassInput] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [tokenInput, setTokenInput] = useState("EXM-" + Math.floor(1000 + Math.random() * 9000));

  const toggleClass = (className: string) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const handleAddNewClass = () => {
    if (!newClassInput.trim()) return;
    const name = newClassInput.trim();
    addNewClass(name);
    if (!selectedClasses.includes(name)) {
      setSelectedClasses([...selectedClasses, name]);
    }
    setNewClassInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || selectedClasses.length === 0) return;

    createExam({
      title: examTitle.trim(),
      subject,
      targetClasses: selectedClasses,
      token: tokenInput,
      durationMinutes,
      totalQuestions: 40,
      status: "AKTIF",
    });

    setIsCreating(false);
    setExamTitle("");
  };

  return (
    <div className="space-y-6">
      {/* Header Jadwal & Ujian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Jadwal & Paket Pelaksanaan Ujian
          </h2>
          <p className="text-xs text-slate-500">
            Konfigurasi nama ujian, target kelas mandiri, durasi, dan token akses.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Tutup Form" : "+ Buat Ujian Baru"}</span>
        </button>
      </div>

      {/* Form Buat Ujian Baru (Input Mandiri Nama Ujian & Kelas) */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="soft-card p-6 border-2 border-sky-500/20 bg-sky-50/10">
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h3 className="font-bold text-slate-800 text-sm">
              Form Penerbitan Ujian Baru (Input Mandiri)
            </h3>
            <p className="text-xs text-slate-400">
              Guru dapat bebas memberi nama ujian dan memilih atau mengetik nama kelas target.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* 1. Nama Ujian Bebas */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Nama / Judul Ujian (Bebas Input)
              </label>
              <input
                type="text"
                placeholder="Contoh: Penilaian Harian Matematika Wajib Bab 3 atau PTS Semester Ganjil"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
            </div>

            {/* 2. Mata Pelajaran */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            {/* 3. Durasi Pengerjaan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Durasi Pengerjaan (Menit)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-sky-500"
                  required
                />
                <span className="text-xs font-semibold text-slate-500">Menit</span>
              </div>
            </div>

            {/* 4. Token Ujian */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Token Akses Ujian
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-sky-600 focus:outline-none focus:border-sky-500 uppercase"
                  required
                />
                <button
                  type="button"
                  onClick={() => setTokenInput("EXM-" + Math.floor(1000 + Math.random() * 9000))}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap"
                >
                  Acak
                </button>
              </div>
            </div>
          </div>

          {/* 5. Pemilihan & Input Kelas Mandiri */}
          <div className="space-y-2 mb-6 p-4 rounded-xl bg-white border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Kelas Peserta Ujian (Bisa pilih checklist atau ketik kelas baru)
            </label>

            {/* Checklist Kelas yang Ada */}
            <div className="flex flex-wrap gap-2 pt-1">
              {availableClasses.map((cls) => {
                const isSelected = selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => toggleClass(cls)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{cls}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Mandiri Kelas Baru */}
            <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Ketik nama kelas baru langsung di sini (contoh: XII RPL 2)..."
                value={newClassInput}
                onChange={(e) => setNewClassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewClass();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddNewClass}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition whitespace-nowrap"
              >
                + Tambah & Pilih Kelas
              </button>
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm"
            >
              Terbitkan Ujian Sekarang
            </button>
          </div>
        </form>
      )}

      {/* Daftar Paket Ujian */}
      {exams.length === 0 ? (
        <div className="soft-card p-12 text-center text-slate-400 text-xs font-semibold">
          Belum ada jadwal ujian yang terdaftar. Klik "+ Buat Ujian Baru" di atas untuk membuat ujian baru.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map((ex) => (
          <div key={ex.id} className="soft-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase">
                  {ex.subject}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1">
                  {ex.title}
                </h3>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  ex.status === "AKTIF"
                    ? "bg-emerald-100 text-emerald-700 animate-pulse"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {ex.status}
              </span>
            </div>

            {/* Rincian Ujian */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Durasi: {ex.durationMinutes} Menit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-bold text-sky-600">
                  Token: {ex.token}
                </span>
              </div>
            </div>

            {/* Target Kelas */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400">
                Target Kelas Peserta:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ex.targetClasses.map((cls) => (
                  <span
                    key={cls}
                    className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

