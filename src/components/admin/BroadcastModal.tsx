"use client";

import React, { useState } from "react";
import { Send, X, AlertCircle } from "lucide-react";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export default function BroadcastModal({
  isOpen,
  onClose,
  onSend,
}: BroadcastModalProps) {
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Kirim Pengumuman / Broadcast
              </h3>
              <p className="text-[11px] text-slate-400">
                Pesan akan langsung muncul sebagai pop-up di layar peserta ujian.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Target Penerima:
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="all">Seluruh Siswa yang Sedang Ujian (Semua Kelas)</option>
              <option value="XII MIPA 1">Khusus Kelas XII MIPA 1</option>
              <option value="XII MIPA 2">Khusus Kelas XII MIPA 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Isi Pesan Pengumuman:
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contoh: Perhatian seluruh peserta, waktu tersisa 15 menit. Pastikan nomor 7 dicek kembali..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

