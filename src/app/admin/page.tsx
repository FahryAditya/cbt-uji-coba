"use client";

import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import ProctoringView from "@/components/admin/ProctoringView";
import BankSoalView from "@/components/admin/BankSoalView";
import JadwalView from "@/components/admin/JadwalView";
import RekapNilaiView from "@/components/admin/RekapNilaiView";
import SettingsView from "@/components/admin/SettingsView";
import BroadcastModal from "@/components/admin/BroadcastModal";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { CheckCircle2 } from "lucide-react";

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
          {activeTab === "settings" && <SettingsView />}
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

