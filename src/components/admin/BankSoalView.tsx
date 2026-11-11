"use client";

import React, { useState } from "react";
import { useCBTAdminStore, QuestionOption, QuestionItem } from "@/stores/cbt-admin";
import {
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Eye,
  Check,
  FileText,
  Sparkles,
  Pencil,
  X,
} from "lucide-react";

export default function BankSoalView() {
  const {
    questions,
    bankSoalList,
    activeBankSoalId,
    setActiveBankSoalId,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  } = useCBTAdminStore();

  const activeBank = bankSoalList.find((b) => b.id === activeBankSoalId);

  const [isCreating, setIsCreating] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(2.5);

  // Standard 4 Options: A, B, C, D (Dapat ditambah ke E jika diperlukan)
  const defaultABCD: QuestionOption[] = [
    { label: "A", text: "", isCorrect: true },
    { label: "B", text: "", isCorrect: false },
    { label: "C", text: "", isCorrect: false },
    { label: "D", text: "", isCorrect: false },
  ];

  const [options, setOptions] = useState<QuestionOption[]>(defaultABCD);

  // State untuk modal edit soal
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editText, setEditText] = useState("");
  const [editPoints, setEditPoints] = useState(2.5);
  const [editOptions, setEditOptions] = useState<QuestionOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditText(q.text);
    setEditPoints(q.points);
    setEditOptions(JSON.parse(JSON.stringify(q.options)));
  };

  const closeEditModal = () => {
    setEditingQuestion(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editText.trim()) return;

    setIsSaving(true);
    await updateQuestion(editingQuestion.id, {
      text: editText,
      points: editPoints,
      options: editOptions,
    });
    setIsSaving(false);

    setEditingQuestion(null);
  };

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

  // Helper edit modal options
  const setEditCorrectOption = (index: number) => {
    setEditOptions(
      editOptions.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const handleEditOptionChange = (index: number, text: string) => {
    setEditOptions(
      editOptions.map((opt, i) => (i === index ? { ...opt, text } : opt))
    );
  };

  const addEditOption = () => {
    if (editOptions.length >= 6) return;
    const nextLabel = String.fromCharCode(65 + editOptions.length);
    setEditOptions([...editOptions, { label: nextLabel, text: "", isCorrect: false }]);
  };

  const removeEditOption = (index: number) => {
    if (editOptions.length <= 2) return;
    const newOpts = editOptions.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      label: String.fromCharCode(65 + i),
    }));
    if (editOptions[index].isCorrect && newOpts.length > 0) {
      newOpts[0].isCorrect = true;
    }
    setEditOptions(newOpts);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSaving(true);
    await addQuestion({
      text: questionText,
      points,
      options,
    });
    setIsSaving(false);

    // Reset Form ke standar 4 Opsi (A, B, C, D)
    setQuestionText("");
    setOptions([
      { label: "A", text: "", isCorrect: true },
      { label: "B", text: "", isCorrect: false },
      { label: "C", text: "", isCorrect: false },
      { label: "D", text: "", isCorrect: false },
    ]);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bank Soal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Bank Soal Aktif — {activeBank?.mapel || "Memuat..."}
          </span>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <h2 className="text-xl font-extrabold text-slate-800">
              Kelola Butir Soal Ujian
            </h2>
            {bankSoalList.length > 0 && (
              <select
                value={activeBankSoalId}
                onChange={(e) => setActiveBankSoalId(e.target.value)}
                className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {bankSoalList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.judul} ({b.totalSoal} Soal)
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
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
        {questions.length === 0 ? (
          <div className="soft-card p-12 text-center text-slate-400 text-xs font-semibold">
            Belum ada butir soal dalam bank soal ini. Klik "+ Tambah Soal Baru" untuk mulai menyusun soal.
          </div>
        ) : (
          questions.map((q) => (
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(q)}
                  title="Edit Butir Soal & Kunci Jawaban"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  title="Hapus Soal"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
        )))}
      </div>

      {/* Modal Edit Soal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Edit Butir Soal #{editingQuestion.number}
                </h3>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              {/* Bobot Nilai */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Bobot Nilai:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={editPoints}
                  onChange={(e) => setEditPoints(parseFloat(e.target.value) || 1)}
                  className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Teks Pertanyaan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pertanyaan / Narasi Soal
                </label>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                />
              </div>

              {/* Pilihan Jawaban Edit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pilihan Jawaban (Tentukan Kunci Jawaban Benar)
                  </label>
                  <button
                    type="button"
                    onClick={addEditOption}
                    disabled={editOptions.length >= 6}
                    className="text-xs text-indigo-600 font-bold hover:underline disabled:opacity-40"
                  >
                    + Tambah Opsi ({String.fromCharCode(65 + editOptions.length)})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        opt.isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setEditCorrectOption(idx)}
                        title={opt.isCorrect ? "Kunci Jawaban Benar" : "Jadikan Kunci Jawaban"}
                        className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition ${
                          opt.isCorrect
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleEditOptionChange(idx, e.target.value)}
                        placeholder={`Teks pilihan jawaban untuk opsi ${opt.label}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />

                      {opt.isCorrect && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          Kunci Jawaban
                        </span>
                      )}

                      {editOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEditOption(idx)}
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

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

