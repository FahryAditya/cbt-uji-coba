"use client";

import React, { useState } from "react";
import { BankFolderItem, useCBTAdminStore } from "@/stores/cbt-admin";
import {
  StopCircle,
  X,
  FolderOpen,
  AlertTriangle,
  Key,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface EndExamModalProps {
  folder: BankFolderItem;
  onClose: () => void;
}

export default function EndExamModal({ folder, onClose }: EndExamModalProps) {
  const { finishExamSession, showToast } = useCBTAdminStore();

  const activeExams = (folder.usedInExams || []).filter(
    (u) => u.status === "AKTIF"
  );

  const [selectedExamId, setSelectedExamId] = useState<string>(
    activeExams[0]?.id || ""
  );
  const [isFinishing, setIsFinishing] = useState(false);

  const handleConfirmEnd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      showToast("Tidak ada sesi ujian aktif yang dipilih.", "error");
      return;
    }

    setIsFinishing(true);
    const ok = await finishExamSession(selectedExamId);
    setIsFinishing(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-rose-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <StopCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Akhiri Sesi Ujian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <strong className="text-slate-700">{folder.judul}</strong>
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

        <form onSubmit={handleConfirmEnd} className="space-y-4">
          {activeExams.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              Tidak ada sesi ujian berstatus <strong>AKTIF</strong> pada folder ini.
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Sesi Ujian Aktif yang Akan Diakhiri:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeExams.map((ex) => {
                  const isSelected = selectedExamId === ex.id;
                  return (
                    <label
                      key={ex.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "bg-rose-50/70 border-rose-300"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="radio"
                          name="endExamSession"
                          checked={isSelected}
                          onChange={() => setSelectedExamId(ex.id)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {ex.judul}
                          </div>
                          {ex.token && (
                            <div className="text-[11px] font-mono font-bold text-sky-600 flex items-center gap-1 mt-0.5">
                              <Key className="w-3 h-3" /> Token: {ex.token}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                        AKTIF
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Informasi Efek Akhiri Sesi */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed text-[11px]">
              <p className="font-bold">Konsekuensi mengakhiri sesi ujian:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>
                  Status ujian berubah menjadi <strong>SELESAI</strong> dan token tidak bisa dipakai login baru.
                </li>
                <li>
                  Siswa yang masih berstatus <strong>Sedang Mengerjakan</strong> atau{" "}
                  <strong>Terkunci</strong> akan otomatis dikumpulkan &amp; dinilai dari jawaban tersimpan.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isFinishing}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isFinishing || !selectedExamId}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-extrabold transition shadow-sm"
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengakhiri Sesi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ya, Akhiri Sesi Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
