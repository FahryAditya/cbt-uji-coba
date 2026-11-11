"use client";

import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import ProctoringView from "@/components/admin/ProctoringView";
import ImportSiswaView from "@/components/admin/ImportSiswaView";
import BankSoalView from "@/components/admin/BankSoalView";
import JadwalView from "@/components/admin/JadwalView";
import RekapNilaiView from "@/components/admin/RekapNilaiView";
import SettingsView from "@/components/admin/SettingsView";
import BroadcastModal from "@/components/admin/BroadcastModal";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function AdminPage() {
  const { activeTab, fetchAllData, toast, clearToast, showToast } = useCBTAdminStore();
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleBroadcastSend = (message: string) => {
    showToast(`Pesan broadcast terkirim ke siswa: "${message}"`, "success");
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 overflow-x-hidden">
      {/* Sidebar Navigasi (Drawer di Mobile/Tablet, Fixed di Desktop) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Atas */}
        <Navbar
          onOpenBroadcast={() => setIsBroadcastOpen(true)}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "proctoring" && <ProctoringView />}
          {activeTab === "import-siswa" && <ImportSiswaView />}
          {activeTab === "bank-soal" && <BankSoalView />}
          {activeTab === "jadwal" && <JadwalView />}
          {activeTab === "nilai" && <RekapNilaiView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        onSend={handleBroadcastSend}
      />

      {/* Global Admin Feedback Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[92vw] sm:max-w-md px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-semibold transition-all ${
            toast.type === "error"
              ? "bg-rose-950 text-rose-50 border-rose-700"
              : toast.type === "info"
              ? "bg-sky-950 text-sky-50 border-sky-700"
              : "bg-slate-900 text-white border-slate-700"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === "info" ? (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={clearToast}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

