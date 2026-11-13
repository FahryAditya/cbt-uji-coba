"use client";

import React, { useEffect } from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { Copy, RefreshCw, Send, ShieldCheck, Clock, Menu } from "lucide-react";

interface NavbarProps {
  onOpenBroadcast: () => void;
  onOpenMenu?: () => void;
}

export default function Navbar({ onOpenBroadcast, onOpenMenu }: NavbarProps) {
  const {
    activeExamId,
    setActiveExamId,
    activeToken,
    tokenSecondsRemaining,
    decrementTokenTimer,
    regenerateToken,
    exams,
    showToast,
  } = useCBTAdminStore();

  const currentExam = exams.find((ex) => ex.id === activeExamId);
  const isAutoRotate = Boolean(currentExam?.autoRotateToken);

  // Countdown rotasi token otomatis tiap 10 menit (HANYA dijalankan jika autoRotateToken aktif)
  useEffect(() => {
    if (!activeExamId || !isAutoRotate) return;
    const timer = setInterval(() => {
      decrementTokenTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExamId, isAutoRotate, decrementTokenTimer]);

  const formatCountdown = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeToken);
    showToast(`Token "${activeToken}" disalin ke clipboard!`, "success");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
      {/* Kiri: Tombol Menu Mobile & Judul Ujian Aktif */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpenMenu}
          className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-sky-50 text-sky-600 items-center justify-center font-bold shrink-0">
          <ShieldCheck className="w-5 h-5 text-sky-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 truncate">
              Sesi Sedang Berlangsung
            </span>
          </div>
          <select
            value={activeExamId}
            onChange={(e) => setActiveExamId(e.target.value)}
            className="w-full max-w-full sm:max-w-sm md:max-w-md text-base sm:text-sm md:text-base font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer truncate"
          >
            {exams.length === 0 ? (
              <option value="">(Belum ada ujian)</option>
            ) : (
              exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Kanan: Token & Aksi Broadcast */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Token Box */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 min-w-0">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400">TOKEN:</span>
          <span className="font-mono font-extrabold text-xs sm:text-sm text-sky-600 tracking-wider">
            {activeToken || "-"}
          </span>
          {isAutoRotate ? (
            <span
              title="Token berubah otomatis setiap 10 menit"
              className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold ${
                tokenSecondsRemaining <= 60
                  ? "bg-amber-100 text-amber-700 animate-pulse"
                  : "bg-sky-100 text-sky-700"
              }`}
            >
              <Clock className="w-3 h-3" />
              {formatCountdown(tokenSecondsRemaining)}
            </span>
          ) : (
            <span
              title="Token tetap (statis) tidak berganti otomatis"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-500"
            >
              Statis
            </span>
          )}
          <button
            onClick={handleCopy}
            title="Salin Token"
            className="p-1.5 sm:p-1 hover:bg-slate-200 rounded-md transition text-slate-500"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={regenerateToken}
            title="Ganti Token Sekarang"
            className="p-1.5 sm:p-1 hover:bg-slate-200 rounded-md transition text-slate-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Broadcast Modal Trigger */}
        <button
          onClick={onOpenBroadcast}
          className="min-h-[38px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition shadow-sm shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Broadcast</span>
          <span className="hidden md:inline">Pesan</span>
        </button>
      </div>
    </header>
  );
}

