"use client";

import React, { useState } from "react";
import { useCBTAdminStore, QuestionOption } from "@/stores/cbt-admin";
import {
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Eye,
  Check,
  FileText,
  Sparkles,
} from "lucide-react";

export default function BankSoalView() {
  const { questions, addQuestion, deleteQuestion } = useCBTAdminStore();

  const [isCreating, setIsCreating] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(2.5);

  // Dynamic custom options A, B, C, D, E
  const [options, setOptions] = useState<QuestionOption[]>([
    { label: "A", text: "", isCorrect: true },
    { label: "B", text: "", isCorrect: false },
    { label: "C", text: "", isCorrect: false },
    { label: "D", text: "", isCorrect: false },
    { label: "E", text: "", isCorrect: false },
  ]);

  const setCorrectOption = (index: number) => {
    setOptions(
      options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const handleOptionChange = (index: number, text: string) => {
    setOptions(
      options.map((opt, i) => (i === index ? { ...opt, text } : opt))
    );
  };

  const addOption = () => {
    if (options.length >= 6) return; // max F
    const nextLabel = String.fromCharCode(65 + options.length);
    setOptions([...options, { label: nextLabel, text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return; // minimal 2 pilihan
    const newOptions = options.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      label: String.fromCharCode(65 + i),
    }));
    // Jika yang dihapus kebetulan kunci jawaban, set opsi pertama jadi kunci
    if (options[index].isCorrect && newOptions.length > 0) {
      newOptions[0].isCorrect = true;
    }
    setOptions(newOptions);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    addQuestion({
      text: questionText,
      points,
      options,
    });

    // Reset Form
    setQuestionText("");
    setOptions([
      { label: "A", text: "", isCorrect: true },
      { label: "B", text: "", isCorrect: false },
      { label: "C", text: "", isCorrect: false },
      { label: "D", text: "", isCorrect: false },
      { label: "E", text: "", isCorrect: false },
    ]);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bank Soal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Bank Soal Aktif — Matematika Wajib XII
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 mt-1">
            Kelola Butir Soal Ujian
          </h2>
          <p className="text-xs text-slate-500">
            Total {questions.length} butir soal terdaftar dalam paket ini.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Tutup Form Input" : "+ Tambah Soal Baru"}</span>
        </button>
      </div>

      {/* Form Input Soal Dinamis (Custom A - E) */}
      {isCreating && (
        <form onSubmit={handleSaveQuestion} className="soft-card p-6 border-2 border-indigo-500/20 bg-indigo-50/10">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Form Input Soal Pilihan Ganda (Opsi Fleksibel)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Bobot Nilai:</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={points}
                onChange={(e) => setPoints(parseFloat(e.target.value) || 1)}
                className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Teks Pertanyaan */}
          <div className="space-y-2 mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Pertanyaan / Narasi Soal
            </label>
            <textarea
              rows={4}
              placeholder="Ketik pertanyaan soal di sini... (Dapat memuat teks narasi, konteks masalah, atau rumus)"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              required
            />
          </div>

          {/* Opsi Pilihan Jawaban Custom (A-E) */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Pilihan Jawaban (Klik radio untuk menandai Kunci Jawaban Benar)
              </label>
              <button
                type="button"
                onClick={addOption}
                disabled={options.length >= 6}
                className="text-xs text-indigo-600 font-bold hover:underline disabled:opacity-40"
              >
                + Tambah Opsi ({String.fromCharCode(65 + options.length)})
              </button>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                    opt.isCorrect
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {/* Radio Kunci Jawaban */}
                  <button
                    type="button"
                    onClick={() => setCorrectOption(idx)}
                    title={opt.isCorrect ? "Kunci Jawaban Benar" : "Jadikan Kunci Jawaban"}
                    className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition ${
                      opt.isCorrect
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>

                  {/* Input Teks Opsi */}
                  <input
                    type="text"
                    placeholder={`Teks pilihan jawaban untuk opsi ${opt.label}...`}
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    required
                  />

                  {/* Badge Kunci Jawaban */}
                  {opt.isCorrect ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" />
                      Kunci Jawaban
                    </span>
                  ) : null}

                  {/* Tombol Hapus Opsi (jika opsi > 2) */}
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition"
                      title="Hapus opsi ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
            >
              Simpan Butir Soal
            </button>
          </div>
        </form>
      )}

      {/* Daftar Soal yang Sudah Terdaftar */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="soft-card p-6">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                  #{q.number}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Bobot: {q.points} Poin
                </span>
              </div>
              <button
                onClick={() => deleteQuestion(q.id)}
                title="Hapus Soal"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Teks Soal */}
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-4">
              {q.text}
            </p>

            {/* Opsi Pilihan Jawaban */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {q.options.map((opt) => (
                <div
                  key={opt.label}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs ${
                    opt.isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                      : "bg-slate-50/70 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                      opt.isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {opt.isCorrect && (
                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
                      Kunci
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

