"use client";

import React, { useState, useEffect } from "react";
import { useCBTExamStore } from "@/stores/cbt-exam";
import {
  Clock,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";

export default function StudentExamView() {
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    nextQuestion,
    prevQuestion,
    answers,
    selectAnswer,
    flagged,
    toggleFlag,
    secondsRemaining,
    decrementTimer,
    violations,
    incrementViolations,
    isSubmitted,
    submitExam,
    studentName,
    studentNIS,
    studentClass,
    examTitle,
  } = useCBTExamStore();

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalQuestions = 40;
  const currentQNum = currentQuestionIndex + 1;

  // Format Timer HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  // Timer Tick
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [decrementTimer, isSubmitted]);

  // Anti-Cheating: Visibility Change detection (Pindah tab/window)
  useEffect(() => {
    if (isSubmitted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementViolations();
        setToastMessage("⚠️ Peringatan: Anda terdeteksi meninggalkan layar ujian!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [incrementViolations, isSubmitted]);

  // Keyboard Shortcuts (A-E, Panah Kiri/Kanan, Spasi)
  useEffect(() => {
    if (isSubmitted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      if (["A", "B", "C", "D", "E"].includes(key)) {
        selectAnswer(currentQNum, key);
        setToastMessage(`Opsi ${key} dipilih (Tersimpan otomatis)`);
      } else if (e.key === "ArrowRight") {
        nextQuestion();
      } else if (e.key === "ArrowLeft") {
        prevQuestion();
      } else if (e.key === " ") {
        e.preventDefault();
        toggleFlag(currentQNum);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQNum, nextQuestion, prevQuestion, selectAnswer, toggleFlag, isSubmitted]);

  // Auto clear toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Soal Aktif (Contoh Geometri persis seperti di siswa.html jika nomor 7)
  const isGeometryQuestion = currentQNum === 7;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100/70 via-sky-50/50 to-white flex flex-col items-center justify-center p-3 md:p-6 font-sans">
      {/* Container Utama Jendela Ujian */}
      <div className="w-full max-w-6xl min-h-[720px] bg-white rounded-3xl shadow-2xl shadow-sky-500/10 border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        
        {/* ========================================================
            KOLOM KIRI: SIDEBAR STEPPER NOMOR SOAL (lg:col-span-3)
           ======================================================== */}
        <aside className="lg:col-span-3 bg-slate-50/70 border-r border-slate-200/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">
                  Daftar Nomor Soal
                </span>
              </div>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                {answeredCount}/{totalQuestions} Terisi
              </span>
            </div>

            {/* Indikator Status Warna */}
            <div className="grid grid-cols-3 gap-1 py-3 text-[10px] font-semibold text-slate-500 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
                <span>Terjawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
                <span>Ragu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>
                <span>Kosong</span>
              </div>
            </div>

            {/* Grid Tombol Nomor 1 s/d 40 */}
            <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const qNum = i + 1;
                const isCurrent = i === currentQuestionIndex;
                const isAnswered = answers[qNum] !== undefined;
                const isFlagged = flagged[qNum] === true;

                let btnStyle = "bg-white text-slate-600 border border-slate-200 hover:border-sky-400";
                if (isCurrent) {
                  btnStyle = "ring-2 ring-sky-500 font-extrabold bg-sky-50 text-sky-700 shadow-sm";
                } else if (isFlagged) {
                  btnStyle = "bg-amber-400 text-amber-950 font-bold border-amber-500";
                } else if (isAnswered) {
                  btnStyle = "bg-sky-500 text-white font-bold border-sky-600 shadow-xs";
                }

                return (
                  <button
                    key={qNum}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`h-9 rounded-xl text-xs flex items-center justify-center transition ${btnStyle}`}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sisi Bawah Sidebar: Tombol Panduan Pintasan */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              onClick={() => setShowGuideModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Pintasan Keyboard</span>
            </button>
            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Admin</span>
            </Link>
          </div>
        </aside>

        {/* ========================================================
            KOLOM KANAN: LEMBAR SOAL UTAMA (lg:col-span-9)
           ======================================================== */}
        <main className="lg:col-span-9 flex flex-col justify-between p-6 sm:p-8">
          
          {/* Header Soal & Timer */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              {/* Profil Siswa & Mapel */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-600">
                    Koneksi Server Stabil
                  </span>
                  {violations > 0 && (
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      ⚠️ {violations}x Keluar Tab
                    </span>
                  )}
                </div>
                <h1 className="text-base font-extrabold text-slate-800 mt-0.5">
                  {examTitle}
                </h1>
                <div className="text-xs font-semibold text-slate-400">
                  {studentName} ({studentNIS}) • {studentClass}
                </div>
              </div>

              {/* Timer Box */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 shadow-xs">
                <Clock className="w-5 h-5 text-rose-500 animate-pulse" />
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Waktu Tersisa
                  </div>
                  <div className="font-mono font-extrabold text-xl text-rose-600 tabular-digits">
                    {formatTimer(secondsRemaining)}
                  </div>
                </div>
              </div>
            </div>

            {/* Area Lembar Soal Aktif */}
            <div className="space-y-6">
              {/* Nomor Soal Badge & Bobot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-sky-500 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                    {currentQNum}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Bobot: 2.5 Poin
                  </span>
                </div>
                {flagged[currentQNum] && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <Flag className="w-3 h-3 fill-amber-500" />
                    Ditandai Ragu-Ragu
                  </span>
                )}
              </div>

              {/* Teks Soal */}
              <div className="text-base font-semibold text-slate-800 leading-relaxed">
                {isGeometryQuestion ? (
                  <>
                    Sebuah segitiga ABC memiliki sudut A = 45°, sudut B = 75°, dan panjang sisi yang berseberangan dengan sudut C adalah 12 cm. Berapakah panjang sisi AB dari segitiga di bawah ini?
                  </>
                ) : (
                  <>
                    Soal Nomor {currentQNum}: Perhatikan persamaan fungsi matematika berikut. Tentukan nilai variabel x yang memenuhi kondisi batas yang ditentukan pada interval terbuka (0, 2π)!
                  </>
                )}
              </div>

              {/* Diagram Geometri (Matching Design/siswa.html persis) */}
              {isGeometryQuestion && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <svg width="340" height="190" viewBox="0 0 390 235" fill="none" className="max-w-full">
                    <polygon points="62,195 335,195 253,36" stroke="#1E293B" strokeWidth="2.5" fill="#FFFFFF" strokeLinejoin="round" strokeLinecap="round" />
                    <text x="44" y="215" fill="#1E293B" fontWeight="800" fontSize="16">A</text>
                    <text x="342" y="215" fill="#1E293B" fontWeight="800" fontSize="16">B</text>
                    <text x="249" y="24" fill="#1E293B" fontWeight="800" fontSize="16">C</text>
                    <text x="93" y="185" fill="#0284C7" fontWeight="700" fontSize="14">45°</text>
                    <text x="298" y="185" fill="#0284C7" fontWeight="700" fontSize="14">75°</text>
                    <g transform="translate(291, 90)">
                      <path d="M0 9.5 L2.5 8 L6 14.5 L10.5 1 L26 1" stroke="#E11D48" strokeWidth="2" fill="none" />
                      <text x="11.5" y="14" fill="#E11D48" fontWeight="800" fontSize="14">12 cm</text>
                    </g>
                  </svg>
                </div>
              )}

              {/* Opsi Pilihan Jawaban (A, B, C, D, E) */}
              <div className="space-y-3">
                {[
                  { key: "A", text: isGeometryQuestion ? "6√2 cm" : "x = π/4 atau x = 3π/4" },
                  { key: "B", text: isGeometryQuestion ? "3√2 cm" : "x = π/3 atau x = 5π/3" },
                  { key: "C", text: isGeometryQuestion ? "12√2 cm" : "x = π/2 atau x = 3π/2" },
                  { key: "D", text: isGeometryQuestion ? "3 cm" : "x = 2π/3 atau x = 4π/3" },
                  { key: "E", text: isGeometryQuestion ? "6 cm" : "Tidak ada nilai x yang memenuhi" },
                ].map((opt) => {
                  const isSelected = answers[currentQNum] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        selectAnswer(currentQNum, opt.key);
                        setToastMessage(`Opsi ${opt.key} dipilih (Tersimpan otomatis)`);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                        isSelected
                          ? "bg-sky-50 border-sky-500 ring-2 ring-sky-500/30 text-sky-950 font-bold shadow-xs"
                          : "bg-white border-slate-200 hover:border-sky-300 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full font-extrabold text-sm flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? "bg-sky-500 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="flex-1 text-sm">{opt.text}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================
              ACTION BAR BAWAH: Sebelumnya, Ragu-ragu, Selanjutnya / Submit
             ======================================================== */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 mt-8">
            {/* Tombol Sebelumnya */}
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Tombol Ragu-Ragu */}
            <button
              onClick={() => toggleFlag(currentQNum)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-xs transition ${
                flagged[currentQNum]
                  ? "bg-amber-400 text-amber-950 border-amber-500 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50"
              }`}
            >
              <Flag className={`w-4 h-4 ${flagged[currentQNum] ? "fill-amber-950" : ""}`} />
              <span>{flagged[currentQNum] ? "Tandai Ragu-Ragu (Aktif)" : "Ragu-Ragu"}</span>
            </button>

            {/* Tombol Selanjutnya / Selesaikan Ujian */}
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSummaryModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md shadow-emerald-500/20"
              >
                <span>Selesaikan Ujian</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Panduan & Pintasan Keyboard */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                Panduan Pintasan Keyboard (Shortcuts)
              </h3>
              <button onClick={() => setShowGuideModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span>Pilih Jawaban Opsi A, B, C, D, E</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold">
                  A / B / C / D / E
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span>Soal Berikutnya / Sebelumnya</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold">←</kbd>
                  <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold">→</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span>Tandai / Hapus Ragu-Ragu</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold">
                  Spasi
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ringkasan & Konfirmasi Submit */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                Konfirmasi Pengumpulan Ujian
              </h3>
              <p className="text-xs text-slate-500">
                Periksa kembali ringkasan lembar pengerjaan Anda sebelum mengirim jawaban akhir.
              </p>
            </div>

            {/* Statistik Ringkasan Pengerjaan */}
            <div className="grid grid-cols-3 gap-3 my-5">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-2xl font-extrabold text-emerald-700 tabular-digits">
                  {answeredCount}
                </div>
                <div className="text-[11px] font-bold text-emerald-800 mt-1">
                  Sudah Terjawab
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-2xl font-extrabold text-amber-700 tabular-digits">
                  {flaggedCount}
                </div>
                <div className="text-[11px] font-bold text-amber-800 mt-1">
                  Ragu-Ragu
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <div className="text-2xl font-extrabold text-rose-700 tabular-digits">
                  {unansweredCount}
                </div>
                <div className="text-[11px] font-bold text-rose-800 mt-1">
                  Belum Diisi
                </div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Masih terdapat <strong>{unansweredCount} butir soal</strong> yang belum terisi. Apakah Anda yakin ingin menyelesaikan ujian sekarang?
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Cek Jawaban Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  submitExam();
                  setShowSummaryModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20"
              >
                Ya, Kumpulkan Jawaban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Jika Sudah Dikumpulkan */}
      {isSubmitted && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              Ujian Berhasil Diserahkan!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Terima kasih, lembar jawaban Anda telah tersimpan dan terenkripsi dengan aman di server sekolah.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

