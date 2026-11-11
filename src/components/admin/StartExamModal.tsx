"use client";

import React, { useState, useEffect } from "react";
import { BankFolderItem, useCBTAdminStore } from "@/stores/cbt-admin";
import {
  Play,
  X,
  Key,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Plus,
  Loader2,
  Clock,
  Users,
} from "lucide-react";

interface StartExamModalProps {
  folder: BankFolderItem;
  onClose: () => void;
}

export default function StartExamModal({ folder, onClose }: StartExamModalProps) {
  const {
    exams,
    activeExamId,
    availableClasses,
    addNewClass,
    createExam,
    startExamWithBankFolder,
    showToast,
  } = useCBTAdminStore();

  const [mode, setMode] = useState<"existing" | "new">(
    exams.length > 0 ? "existing" : "new"
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    activeExamId || exams[0]?.id || ""
  );
  const [tokenInput, setTokenInput] = useState<string>(() => {
    const initialExam =
      exams.find((e) => e.id === (activeExamId || exams[0]?.id)) || exams[0];
    return initialExam?.token && initialExam.token !== "BELUM_DIATUR"
      ? initialExam.token
      : "CBT-" + Math.floor(1000 + Math.random() * 9000);
  });
  const [autoRotateToken, setAutoRotateToken] = useState<boolean>(false);

  // Quick-create new session fields
  const [newTitle, setNewTitle] = useState(`Ujian — ${folder.judul}`);
  const [newSubject, setNewSubject] = useState(folder.mapel || "Pendidikan Pancasila");
  const [newDuration, setNewDuration] = useState(90);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    availableClasses.length > 0 ? [availableClasses[0]] : []
  );
  const [newClassInput, setNewClassInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "existing" && selectedExamId) {
      const ex = exams.find((e) => e.id === selectedExamId);
      if (ex?.token && ex.token !== "BELUM_DIATUR") {
        setTokenInput(ex.token);
      }
    }
  }, [selectedExamId, mode, exams]);

  const handleRandomToken = () => {
    setTokenInput("CBT-" + Math.floor(1000 + Math.random() * 9000));
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handleAddQuickClass = async () => {
    const name = newClassInput.trim();
    if (!name) return;
    await addNewClass(name);
    if (!selectedClasses.includes(name)) {
      setSelectedClasses((prev) => [...prev, name]);
    }
    setNewClassInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim().toUpperCase();
    if (!cleanToken) {
      showToast("Token ujian wajib diisi.", "error");
      return;
    }
    if (folder.totalSoal === 0) {
      showToast(
        `Folder "${folder.judul}" masih kosong (0 soal). Buat atau import soal terlebih dahulu.`,
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let targetExamId = selectedExamId;

      if (mode === "new") {
        if (!newTitle.trim() || selectedClasses.length === 0) {
          showToast(
            "Judul ujian baru dan minimal 1 target kelas wajib diisi.",
            "error"
          );
          setIsSubmitting(false);
          return;
        }
        const createdId = await createExam({
          title: newTitle.trim(),
          subject: newSubject.trim() || folder.mapel || "Pendidikan Pancasila",
          targetClasses: selectedClasses,
          durationMinutes: newDuration,
          token: cleanToken,
          bankSoalId: folder.id,
          autoRotateToken,
          status: "AKTIF",
        });
        if (!createdId) {
          setIsSubmitting(false);
          return;
        }
        targetExamId = createdId;
      }

      if (!targetExamId) {
        showToast("Pilih sesi ujian terlebih dahulu.", "error");
        setIsSubmitting(false);
        return;
      }

      const ok = await startExamWithBankFolder({
        ujianId: targetExamId,
        bankSoalId: folder.id,
        token: cleanToken,
        autoRotateToken,
      });

      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Start Ujian — Gunakan Folder Soal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <strong className="text-slate-700">{folder.judul}</strong>
                <span>•</span>
                <span className="font-bold text-indigo-600">{folder.totalSoal} File Soal</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Switch: Pilih Sesi yang Ada vs Buat Sesi Baru */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                mode === "existing"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pilih Sesi Ujian Tersedia ({exams.length})
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === "new"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Sesi Baru Cepat</span>
            </button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                1. Pilih Sesi Ujian yang Akan Diaktifkan / Menggunakan Soal Ini
              </label>
              {exams.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Belum ada sesi ujian. Gunakan tab <strong>Buat Sesi Baru Cepat</strong> di atas.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {exams.map((ex) => {
                    const isSelected = selectedExamId === ex.id;
                    return (
                      <label
                        key={ex.id}
                        className={`flex items-start justify-between gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "bg-emerald-50/70 border-emerald-400"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="selectedExamSession"
                            checked={isSelected}
                            onChange={() => setSelectedExamId(ex.id)}
                            className="mt-1 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {ex.title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {ex.durationMinutes}m
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3" />{" "}
                                {ex.targetClasses.join(", ") || "Semua kelas"}
                              </span>
                            </div>
                            {ex.bankSoalJudul && (
                              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                                Soal saat ini: {ex.bankSoalJudul}
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                            ex.status === "AKTIF"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {ex.status}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Nama Sesi Ujian</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: PAS Ganjil — Kelas XII"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">Target Kelas Peserta</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableClasses.map((cls) => {
                    const selected = selectedClasses.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClass(cls)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          selected
                            ? "bg-sky-600 text-white border-sky-600"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Tambah kelas baru (mis. X DKV)..."
                    value={newClassInput}
                    onChange={(e) => setNewClassInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickClass}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-[11px] font-bold"
                  >
                    + Kelas
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pengaturan Token Ujian */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-sky-600" />
              <span>2. Atur Token Ujian yang Akan Digunakan</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="Contoh: PANCASILA-12 atau CBT-4821"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-sky-300 bg-white text-sm font-mono font-extrabold text-sky-700 tracking-wider uppercase focus:outline-none focus:border-sky-500"
                required
              />
              <button
                type="button"
                onClick={handleRandomToken}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Acak</span>
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={autoRotateToken}
                onChange={(e) => setAutoRotateToken(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>
                Aktifkan rotasi acak token otomatis setiap 10 menit (kosongkan centang agar token kustom di atas tetap berlaku).
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (mode === "existing" && !selectedExamId)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-extrabold transition shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengaktifkan Ujian...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mulai & Aktifkan Sesi Ujian</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
