"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  Loader2,
  Users,
  Plus,
  ClipboardPaste,
  RefreshCw,
} from "lucide-react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import { apiRequest } from "@/lib/api";

interface ParsedStudentRow {
  nama: string;
  kelas: string;
}

interface RegisteredStudent {
  id: string;
  nama: string;
  username: string;
  kelas: string;
  createdAt: string;
}

export default function ImportSiswaView() {
  const { activeExamId, showToast, fetchClasses, fetchProctoring } = useCBTAdminStore();

  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Preview queue before importing to database
  const [previewRows, setPreviewRows] = useState<ParsedStudentRow[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Paste text mode
  const [pasteText, setPasteText] = useState("");

  // Single manual add
  const [manualNama, setManualNama] = useState("");
  const [manualKelas, setManualKelas] = useState("");
  const [isAddingSingle, setIsAddingSingle] = useState(false);

  // Filter daftar terdaftar
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");

  const loadStudents = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await apiRequest<{ success: boolean; data: RegisteredStudent[] }>("/api/siswa");
      if (res.data && Array.isArray(res.data)) {
        setRegisteredStudents(res.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat daftar siswa:", err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Parse CSV / TSV / semicolon lines
  const parseDelimitedLines = (raw: string): ParsedStudentRow[] => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: ParsedStudentRow[] = [];
    lines.forEach((line, idx) => {
      // Detect delimiter: tab, semicolon, or comma
      const delimiter = line.includes("\t")
        ? "\t"
        : line.includes(";")
        ? ";"
        : ",";
      const parts = line.split(delimiter).map((p) => p.replace(/^["']|["']$/g, "").trim());
      if (parts.length < 2) return;

      const col1 = parts[0];
      const col2 = parts[1];

      // Skip header line
      if (
        idx === 0 &&
        col1.toLowerCase().includes("nama") &&
        col2.toLowerCase().includes("kelas")
      ) {
        return;
      }

      if (col1 && col2) {
        parsed.push({ nama: col1, kelas: col2 });
      }
    });
    return parsed;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    setIsParsingFile(true);

    try {
      if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        const rows = parseDelimitedLines(text);
        if (rows.length === 0) {
          showToast("Tidak ada data Nama & Kelas yang terbaca dari file CSV.", "error");
        } else {
          setPreviewRows((prev) => [...prev, ...rows]);
          showToast(`${rows.length} data siswa berhasil dibaca dari ${file.name}!`, "success");
        }
      } else if (ext === "xlsx" || ext === "xls") {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = String(reader.result || "");
            const res = await apiRequest<{ success: boolean; data: ParsedStudentRow[] }>(
              "/api/siswa/parse-excel",
              {
                method: "POST",
                body: JSON.stringify({ fileBase64: base64 }),
              }
            );
            if (res.data && res.data.length > 0) {
              setPreviewRows((prev) => [...prev, ...res.data]);
              showToast(
                `${res.data.length} data siswa berhasil dibaca dari Excel (${file.name})!`,
                "success"
              );
            } else {
              showToast("Tidak ada data Nama & Kelas yang ditemukan di file Excel.", "error");
            }
          } catch (err: any) {
            showToast(err?.message || "Gagal membaca file Excel.", "error");
          } finally {
            setIsParsingFile(false);
          }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
        return;
      } else {
        showToast("Format file tidak didukung. Gunakan .xlsx atau .csv.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Gagal memproses file.", "error");
    } finally {
      setIsParsingFile(false);
      e.target.value = "";
    }
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      showToast("Tempelkan data Nama dan Kelas terlebih dahulu.", "error");
      return;
    }
    const rows = parseDelimitedLines(pasteText);
    if (rows.length === 0) {
      showToast(
        "Format tidak dikenali. Gunakan pemisah koma/tab per baris (contoh: Budi Santoso, XII MIPA 1).",
        "error"
      );
      return;
    }
    setPreviewRows((prev) => [...prev, ...rows]);
    setPasteText("");
    showToast(`${rows.length} baris data siswa ditambahkan ke daftar pratinjau!`, "success");
  };

  const handleImportToDb = async () => {
    if (previewRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await apiRequest<{
        success: boolean;
        message?: string;
        data?: { importedCount: number; skippedCount: number };
      }>("/api/siswa/import", {
        method: "POST",
        body: JSON.stringify({
          students: previewRows,
          ujianId: activeExamId || undefined,
        }),
      });
      showToast(
        res.message ||
          `${res.data?.importedCount || 0} siswa berhasil diimport ke database!`,
        "success"
      );
      setPreviewRows([]);
      await Promise.all([loadStudents(), fetchClasses(), fetchProctoring()]);
    } catch (err: any) {
      showToast(err?.message || "Gagal mengimport data siswa.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNama.trim() || !manualKelas.trim()) return;
    setIsAddingSingle(true);
    try {
      await apiRequest("/api/siswa/import", {
        method: "POST",
        body: JSON.stringify({
          students: [{ nama: manualNama.trim(), kelas: manualKelas.trim() }],
          ujianId: activeExamId || undefined,
        }),
      });
      showToast(`Siswa "${manualNama.trim()}" (${manualKelas.trim()}) berhasil ditambahkan!`, "success");
      setManualNama("");
      setManualKelas("");
      await Promise.all([loadStudents(), fetchClasses(), fetchProctoring()]);
    } catch (err: any) {
      showToast(err?.message || "Gagal menambahkan siswa.", "error");
    } finally {
      setIsAddingSingle(false);
    }
  };

  const handleDeleteStudent = async (id: string, nama: string) => {
    const confirmDelete = window.confirm(`Hapus data siswa "${nama}" dari database?`);
    if (!confirmDelete) return;
    try {
      await apiRequest(`/api/siswa/${id}`, { method: "DELETE" });
      setRegisteredStudents((prev) => prev.filter((s) => s.id !== id));
      showToast(`Data siswa "${nama}" berhasil dihapus.`, "success");
      fetchProctoring();
    } catch (err: any) {
      showToast(err?.message || "Gagal menghapus siswa.", "error");
    }
  };

  const handleDownloadTemplate = () => {
    const csv = "Nama,Kelas\nAhmad Fauzi,XII MIPA 1\nSiti Aminah,XII MIPA 2\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_data_siswa.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Template CSV (Nama & Kelas) berhasil diunduh!", "info");
  };

  const uniqueClasses = Array.from(
    new Set(registeredStudents.map((s) => s.kelas).filter((k) => k && k !== "-"))
  ).sort();

  const filteredStudents = registeredStudents.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = selectedClassFilter === "all" || s.kelas === selectedClassFilter;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            Manajemen Peserta Ujian
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 mt-0.5 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-sky-600" />
            Import Data Siswa (Nama &amp; Kelas)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah file Excel/CSV atau tempel daftar siswa berisi kolom Nama dan Kelas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-xs"
        >
          <Download className="w-4 h-4 text-sky-600" />
          <span>Unduh Template CSV</span>
        </button>
      </div>

      {/* Grid Input: Upload File + Paste dari Excel + Tambah Satuan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Upload File .xlsx / .csv */}
        <div className="soft-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>1. Upload File Excel / CSV</span>
          </div>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-6 cursor-pointer bg-slate-50/50 hover:bg-sky-50/30 transition text-center">
            {isParsingFile ? (
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-sky-500 mb-2" />
            )}
            <span className="text-xs font-bold text-slate-700">
              {isParsingFile ? "Membaca file..." : "Pilih File .xlsx atau .csv"}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              Kolom wajib: <strong>Nama</strong> &amp; <strong>Kelas</strong>
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isParsingFile}
            />
          </label>
        </div>

        {/* 2. Copy-Paste Langsung dari Excel / Sheets */}
        <div className="soft-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <ClipboardPaste className="w-4 h-4 text-indigo-600" />
            <span>2. Tempel dari Excel / Teks</span>
          </div>
          <textarea
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Contoh (1 siswa per baris):\nAhmad Fauzi, XII MIPA 1\nSiti Aminah, XII MIPA 2"}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={handleParsePaste}
            className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
          >
            Baca &amp; Masukkan ke Pratinjau
          </button>
        </div>

        {/* 3. Tambah 1 Siswa Manual */}
        <form onSubmit={handleAddSingle} className="soft-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Plus className="w-4 h-4 text-sky-600" />
            <span>3. Tambah Siswa Satuan</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                value={manualNama}
                onChange={(e) => setManualNama(e.target.value)}
                placeholder="Contoh: Rizky Pratama"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kelas / Jurusan
              </label>
              <input
                type="text"
                value={manualKelas}
                onChange={(e) => setManualKelas(e.target.value)}
                placeholder="Contoh: XII MIPA 1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isAddingSingle}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            {isAddingSingle ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            <span>{isAddingSingle ? "Menyimpan..." : "Simpan Siswa"}</span>
          </button>
        </form>
      </div>

      {/* Pratinjau Data Sebelum Import ke Database */}
      {previewRows.length > 0 && (
        <div className="soft-card p-5 border-2 border-sky-400/40 bg-sky-50/20 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                Pratinjau Data Siap Import ({previewRows.length} Siswa)
              </h3>
              <p className="text-xs text-slate-500">
                Periksa kembali kolom Nama dan Kelas sebelum menyimpan ke database.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewRows([])}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs transition"
              >
                Bersihkan
              </button>
              <button
                type="button"
                onClick={handleImportToDb}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs transition shadow-sm"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isImporting ? "Mengimport..." : "Import ke Database"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">Nama Siswa</th>
                  <th className="py-2.5 px-4">Kelas</th>
                  <th className="py-2.5 px-4 w-16 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2 px-4 font-bold text-slate-800">{row.nama}</td>
                    <td className="py-2 px-4 text-slate-600">{row.kelas}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewRows((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daftar Siswa Terdaftar di Database */}
      <div className="soft-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Data Siswa Terdaftar ({registeredStudents.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / kelas..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                await loadStudents();
                showToast("Daftar siswa diperbarui.", "info");
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Refresh data siswa"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingList ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-sky-500" />
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Belum ada data siswa terdaftar. Silakan upload file Excel/CSV atau tambah manual di atas.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{s.nama}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(s.id, s.nama)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Hapus siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
