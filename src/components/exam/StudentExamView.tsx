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
  Loader2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentExamView() {
  const router = useRouter();
  const {
    questions,
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
    scoreResult,
    submitExam,
    studentName,
    studentNIS,
    studentClass,
    examTitle,
    initExamFromStorage,
    isLoading,
  } = useCBTExamStore();

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inisialisasi sesi ujian dari localStorage jika belum termuat
  useEffect(() => {
    if (questions.length === 0) {
      initExamFromStorage().then((ok) => {
        if (!ok) {
          // Jika tidak ada token aktif, beri waktu sebentar sebelum redirect
        }
      });
    }
  }, [questions.length, initExamFromStorage]);

  const totalQuestions = questions.length;
  const currentQ = questions[currentQuestionIndex];
  const currentQNum = currentQ ? currentQ.number : currentQuestionIndex + 1;

  // Format Timer HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  // Timer Tick
  useEffect(() => {
    if (isSubmitted || totalQuestions === 0) return;
    const interval = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [decrementTimer, isSubmitted, totalQuestions]);

  // Anti-Cheating: Visibility Change detection (Pindah tab/window)
  useEffect(() => {
    if (isSubmitted || totalQuestions === 0) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementViolations();
        setToastMessage("⚠️ Peringatan: Anda terdeteksi meninggalkan layar ujian!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [incrementViolations, isSubmitted, totalQuestions]);

  // Keyboard Shortcuts (A-E, Panah Kiri/Kanan, Spasi)
  useEffect(() => {
    if (isSubmitted || !currentQ) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      const matchedOpt = currentQ.options.find((o) => o.label === key);
      if (matchedOpt) {
        selectAnswer(currentQNum, key, matchedOpt.id);
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
  }, [currentQ, currentQNum, nextQuestion, prevQuestion, selectAnswer, toggleFlag, isSubmitted]);

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const answeredCount = Object.keys(answers).length;
  const isGeometryQuestion = currentQ?.text?.toLowerCase().includes("segitiga") || currentQ?.text?.toLowerCase().includes("sudut");

  // Layar jika soal belum termuat
  if (totalQuestions === 0) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">
            {isLoading ? "Memuat Lembar Ujian..." : "Sesi Ujian Belum Aktif"}
          </h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            {isLoading
              ? "Sedang menyinkronkan data soal langsung dari server..."
              : "Silakan masukkan token ujian yang valid dari pengawas melalui halaman login."}
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menghubungkan ke NeonDB...</span>
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Login</span>
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 flex items-center justify-center">
      {/* Toast Notifikasi Floating */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card Ujian */}
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

            {/* Grid Tombol Nomor 1 s/d N */}
            <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {questions.map((q, i) => {
                const qNum = q.number;
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
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`h-9 rounded-xl text-xs flex items-center justify-center transition ${btnStyle}`}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sisi Bawah Sidebar */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              onClick={() => setShowGuideModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Pintasan Keyboard</span>
            </button>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Keluar Ujian</span>
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
            {currentQ && (
              <div className="space-y-6">
                {/* Nomor Soal Badge & Bobot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-sky-500 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                      {currentQNum}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Bobot: {currentQ.points} Poin
                    </span>
                  </div>
                  {flagged[currentQNum] && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <Flag className="w-3 h-3 fill-amber-500" />
                      Ditandai Ragu-Ragu
                    </span>
                  )}
                </div>

                {/* Teks Soal Riil dari Database NeonDB */}
                <div className="text-base font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {currentQ.text}
                </div>

                {/* Gambar Soal (Jika Ada URL atau Diagram Geometri) */}
                {currentQ.imageUrl ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <img
                      src={currentQ.imageUrl}
                      alt={`Gambar Soal Nomor ${currentQNum}`}
                      className="max-h-64 rounded-lg object-contain"
                    />
                  </div>
                ) : isGeometryQuestion ? (
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
                ) : null}

                {/* Opsi Pilihan Jawaban Riil dari Database NeonDB */}
                <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQNum] === opt.label;
                    return (
                      <button
                        key={opt.id || opt.label}
                        onClick={() => {
                          selectAnswer(currentQNum, opt.label, opt.id);
                          setToastMessage(`Opsi ${opt.label} dipilih (Tersimpan otomatis)`);
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
                          {opt.label}
                        </span>
                        <div className="flex-1 text-sm">
                          <div>{opt.text}</div>
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt={opt.label} className="mt-2 max-h-32 rounded" />
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar Bawah */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 mt-8">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={() => toggleFlag(currentQNum)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                flagged[currentQNum]
                  ? "bg-amber-100 border-amber-300 text-amber-900"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Flag className={`w-4 h-4 ${flagged[currentQNum] ? "fill-amber-500 text-amber-500" : ""}`} />
              <span>{flagged[currentQNum] ? "Tandai Yakin" : "Ragu-Ragu"}</span>
            </button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <button
                onClick={() => setShowSummaryModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-500/20"
              >
                <span>Selesai & Kumpulkan</span>
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Modal Ringkasan Sebelum Submit */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">
                Konfirmasi Penyelesaian Ujian
              </h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
                  <div className="text-xl font-extrabold text-sky-600">{answeredCount}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">Terjawab</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="text-xl font-extrabold text-amber-600">
                    {Object.values(flagged).filter(Boolean).length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">Ragu-Ragu</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="text-xl font-extrabold text-rose-600">
                    {totalQuestions - answeredCount}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">Kosong</div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Pastikan Anda telah memeriksa kembali seluruh jawaban. Setelah dikumpulkan, Anda tidak dapat mengubah jawaban lagi.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cek Kembali
              </button>
              <button
                onClick={async () => {
                  setShowSummaryModal(false);
                  await submitExam();
                }}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-extrabold text-xs transition shadow-md shadow-emerald-600/20"
              >
                {isLoading ? "Mengirim Jawaban..." : "Ya, Kumpulkan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sukses Selesai Ujian */}
      {isSubmitted && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Ujian Berhasil Diselesaikan!
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Jawaban Anda telah tersimpan secara permanen ke database sekolah.
            </p>

            {scoreResult !== null && (
              <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-100">
                <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                  Nilai Akhir Ujian Anda
                </div>
                <div className="text-4xl font-extrabold text-sky-600 font-mono mt-1 tabular-digits">
                  {scoreResult}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1">
                  Status: {scoreResult >= 75 ? "🎉 Tuntas (Memenuhi KKM)" : "⚠️ Belum Mencapai KKM (75)"}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem("cbt_active_sesi");
                localStorage.removeItem("cbt_active_token");
                router.push("/");
              }}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-md"
            >
              Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      )}

      {/* Modal Panduan Pintasan Keyboard */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Pintasan Keyboard</h3>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Pilih Jawaban</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">A, B, C, D, E</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Soal Berikutnya</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">Tombol ➔</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Soal Sebelumnya</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">Tombol ⬅</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tandai Ragu-ragu</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">Spasi (Space)</span>
              </div>
            </div>
            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
