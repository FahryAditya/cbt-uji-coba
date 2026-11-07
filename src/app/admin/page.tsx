"use client";

import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import ProctoringView from "@/components/admin/ProctoringView";
import BankSoalView from "@/components/admin/BankSoalView";
import JadwalView from "@/components/admin/JadwalView";
import RekapNilaiView from "@/components/admin/RekapNilaiView";
import BroadcastModal from "@/components/admin/BroadcastModal";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { Settings, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  const { activeTab, fetchAllData } = useCBTAdminStore();
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastSentToast, setBroadcastSentToast] = useState<string | null>(null);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleBroadcastSend = (message: string) => {
    setBroadcastSentToast(`Pesan broadcast terkirim ke siswa: "${message}"`);
    setTimeout(() => setBroadcastSentToast(null), 4000);
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar Navigasi */}
      <Sidebar />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Atas */}
        <Navbar onOpenBroadcast={() => setIsBroadcastOpen(true)} />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "proctoring" && <ProctoringView />}
          {activeTab === "bank-soal" && <BankSoalView />}
          {activeTab === "jadwal" && <JadwalView />}
          {activeTab === "nilai" && <RekapNilaiView />}
          {activeTab === "settings" && (
            <div className="soft-card p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <Settings className="w-5 h-5 text-slate-600" />
                <h2 className="text-base font-bold text-slate-800">
                  Pengaturan Identitas & Keamanan Sekolah
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    defaultValue="SMA Negeri 1 Prestasi Bangsa"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    defaultValue="20104892"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Toleransi Pindah Tab Siswa</label>
                  <select className="w-full p-2.5 rounded-xl border border-slate-200">
                    <option value="3">Maksimal 3x Pelanggaran (Rekomendasi)</option>
                    <option value="2">Ketat (2x Pelanggaran)</option>
                    <option value="5">Longgar (5x Pelanggaran)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Backup Database</label>
                  <button className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
                    Unduh File Backup JSON/SQL
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        onSend={handleBroadcastSend}
      />

      {/* Broadcast Toast */}
      {broadcastSentToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{broadcastSentToast}</span>
        </div>
      )}
    </div>
  );
}

