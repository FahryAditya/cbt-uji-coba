"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import {
  FileText,
  FileUp,
  Download,
  Trash2,
  Search,
  FolderOpen,
  Loader2,
  Paperclip,
} from "lucide-react";

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SoftfileView() {
  const {
    bankSoalList,
    activeBankSoalId,
    setActiveBankSoalId,
    softfiles,
    fetchBankSoalFiles,
    uploadBankSoalFile,
    deleteBankSoalFile,
    setActiveTab,
  } = useCBTAdminStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<"ALL" | "PDF" | "WORD">("ALL");

  const selectedFolderId = activeBankSoalId || bankSoalList[0]?.id || "";
  const selectedFolder = bankSoalList.find((b) => b.id === selectedFolderId);

  useEffect(() => {
    if (selectedFolderId) {
      fetchBankSoalFiles(selectedFolderId);
    }
  }, [selectedFolderId, fetchBankSoalFiles]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return softfiles.filter((sf) => {
      if (formatFilter !== "ALL" && sf.format !== formatFilter) return false;
      if (q && !sf.namaFile.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [softfiles, searchQuery, formatFilter]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolderId) return;
    setIsUploading(true);
    await uploadBankSoalFile(selectedFolderId, file);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            Penyimpanan Cloud Cloudinary
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 mt-0.5 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-sky-600" />
            Softfile Soal (PDF &amp; Word)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simpan, kelola, dan unduh naskah asli soal (.pdf, .doc, .docx) per folder Bank Soal.
          </p>
        </div>
      </div>

      {bankSoalList.length === 0 ? (
        <div className="soft-card p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-700">
            Belum Ada Folder Bank Soal
          </div>
          <p className="text-xs text-slate-400">
            Buat folder Bank Soal terlebih dahulu sebelum mengunggah softfile PDF atau Word.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("bank-soal")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Buka Menu Bank Soal</span>
          </button>
        </div>
      ) : (
        <>
          {/* Pilih Folder & Upload Card */}
          <div className="soft-card p-4 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Folder Bank Soal Tujuan
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setActiveBankSoalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-base sm:text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  {bankSoalList.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.judul} ({folder.totalSoftfiles ?? 0} Softfile • {folder.totalSoal} Soal)
                    </option>
                  ))}
                </select>
              </div>

              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading || !selectedFolderId}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full md:w-auto min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold text-xs transition shadow-sm"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileUp className="w-4 h-4" />
                  )}
                  <span>
                    {isUploading ? "Mengunggah ke Cloudinary..." : "Upload Softfile PDF / Word"}
                  </span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Folder aktif:{" "}
              <strong className="text-slate-700">{selectedFolder?.judul || "-"}</strong> • Mendukung format{" "}
              <code className="text-rose-600 font-semibold">.pdf</code>,{" "}
              <code className="text-indigo-600 font-semibold">.doc</code>,{" "}
              <code className="text-indigo-600 font-semibold">.docx</code> (maks. 7 MB).
            </div>
          </div>

          {/* Filter & Daftar Softfile */}
          <div className="soft-card p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 sm:top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama softfile..."
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(["ALL", "PDF", "WORD"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormatFilter(fmt)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      formatFilter === fmt
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {fmt === "ALL" ? "Semua" : fmt}
                  </button>
                ))}
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">
                  {softfiles.length === 0
                    ? "Belum ada softfile PDF atau Word tersimpan di folder ini."
                    : "Tidak ada softfile yang cocok dengan pencarian/filter."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFiles.map((sf) => (
                  <div
                    key={sf.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-sky-300 transition flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 ${
                          sf.format === "PDF"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {sf.format}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-xs font-bold text-slate-800 break-words line-clamp-2"
                          title={sf.namaFile}
                        >
                          {sf.namaFile}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {formatFileSize(sf.ukuranByte)} •{" "}
                          {new Date(sf.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={sf.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh / Buka</span>
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = window.confirm(
                            `Hapus softfile "${sf.namaFile}" dari Cloudinary & arsip?`
                          );
                          if (ok) await deleteBankSoalFile(sf.id);
                        }}
                        title="Hapus Softfile"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
