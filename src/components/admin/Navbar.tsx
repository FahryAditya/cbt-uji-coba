"use client";

import React, { useState } from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { Copy, RefreshCw, Send, ShieldCheck, Clock } from "lucide-react";

interface NavbarProps {
  onOpenBroadcast: () => void;
}

export default function Navbar({ onOpenBroadcast }: NavbarProps) {
  const {
    activeToken,
    regenerateToken,
    activeExamTitle,
    setActiveExamTitle,
    exams,
  } = useCBTAdminStore();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Kiri: Judul Ujian Aktif */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
          <ShieldCheck className="w-5 h-5 text-sky-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Sesi Sedang Berlangsung
            </span>
          </div>
          <select
            value={activeExamTitle}
            onChange={(e) => setActiveExamTitle(e.target.value)}
            className="text-base font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.title}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanan: Token & Aksi Broadcast */}
      <div className="flex items-center gap-3">
        {/* Token Box */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <span className="text-xs font-semibold text-slate-400">TOKEN:</span>
          <span className="font-mono font-extrabold text-sm text-sky-600 tracking-wider">
            {activeToken}
          </span>
          <button
            onClick={handleCopy}
            title="Salin Token"
            className="p-1 hover:bg-slate-200 rounded-md transition text-slate-500"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={regenerateToken}
            title="Buat Token Baru"
            className="p-1 hover:bg-slate-200 rounded-md transition text-slate-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Broadcast Modal Trigger */}
        <button
          onClick={onOpenBroadcast}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim Broadcast</span>
        </button>

        {copied && (
          <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 animate-bounce">
            Token disalin ke clipboard!
          </div>
        )}
      </div>
    </header>
  );
}

