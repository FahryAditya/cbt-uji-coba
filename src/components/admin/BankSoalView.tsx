"use client";

import React, { useRef, useState } from "react";
import {
  useCBTAdminStore,
  BankFolderItem,
  QuestionOption,
  QuestionItem,
} from "@/stores/cbt-admin";
import {
  Plus,
  Trash2,
  Check,
  FileText,
  Sparkles,
  Pencil,
  X,
  FileUp,
  Folder,
  FolderPlus,
  FolderOpen,
  Play,
  ArrowLeft,
  Save,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";
import ImportWordPanel from "./ImportWordPanel";
import StartExamModal from "./StartExamModal";

type ViewMode = "folders" | "folder-files" | "builder";
type BuilderTab = "manual" | "word";

export default function BankSoalView() {
  const {
    questions,
    bankSoalList,
    activeBankSoalId,
    setActiveBankSoalId,
    createBankFolder,
    renameBankFolder,
    deleteBankFolder,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    showToast,
  } = useCBTAdminStore();

  const [viewMode, setViewMode] = useState<ViewMode>("folders");
  const [builderTab, setBuilderTab] = useState<BuilderTab>("manual");
  const [savedInBuilderCount, setSavedInBuilderCount] = useState(0);

  // Create & Rename folder states
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Start Exam modal target folder
  const [startTargetFolder, setStartTargetFolder] = useState<BankFolderItem | null>(null);

  // Manual question builder state
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const defaultABCD: QuestionOption[] = [
    { label: "A", text: "", isCorrect: true },
    { label: "B", text: "", isCorrect: false },
    { label: "C", text: "", isCorrect: false },
    { label: "D", text: "", isCorrect: false },
  ];
  const [options, setOptions] = useState<QuestionOption[]>(defaultABCD);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Pending Word import state inside builder
  const [pendingWordCount, setPendingWordCount] = useState(0);
  const pendingWordSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const [isSavingWord, setIsSavingWord] = useState(false);

  // Edit existing question modal
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editText, setEditText] = useState("");
  const [editPoints, setEditPoints] = useState(1);
  const [editOptions, setEditOptions] = useState<QuestionOption[]>([]);

  const activeFolder = bankSoalList.find((b) => b.id === activeBankSoalId);

  const handleOpenFolder = (folder: BankFolderItem) => {
    setActiveBankSoalId(folder.id);
    setViewMode("folder-files");
    showToast(`Membuka folder "${folder.judul}"`, "info");
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    const createdId = await createBankFolder(
      newFolderName.trim(),
      "Pendidikan Pancasila",
      newFolderDesc.trim()
    );
    setIsCreatingFolder(false);
    if (createdId) {
      setNewFolderName("");
      setNewFolderDesc("");
      setShowNewFolderForm(false);
    }
  };

  const handleSaveRenameFolder = async (folderId: string) => {
    if (!renameValue.trim()) return;
    const ok = await renameBankFolder(folderId, renameValue.trim());
    if (ok) {
      setRenamingFolderId(null);
      setRenameValue("");
    }
  };

  const handleDeleteFolder = async (folder: BankFolderItem) => {
    const confirmed = window.confirm(
      `Hapus folder "${folder.judul}" (${folder.totalSoal} soal)? Tindakan ini permanen.`
    );
    if (!confirmed) return;
    await deleteBankFolder(folder.id);
  };

  // Manual option helpers
  const setCorrectOption = (index: number) => {
    setOptions(options.map((opt, i) => ({ ...opt, isCorrect: i === index })));
  };
  const handleOptionChange = (index: number, text: string) => {
    setOptions(options.map((opt, i) => (i === index ? { ...opt, text } : opt)));
  };
  const addMoreOption = () => {
    if (options.length >= 6) return;
    const nextLabel = String.fromCharCode(65 + options.length);
    setOptions([...options, { label: nextLabel, text: "", isCorrect: false }]);
  };
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOpts = options
      .filter((_, i) => i !== index)
      .map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) }));
    if (options[index].isCorrect && newOpts.length > 0) {
      newOpts[0].isCorrect = true;
    }
    setOptions(newOpts);
  };

  const resetManualForm = () => {
    setQuestionText("");
    setOptions([
      { label: "A", text: "", isCorrect: true },
      { label: "B", text: "", isCorrect: false },
      { label: "C", text: "", isCorrect: false },
      { label: "D", text: "", isCorrect: false },
    ]);
  };

  const saveManualDraftIfPresent = async (): Promise<"saved" | "empty" | "invalid"> => {
    const hasText = questionText.trim().length > 0;
    const filledOptions = options.filter((o) => o.text.trim().length > 0);

    if (!hasText && filledOptions.length === 0) {
      return "empty";
    }
    if (!hasText || options.some((o) => !o.text.trim())) {
      showToast(
        "Lengkapi teks pertanyaan dan semua opsi pilihan jawaban sebelum Save.",
        "error"
      );
      return "invalid";
    }

    setIsSavingManual(true);
    const ok = await addQuestion({
      text: questionText.trim(),
      points,
      options: options.map((o) => ({ ...o, text: o.text.trim() })),
    });
    setIsSavingManual(false);

    if (!ok) return "invalid";
    setSavedInBuilderCount((c) => c + 1);
    resetManualForm();
    return "saved";
  };

  const handleSaveStay = async () => {
    if (builderTab === "manual") {
      const res = await saveManualDraftIfPresent();
      if (res === "empty") {
        showToast("Ketik pertanyaan & pilihan jawaban terlebih dahulu.", "error");
      }
      return;
    }

    if (builderTab === "word") {
      if (pendingWordCount > 0 && pendingWordSaveRef.current) {
        setIsSavingWord(true);
        const ok = await pendingWordSaveRef.current();
        setIsSavingWord(false);
        if (ok) {
          setPendingWordCount(0);
        }
      } else {
        showToast(
          "Unggah file .docx atau tempel teks soal dan klik Proses terlebih dahulu.",
          "error"
        );
      }
    }
  };

  const handleSaveAndExit = async () => {
    // 1. Jika ada draft manual yang terisi, simpan terlebih dahulu
    if (builderTab === "manual") {
      const manualResult = await saveManualDraftIfPresent();
      if (manualResult === "invalid") return;
    }

    // 2. Jika ada hasil parse Word yang belum disimpan, simpan terlebih dahulu
    if (pendingWordCount > 0 && pendingWordSaveRef.current) {
      setIsSavingWord(true);
      const ok = await pendingWordSaveRef.current();
      setIsSavingWord(false);
      if (!ok) return;
      setPendingWordCount(0);
    }

    setSavedInBuilderCount(0);
    setViewMode("folder-files");
    showToast(
      `Keluar dari editor — seluruh soal di folder "${activeFolder?.judul || ""}" siap ditampilkan.`,
      "success"
    );
  };

  // Edit existing modal helpers
  const openEditModal = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditText(q.text);
    setEditPoints(q.points);
    setEditOptions(JSON.parse(JSON.stringify(q.options)));
  };
  const closeEditModal = () => setEditingQuestion(null);
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editText.trim()) return;
    await updateQuestion(editingQuestion.id, {
      text: editText,
      points: editPoints,
      options: editOptions,
    });
    closeEditModal();
  };
  const setEditCorrectOption = (index: number) => {
    setEditOptions(editOptions.map((opt, i) => ({ ...opt, isCorrect: i === index })));
  };
  const handleEditOptionChange = (index: number, text: string) => {
    setEditOptions(
      editOptions.map((opt, i) => (i === index ? { ...opt, text } : opt))
    );
  };
  const addEditOption = () => {
    if (editOptions.length >= 6) return;
    const nextLabel = String.fromCharCode(65 + editOptions.length);
    setEditOptions([...editOptions, { label: nextLabel, text: "", isCorrect: false }]);
  };
  const removeEditOption = (index: number) => {
    if (editOptions.length <= 2) return;
    const newOpts = editOptions
      .filter((_, i) => i !== index)
      .map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) }));
    if (editOptions[index].isCorrect && newOpts.length > 0) {
      newOpts[0].isCorrect = true;
    }
    setEditOptions(newOpts);
  };

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* VIEW 1: EXPLORER FOLDER BANK SOAL                                 */}
      {/* ================================================================= */}
      {viewMode === "folders" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Manajemen Paket & Arsip Soal
              </span>
              <h2 className="text-xl font-extrabold text-slate-800 mt-0.5 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                Bank Soal — Folder & File
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Buat folder kustom untuk mengelompokkan soal. <strong>Klik 2 kali</strong> pada folder untuk masuk, membuat soal, atau menekan <strong>Start</strong> ujian.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewFolderForm(!showNewFolderForm)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{showNewFolderForm ? "Tutup Form Folder" : "+ Buat Folder Baru"}</span>
            </button>
          </div>

          {/* Form Buat Folder Kustom */}
          {showNewFolderForm && (
            <form
              onSubmit={handleCreateFolderSubmit}
              className="soft-card p-5 border-2 border-indigo-500/20 bg-indigo-50/15 space-y-4"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span>Buat Folder Bank Soal Baru (Nama Kustom)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Folder *</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Contoh: PAS Ganjil XII — Pendidikan Pancasila"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Keterangan / Deskripsi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    placeholder="Contoh: Paket soal utama kelas XII seluruh jurusan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm"
                >
                  {isCreatingFolder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderPlus className="w-4 h-4" />
                  )}
                  <span>Simpan Folder</span>
                </button>
              </div>
            </form>
          )}

          {/* Grid Folder */}
          {bankSoalList.length === 0 ? (
            <div className="soft-card p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Folder className="w-7 h-7" />
              </div>
              <div className="text-sm font-bold text-slate-700">Belum Ada Folder Bank Soal</div>
              <p className="text-xs text-slate-400">
                Klik tombol <strong>+ Buat Folder Baru</strong> untuk mulai menata soal ujian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankSoalList.map((folder) => {
                const isRenaming = renamingFolderId === folder.id;
                const activeExamBadge = folder.usedInExams?.find(
                  (u) => u.status === "AKTIF"
                );
                return (
                  <div
                    key={folder.id}
                    onDoubleClick={() => {
                      if (!isRenaming) handleOpenFolder(folder);
                    }}
                    title="Klik 2 kali untuk masuk ke folder"
                    className="soft-card p-5 border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition cursor-pointer select-none flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition">
                          <Folder className="w-6 h-6 fill-amber-400/30" />
                        </div>

                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingFolderId(folder.id);
                              setRenameValue(folder.judul);
                            }}
                            title="Ganti nama folder"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFolder(folder)}
                            title="Hapus folder"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isRenaming ? (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-indigo-300 text-xs font-bold text-slate-800 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRenameFolder(folder.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingFolderId(null)}
                            className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2">
                            {folder.judul}
                          </h3>
                          {folder.deskripsi && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                              {folder.deskripsi}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                          <FileText className="w-3 h-3" />
                          {folder.totalSoal} File Soal
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold">
                          {folder.kode}
                        </span>
                        {activeExamBadge && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            Aktif • {activeExamBadge.token}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-slate-400 font-medium">
                        Klik 2x untuk membuka
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenFolder(folder)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold transition"
                        >
                          Buka
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartTargetFolder(folder)}
                          disabled={folder.totalSoal === 0}
                          title={
                            folder.totalSoal === 0
                              ? "Tambahkan soal dulu sebelum Start"
                              : "Gunakan folder soal ini ke sesi ujian"
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[11px] font-bold transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* VIEW 2: DI DALAM FOLDER (DAFTAR FILE SOAL + BUAT SOAL + START)    */}
      {/* ================================================================= */}
      {viewMode === "folder-files" && (
        <>
          {/* Breadcrumb & Header Folder */}
          <div className="soft-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("folders")}
                  className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-indigo-600 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Semua Folder</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                  {activeFolder?.judul || "Folder Bank Soal"}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                Isi Folder — {questions.length} File Soal Tersimpan
              </h2>
              <p className="text-xs text-slate-500">
                Klik <strong>Buat Soal</strong> untuk menambah soal (Import .docx / Tulis Manual), atau klik <strong>Start</strong> untuk memakai soal ini pada sesi ujian.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSavedInBuilderCount(0);
                  setPendingWordCount(0);
                  setBuilderTab("manual");
                  setViewMode("builder");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Soal</span>
              </button>

              <button
                type="button"
                disabled={!activeFolder || questions.length === 0}
                onClick={() => activeFolder && setStartTargetFolder(activeFolder)}
                title={
                  questions.length === 0
                    ? "Buat/simpan minimal 1 soal dulu untuk Start"
                    : "Gunakan soal ini di sesi ujian dan atur token"
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs transition shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Ujian</span>
              </button>
            </div>
          </div>

          {/* Daftar File Soal */}
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="soft-card p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-700">
                  Folder &quot;{activeFolder?.judul}&quot; Masih Kosong
                </div>
                <p className="text-xs text-slate-400">
                  Klik tombol <strong>Buat Soal</strong> untuk menulis manual atau mengimport soal dari file Microsoft Word (`.docx`).
                </p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="soft-card p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                        <FileText className="w-3.5 h-3.5" />
                        File Soal #{q.number}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Bobot: {q.points} Poin
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(q)}
                        title="Edit File Soal & Kunci Jawaban"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        title="Hapus File Soal"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-4 whitespace-pre-line">
                    {q.text}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs ${
                          opt.isCorrect
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                            : "bg-slate-50/70 border-slate-200/80 text-slate-700"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md font-bold flex items-center justify-center shrink-0 ${
                            opt.isCorrect
                              ? "bg-emerald-500 text-white"
                              : "bg-white border border-slate-200 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {opt.isCorrect && (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                            Kunci
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* VIEW 3: EDITOR PEMBUATAN SOAL (IMPORT DOCX / MANUAL + SAVE&EXIT)  */}
      {/* ================================================================= */}
      {viewMode === "builder" && (
        <div className="space-y-5">
          {/* Header Editor dengan Tombol Save & Exit */}
          <div className="soft-card p-4 sm:p-5 border-2 border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Mode Pembuatan Soal
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  Folder: {activeFolder?.judul}
                </span>
                {savedInBuilderCount > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    +{savedInBuilderCount} soal tersimpan
                  </span>
                )}
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 mt-1.5">
                Buat Soal Baru (Tulis Manual / Import Word .docx)
              </h2>
              <p className="text-xs text-slate-500">
                Jangan lupa klik <strong>Save</strong> untuk menyimpan, dan klik <strong>Save &amp; Exit</strong> bila ingin keluar kembali ke folder agar soal tampil.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSavingManual || isSavingWord}
                onClick={handleSaveStay}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs transition shadow-sm"
              >
                {isSavingManual || isSavingWord ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save</span>
              </button>

              <button
                type="button"
                disabled={isSavingManual || isSavingWord}
                onClick={handleSaveAndExit}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs transition shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Save &amp; Exit</span>
              </button>
            </div>
          </div>

          {/* Switch Tab: Tulis Manual vs Import Word (.docx) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBuilderTab("manual")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                builderTab === "manual"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tulis Manual</span>
            </button>

            <button
              type="button"
              onClick={() => setBuilderTab("word")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                builderTab === "word"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>
                Import dari Word (.docx)
                {pendingWordCount > 0 ? ` (${pendingWordCount} siap disimpan)` : ""}
              </span>
            </button>
          </div>

          {builderTab === "manual" ? (
            <div className="soft-card p-5 sm:p-6 border border-indigo-200/80 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Form Tulis Soal Pilihan Ganda Manual
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Bobot Nilai:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={points}
                    onChange={(e) => setPoints(parseFloat(e.target.value) || 1)}
                    className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pertanyaan / Narasi Soal
                </label>
                <textarea
                  rows={4}
                  placeholder="Ketik pertanyaan soal di sini... (Dapat memuat wacana, narasi, atau pertanyaan langsung)"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pilihan Jawaban (Klik huruf untuk menandai Kunci Jawaban Benar)
                  </label>
                  <button
                    type="button"
                    onClick={addMoreOption}
                    disabled={options.length >= 6}
                    className="text-xs text-indigo-600 font-bold hover:underline disabled:opacity-40"
                  >
                    + Tambah Opsi ({String.fromCharCode(65 + options.length)})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        opt.isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrectOption(idx)}
                        title={
                          opt.isCorrect ? "Kunci Jawaban Benar" : "Jadikan Kunci Jawaban"
                        }
                        className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition ${
                          opt.isCorrect
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Ketik teks pilihan jawaban ${opt.label}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />

                      {opt.isCorrect && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          Kunci Jawaban
                        </span>
                      )}

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Hapus opsi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ImportWordPanel
              hideFooterActions
              onClose={() => {}}
              onSaved={(count) => setSavedInBuilderCount((c) => c + count)}
              onPendingChange={(count, handler) => {
                setPendingWordCount(count);
                pendingWordSaveRef.current = handler;
              }}
            />
          )}

          {/* Footer Save & Save & Exit Bar */}
          <div className="soft-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 border border-slate-200">
            <span className="text-xs text-slate-500">
              {builderTab === "word" && pendingWordCount > 0
                ? `${pendingWordCount} soal dari Word siap disimpan ke folder "${activeFolder?.judul}".`
                : "Tekan Save untuk menyimpan soal sekarang, atau Save & Exit untuk menyimpan & kembali melihat daftar soal."}
            </span>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSavingManual || isSavingWord}
                onClick={handleSaveStay}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>
                  {builderTab === "word" && pendingWordCount > 0
                    ? `Save (${pendingWordCount} Soal)`
                    : "Save"}
                </span>
              </button>
              <button
                type="button"
                disabled={isSavingManual || isSavingWord}
                onClick={handleSaveAndExit}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs transition shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Save &amp; Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Start Exam */}
      {startTargetFolder && (
        <StartExamModal
          folder={startTargetFolder}
          onClose={() => setStartTargetFolder(null)}
        />
      )}

      {/* Modal Edit Butir Soal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Edit File Soal #{editingQuestion.number}
                </h3>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Bobot Nilai:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={editPoints}
                  onChange={(e) => setEditPoints(parseFloat(e.target.value) || 1)}
                  className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pertanyaan / Narasi Soal
                </label>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pilihan Jawaban (Tentukan Kunci Jawaban Benar)
                  </label>
                  <button
                    type="button"
                    onClick={addEditOption}
                    disabled={editOptions.length >= 6}
                    className="text-xs text-indigo-600 font-bold hover:underline disabled:opacity-40"
                  >
                    + Tambah Opsi ({String.fromCharCode(65 + editOptions.length)})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        opt.isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setEditCorrectOption(idx)}
                        title={
                          opt.isCorrect ? "Kunci Jawaban Benar" : "Jadikan Kunci Jawaban"
                        }
                        className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition ${
                          opt.isCorrect
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleEditOptionChange(idx, e.target.value)}
                        placeholder={`Teks pilihan jawaban untuk opsi ${opt.label}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />

                      {opt.isCorrect && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          Kunci Jawaban
                        </span>
                      )}

                      {editOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEditOption(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Hapus opsi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
