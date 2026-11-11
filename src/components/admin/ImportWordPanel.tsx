"use client";

import React, { useRef, useState } from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { apiRequest } from "@/lib/api";
import {
  ParsedWordQuestion,
  WordParseResult,
  parseWordQuestions,
} from "@/lib/word-question-parser";
import {
  FileUp,
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  Upload,
  BookOpen,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ImportWordPanelProps {
  onClose: () => void;
  onSaved?: (importedCount: number) => void;
  onPendingChange?: (pendingCount: number, saveHandler: (() => Promise<boolean>) | null) => void;
  hideFooterActions?: boolean;
}

export default function ImportWordPanel({
  onClose,
  onSaved,
  onPendingChange,
  hideFooterActions = false,
}: ImportWordPanelProps) {
  const {
    activeBankSoalId,
    bankSoalList,
    questions: existingQuestions,
    importQuestionsBulk,
    showToast,
  } = useCBTAdminStore();

  const activeBank = bankSoalList.find((b) => b.id === activeBankSoalId);

  const [mode, setMode] = useState<"file" | "paste">("file");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [defaultPoints, setDefaultPoints] = useState<number>(1);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const [parsedQuestions, setParsedQuestions] = useState<ParsedWordQuestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [answerKeyCount, setAnswerKeyCount] = useState(0);

  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyParseResult = (result: WordParseResult, sourceLabel: string) => {
    setParsedQuestions(result.questions);
    setWarnings(result.warnings);
    setAnswerKeyCount(result.answerKeyCount);

    if (result.questions.length === 0) {
      showToast(
        "Tidak ada butir soal pilihan ganda yang terdeteksi. Periksa kembali format dokumen.",
        "error"
      );
    } else {
      showToast(
        `Berhasil mengekstrak ${result.questions.length} soal (${result.answerKeyCount} kunci jawaban) dari ${sourceLabel}.`,
        "success"
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      try {
        setIsParsing(true);
        const text = await file.text();
        setRawText(text);
        const result = parseWordQuestions(text, defaultPoints);
        applyParseResult(result, file.name);
      } catch (err: any) {
        showToast(err?.message || "Gagal membaca file teks.", "error");
      } finally {
        setIsParsing(false);
      }
      return;
    }

    if (ext !== "docx") {
      showToast(
        "Gunakan file Microsoft Word format .docx (atau salin-tempel teks ke tab Tempel Teks).",
        "error"
      );
      return;
    }

    try {
      setIsParsing(true);
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Gagal membaca file Word."));
        reader.readAsDataURL(file);
      });

      const res = await apiRequest<{
        success: boolean;
        data: WordParseResult;
        message?: string;
      }>("/api/bank-soal/parse-word", {
        method: "POST",
        body: JSON.stringify({
          fileBase64: base64DataUrl,
          defaultPoints,
        }),
      });

      if (res.data) {
        setRawText(res.data.extractedText || "");
        applyParseResult(res.data, file.name);
      }
    } catch (err: any) {
      showToast(err?.message || "Gagal memproses file Word (.docx).", "error");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleParseText = () => {
    if (!rawText.trim()) {
      showToast("Tempel teks naskah soal dari Word terlebih dahulu.", "error");
      return;
    }
    const result = parseWordQuestions(rawText, defaultPoints);
    applyParseResult(result, "teks yang ditempel");
  };

  const handleApplyUniformPoints = (pointsValue: number) => {
    const safeVal = pointsValue > 0 ? pointsValue : 1;
    setDefaultPoints(safeVal);
    setParsedQuestions((prev) =>
      prev.map((q) => ({ ...q, points: safeVal }))
    );
  };

  const handleSplitTo100 = () => {
    if (parsedQuestions.length === 0) return;
    const perQuestion = Number((100 / parsedQuestions.length).toFixed(2));
    handleApplyUniformPoints(perQuestion);
    showToast(
      `Bobot diatur ke ${perQuestion} poin per soal (total ~100 untuk ${parsedQuestions.length} soal).`,
      "info"
    );
  };

  const handleChangeCorrectOption = (qIdx: number, label: string) => {
    setParsedQuestions((prev) =>
      prev.map((q, idx) =>
        idx !== qIdx
          ? q
          : {
              ...q,
              correctLabel: label,
              options: q.options.map((opt) => ({
                ...opt,
                isCorrect: opt.label === label,
              })),
            }
      )
    );
  };

  const handleRemoveParsedQuestion = (qIdx: number) => {
    setParsedQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  const handleImportSubmit = async (): Promise<boolean> => {
    if (parsedQuestions.length === 0 || !activeBankSoalId) return false;
    setIsImporting(true);
    const countToImport = parsedQuestions.length;
    const ok = await importQuestionsBulk(
      activeBankSoalId,
      parsedQuestions.map((q) => ({
        pertanyaan: q.fullText,
        bobotNilai: q.points,
        options: q.options.map((opt) => ({
          label: opt.label,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      })),
      replaceExisting
    );
    setIsImporting(false);
    if (ok) {
      setParsedQuestions([]);
      onSaved?.(countToImport);
      if (!hideFooterActions) {
        onClose();
      }
    }
    return ok;
  };

  const submitRef = useRef<() => Promise<boolean>>(async () => false);
  submitRef.current = handleImportSubmit;

  React.useEffect(() => {
    if (!onPendingChange) return;
    onPendingChange(
      parsedQuestions.length,
      parsedQuestions.length > 0 ? () => submitRef.current() : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedQuestions.length]);

  return (
    <div className="soft-card p-4 sm:p-6 border-2 border-emerald-500/25 bg-emerald-50/10 space-y-5">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Import Soal dari Dokumen Word (.docx)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Otomatis membaca nomor soal, wacana/stimulus bacaan, pilihan jawaban A–E, dan tabel kunci jawaban.
            </p>
          </div>
        </div>
        {!hideFooterActions && (
          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-center p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Tutup panel import"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            mode === "file"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload File Word (.docx)</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            mode === "paste"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Tempel Teks dari Word</span>
        </button>
      </div>

      {/* Upload / Paste Area */}
      {mode === "file" ? (
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-white p-5 sm:p-7 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              {isParsing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <FileUp className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {fileName ? `File dipilih: ${fileName}` : "Pilih File Naskah Soal Word (.docx)"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung format naskah soal bernomor (<code className="text-emerald-700 font-semibold">1. ...</code>), opsi (<code className="text-emerald-700 font-semibold">A. B. C. D. E.</code>), blok <code className="text-emerald-700 font-semibold">STIMULUS BACAAN</code>, dan tabel <code className="text-emerald-700 font-semibold">KUNCI JAWABAN</code>.
              </p>
            </div>
            <button
              type="button"
              disabled={isParsing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>{isParsing ? "Memproses Dokumen..." : "Pilih File .docx"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Tempel teks soal dari Microsoft Word di sini... Contoh:\n\n1. Pancasila sebagai dasar negara...\nA. Pilihan A\nB. Pilihan B\nC. Pilihan C\nD. Pilihan D\nE. Pilihan E\n\nKUNCI JAWABAN\n1. A`}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              Tips: Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border text-[10px]">Ctrl+A</kbd> lalu <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border text-[10px]">Ctrl+C</kbd> di Word dan tempel di atas.
            </span>
            <button
              type="button"
              onClick={handleParseText}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proses & Pratinjau Soal</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview Parsed Questions */}
      {parsedQuestions.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          {/* Controls & Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {parsedQuestions.length} Soal Terdeteksi
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                Kunci Jawaban Terbaca: {answerKeyCount}
              </span>
              {activeBank && (
                <span className="text-xs text-slate-500">
                  Target: <strong className="text-slate-700">{activeBank.judul}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Bobot/Soal:</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.25"
                  value={defaultPoints}
                  onChange={(e) => handleApplyUniformPoints(parseFloat(e.target.value) || 1)}
                  className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleSplitTo100}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                title="Hitung bobot otomatis agar total skor = 100"
              >
                Bagi Rata Total 100
              </button>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Catatan Parsing ({warnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
                {warnings.slice(0, 10).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {warnings.length > 10 && (
                  <li>...dan {warnings.length - 10} catatan lainnya.</li>
                )}
              </ul>
            </div>
          )}

          {/* Replace existing checkbox */}
          {existingQuestions.length > 0 && (
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <strong>Timpa soal lama</strong> — Hapus {existingQuestions.length} soal yang ada di paket ini sebelum memasukkan {parsedQuestions.length} soal baru (jika tidak dicentang, soal akan ditambahkan di urutan akhir).
              </span>
            </label>
          )}

          {/* Scrollable Preview List */}
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {parsedQuestions.map((q, idx) => (
              <div
                key={`${q.number}-${idx}`}
                className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[11px] font-bold">
                      #{q.number}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Bobot: {q.points} Poin
                    </span>
                    {q.stimulus && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                        <BookOpen className="w-3 h-3" />
                        Memiliki Wacana Stimulus
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 font-semibold">Kunci:</span>
                      <select
                        value={q.correctLabel}
                        onChange={(e) => handleChangeCorrectOption(idx, e.target.value)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer"
                      >
                        {q.options.map((opt) => (
                          <option key={opt.label} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveParsedQuestion(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Hapus soal ini dari daftar import"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {q.stimulus && (
                  <p className="text-[11px] text-sky-900 bg-sky-50/70 border border-sky-100 rounded-lg p-2.5 leading-relaxed whitespace-pre-line">
                    {q.stimulus}
                  </p>
                )}

                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {q.options.map((opt) => (
                    <div
                      key={opt.label}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-start gap-2 ${
                        opt.isCorrect
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                          : "bg-slate-50/60 border-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          opt.isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="leading-snug">{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Import */}
          {!hideFooterActions && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleImportSubmit}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan {parsedQuestions.length} Soal...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan {parsedQuestions.length} Soal ke Bank Soal</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
