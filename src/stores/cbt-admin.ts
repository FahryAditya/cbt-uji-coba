import { create } from "zustand";
import { apiRequest } from "@/lib/api";

export interface StudentProctor {
  id: string;
  sesiId?: string;
  siswaId?: string;
  name: string;
  nis: string;
  class: string;
  status: "online" | "idle" | "offline" | "locked" | "completed";
  isLocked?: boolean;
  isLoggedIn?: boolean;
  progress: number;
  totalQ: number;
  violations: number;
  timeLeft: string;
}

export interface QuestionOption {
  label: string; // "A", "B", "C", "D", "E"
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

export interface QuestionItem {
  id: string;
  number: number;
  text: string;
  imageUrl?: string;
  options: QuestionOption[];
  points: number;
}

export interface ExamPackage {
  id: string;
  title: string;
  subject: string;
  targetClasses: string[];
  token: string;
  tokenSecondsRemaining?: number;
  tokenExpiresAt?: string;
  durationMinutes: number;
  totalQuestions: number;
  status: "DRAFT" | "AKTIF" | "SELESAI";
  kkm?: number;
  tampilkanNilai?: boolean;
}

interface CBTAdminState {
  // Navigation & Active tab
  activeTab: "proctoring" | "import-siswa" | "bank-soal" | "jadwal" | "nilai" | "settings";
  setActiveTab: (tab: "proctoring" | "import-siswa" | "bank-soal" | "jadwal" | "nilai" | "settings") => void;

  // Active Session & Token
  activeExamId: string;
  setActiveExamId: (id: string) => void;
  activeToken: string;
  tokenSecondsRemaining: number;
  decrementTokenTimer: () => void;
  regenerateToken: () => Promise<void>;
  activeExamTitle: string;
  setActiveExamTitle: (title: string) => void;

  // Proctoring Students Data
  students: StudentProctor[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: "all" | "online" | "not_started" | "locked" | "completed";
  setFilterStatus: (status: "all" | "online" | "not_started" | "locked" | "completed") => void;
  kpi: {
    activeStudents: number;
    totalStudents: number;
    notLoggedInCount: number;
    lockedCount: number;
    completedCount: number;
    avgProgress: number;
    totalViolations: number;
    globalTimer: string;
  };

  // Proctor Actions
  resetStudentLogin: (studentId: string, sesiId?: string) => Promise<void>;
  unlockStudent: (studentId: string, sesiId?: string) => Promise<void>;
  resetStudentAnswers: (studentId: string, sesiId?: string) => Promise<void>;
  addStudentTime: (studentId: string, minutes?: number) => Promise<void>;
  warnStudent: (studentId: string) => Promise<void>;
  broadcastMessage: string;
  setBroadcastMessage: (msg: string) => void;
  sendBroadcast: (message: string) => Promise<void>;

  // Class Management
  availableClasses: string[];
  addNewClass: (className: string) => Promise<void>;

  // Questions Management
  questions: QuestionItem[];
  bankSoalList: { id: string; kode: string; judul: string; mapel: string; totalSoal: number }[];
  activeBankSoalId: string;
  setActiveBankSoalId: (id: string) => void;
  addQuestion: (q: Omit<QuestionItem, "id" | "number">) => Promise<void>;
  importQuestionsBulk: (
    bankSoalId: string,
    questions: {
      pertanyaan: string;
      bobotNilai: number;
      options: { label: string; text: string; isCorrect: boolean }[];
    }[],
    replaceExisting?: boolean
  ) => Promise<boolean>;
  updateQuestion: (id: string, q: Partial<QuestionItem>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  // Exams List
  exams: ExamPackage[];
  createExam: (exam: {
    title: string;
    subject: string;
    targetClasses: string[];
    durationMinutes: number;
    token?: string;
    totalQuestions?: number;
    status?: "DRAFT" | "AKTIF" | "SELESAI";
  }) => Promise<void>;
  updateExamSettings: (
    ujianId: string,
    settings: { kkm?: number; tampilkanNilai?: boolean }
  ) => Promise<boolean>;

  // Global Feedback Toast
  toast: { id: number; type: "success" | "error" | "info"; message: string } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;

  // Loading & Sync
  isLoading: boolean;
  fetchAllData: () => Promise<void>;
  fetchProctoring: () => Promise<void>;
  fetchExams: () => Promise<void>;
  fetchBankSoal: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchQuestions: (bankSoalId?: string) => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useCBTAdminStore = create<CBTAdminState>((set, get) => ({
  toast: null,
  showToast: (message, type = "success") => {
    const id = Date.now();
    set({ toast: { id, type, message } });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, 3800);
  },
  clearToast: () => set({ toast: null }),

  activeTab: "proctoring",
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeExamId: "",
  setActiveExamId: (id) => {
    const exam = get().exams.find((e) => e.id === id);
    set({
      activeExamId: id,
      activeExamTitle: exam ? exam.title : "",
      activeToken: exam ? exam.token : "",
      tokenSecondsRemaining: exam?.tokenSecondsRemaining ?? 600,
    });
    if (exam) {
      get().showToast(`Menampilkan ujian: ${exam.title}`, "info");
    }
    get().fetchProctoring();
  },

  activeToken: "",
  tokenSecondsRemaining: 600,
  decrementTokenTimer: () => {
    const current = get().tokenSecondsRemaining;
    if (current <= 1) {
      get().fetchExams();
    } else {
      set({ tokenSecondsRemaining: current - 1 });
    }
  },
  regenerateToken: async () => {
    const { activeExamId } = get();
    if (!activeExamId) return;
    try {
      const res = await apiRequest<{
        success: boolean;
        data: { token: string; tokenSecondsRemaining?: number; tokenExpiresAt?: string };
      }>(`/api/ujian/${activeExamId}/token`, { method: "PATCH" });
      if (res.data?.token) {
        set({
          activeToken: res.data.token,
          tokenSecondsRemaining: res.data.tokenSecondsRemaining ?? 600,
        });
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === activeExamId
              ? {
                  ...e,
                  token: res.data.token,
                  tokenSecondsRemaining: res.data.tokenSecondsRemaining ?? 600,
                }
              : e
          ),
        }));
        get().showToast(`Token baru (${res.data.token}) berhasil diaktifkan!`, "success");
      }
    } catch (err: any) {
      get().showToast(err?.message || "Gagal memperbarui token ujian.", "error");
    }
  },

  activeExamTitle: "",
  setActiveExamTitle: (title) => set({ activeExamTitle: title }),

  // Clean empty initial state
  students: [],
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  filterStatus: "all",
  setFilterStatus: (status) => set({ filterStatus: status }),

  kpi: {
    activeStudents: 0,
    totalStudents: 0,
    notLoggedInCount: 0,
    lockedCount: 0,
    completedCount: 0,
    avgProgress: 0,
    totalViolations: 0,
    globalTimer: "00:00:00",
  },

  unlockStudent: async (studentId: string, sesiId?: string) => {
    try {
      await apiRequest("/api/proctoring/unlock", {
        method: "POST",
        body: JSON.stringify({ studentId, sesiId }),
      });
      set((state) => ({
        students: state.students.map((s) =>
          (s.siswaId === studentId || s.id === studentId || s.sesiId === sesiId)
            ? { ...s, status: "online", isLocked: false, violations: 2 }
            : s
        ),
      }));
      await get().fetchProctoring();
      get().showToast("Kunci ujian siswa berhasil dibuka kembali!", "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal membuka kunci ujian siswa.", "error");
    }
  },

  resetStudentAnswers: async (studentId: string, sesiId?: string) => {
    const { activeExamId } = get();
    try {
      await apiRequest("/api/proctoring/reset-answers", {
        method: "POST",
        body: JSON.stringify({ studentId, sesiId, ujianId: activeExamId }),
      });
      set((state) => ({
        students: state.students.map((s) =>
          (s.siswaId === studentId || s.id === studentId || s.sesiId === sesiId)
            ? { ...s, progress: 0 }
            : s
        ),
      }));
      await get().fetchProctoring();
      get().showToast("Seluruh jawaban siswa berhasil di-reset.", "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal mereset jawaban siswa.", "error");
    }
  },

  resetStudentLogin: async (studentId: string) => {
    const { activeExamId } = get();
    try {
      await apiRequest("/api/proctoring/reset-login", {
        method: "POST",
        body: JSON.stringify({ studentId, ujianId: activeExamId }),
      });
      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? { ...s, status: "idle" } : s
        ),
      }));
      get().showToast("Sesi login siswa berhasil di-reset.", "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal mereset login siswa.", "error");
    }
  },

  addStudentTime: async (studentId: string, minutes = 10) => {
    const { activeExamId } = get();
    try {
      await apiRequest("/api/proctoring/add-time", {
        method: "POST",
        body: JSON.stringify({ studentId, ujianId: activeExamId, additionalMinutes: minutes }),
      });
      set((state) => ({
        students: state.students.map((s) => {
          if (s.id !== studentId) return s;
          const parts = s.timeLeft.split(":").map(Number);
          if (parts.length === 3) {
            const totalSecs = parts[0] * 3600 + (parts[1] + minutes) * 60 + parts[2];
            const h = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
            const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
            const sec = String(totalSecs % 60).padStart(2, "0");
            return { ...s, timeLeft: `${h}:${m}:${sec}` };
          }
          return s;
        }),
      }));
      get().showToast(`Waktu ujian siswa ditambah +${minutes} menit.`, "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal menambah waktu ujian siswa.", "error");
    }
  },

  warnStudent: async (studentId: string) => {
    const { activeExamId } = get();
    try {
      await apiRequest("/api/proctoring/warn", {
        method: "POST",
        body: JSON.stringify({ studentId, ujianId: activeExamId, note: "Peringatan keluar tab ujian" }),
      });
      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? { ...s, violations: s.violations + 1 } : s
        ),
      }));
      get().showToast("Peringatan resmi telah dikirim ke siswa.", "info");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal mengirim peringatan ke siswa.", "error");
    }
  },

  broadcastMessage: "",
  setBroadcastMessage: (msg) => set({ broadcastMessage: msg }),
  sendBroadcast: async (message: string) => {
    const { activeExamId } = get();
    if (!message.trim()) return;
    try {
      await apiRequest("/api/proctoring/broadcast", {
        method: "POST",
        body: JSON.stringify({ ujianId: activeExamId, message }),
      });
      set({ broadcastMessage: "" });
      get().showToast("Pesan broadcast berhasil dikirim ke peserta!", "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal mengirim pesan broadcast.", "error");
    }
  },

  availableClasses: [],
  addNewClass: async (className: string) => {
    const trimmed = className.trim();
    if (!trimmed) return;
    try {
      await apiRequest("/api/ujian/classes", {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });
      set((state) => ({
        availableClasses: state.availableClasses.includes(trimmed)
          ? state.availableClasses
          : [...state.availableClasses, trimmed],
      }));
      get().showToast(`Kelas "${trimmed}" berhasil ditambahkan!`, "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal menambahkan kelas baru.", "error");
    }
  },

  questions: [],
  bankSoalList: [],
  activeBankSoalId: "",
  setActiveBankSoalId: (id: string) => {
    set({ activeBankSoalId: id });
    const bank = get().bankSoalList.find((b) => b.id === id);
    if (bank) {
      get().showToast(`Membuka bank soal: ${bank.judul}`, "info");
    }
    get().fetchQuestions(id);
  },
  addQuestion: async (q) => {
    const { activeBankSoalId } = get();
    if (!activeBankSoalId) {
      get().showToast("Pilih paket bank soal terlebih dahulu.", "error");
      return;
    }
    try {
      await apiRequest(`/api/bank-soal/${activeBankSoalId}/soal`, {
        method: "POST",
        body: JSON.stringify({
          pertanyaan: q.text,
          bobotNilai: q.points,
          gambarUrl: q.imageUrl || null,
          options: q.options.map((opt) => ({
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
            imageUrl: opt.imageUrl || null,
          })),
        }),
      });
      await get().fetchQuestions(activeBankSoalId);
      get().showToast("Butir soal baru berhasil ditambahkan!", "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal menyimpan soal baru.", "error");
    }
  },

  importQuestionsBulk: async (bankSoalId, questions, replaceExisting = false) => {
    if (!bankSoalId) {
      get().showToast("Pilih paket bank soal terlebih dahulu.", "error");
      return false;
    }
    try {
      const res = await apiRequest<{
        success: boolean;
        message?: string;
        data?: { importedCount: number };
      }>(`/api/bank-soal/${bankSoalId}/soal/import`, {
        method: "POST",
        body: JSON.stringify({ questions, replaceExisting }),
      });
      await Promise.all([
        get().fetchQuestions(bankSoalId),
        get().fetchBankSoal(),
      ]);
      get().showToast(
        res.message || `${questions.length} butir soal berhasil diimport dari Word!`,
        "success"
      );
      return true;
    } catch (err: any) {
      get().showToast(err?.message || "Gagal mengimport soal dari Word.", "error");
      return false;
    }
  },

  deleteQuestion: async (id: string) => {
    try {
      await apiRequest(`/api/bank-soal/soal/${id}`, {
        method: "DELETE",
      });
      set((state) => ({
        questions: state.questions
          .filter((q) => q.id !== id)
          .map((q, idx) => ({ ...q, number: idx + 1 })),
      }));
      get().showToast("Butir soal berhasil dihapus.", "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal menghapus butir soal.", "error");
    }
  },

  updateQuestion: async (id: string, q: Partial<QuestionItem>) => {
    const { activeBankSoalId } = get();
    try {
      await apiRequest(`/api/bank-soal/soal/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          pertanyaan: q.text,
          bobotNilai: q.points,
          gambarUrl: q.imageUrl || null,
          options: q.options?.map((opt) => ({
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
            imageUrl: opt.imageUrl || null,
          })),
        }),
      });
      if (activeBankSoalId) {
        await get().fetchQuestions(activeBankSoalId);
      }
      get().showToast("Perubahan soal berhasil disimpan!", "success");
    } catch (err: any) {
      get().showToast(err?.message || "Gagal memperbarui soal.", "error");
    }
  },

  exams: [],
  createExam: async (examData) => {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>("/api/ujian", {
        method: "POST",
        body: JSON.stringify(examData),
      });
      if (res.data) {
        await get().fetchExams();
        get().showToast(`Paket ujian "${examData.title}" berhasil diterbitkan!`, "success");
      }
    } catch (err: any) {
      get().showToast(err?.message || "Gagal menerbitkan paket ujian.", "error");
    }
  },

  updateExamSettings: async (ujianId, settings) => {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: { id: string; kkm: number; tampilkanNilai: boolean };
      }>(`/api/ujian/${ujianId}/kkm`, {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      if (res.success && res.data) {
        set((state) => ({
          exams: state.exams.map((ex) =>
            ex.id === ujianId
              ? {
                  ...ex,
                  kkm: res.data.kkm,
                  tampilkanNilai: res.data.tampilkanNilai,
                }
              : ex
          ),
        }));
        get().showToast(
          `Pengaturan ujian disimpan (KKM: ${res.data.kkm})!`,
          "success"
        );
        return true;
      }
      get().showToast("Gagal menyimpan pengaturan ujian.", "error");
      return false;
    } catch (err: any) {
      get().showToast(err?.message || "Gagal menyimpan pengaturan ujian.", "error");
      return false;
    }
  },

  isLoading: false,

  fetchAllData: async () => {
    set({ isLoading: true });
    try {
      await Promise.allSettled([
        get().fetchExams(),
        get().fetchBankSoal(),
        get().fetchClasses(),
        get().fetchProctoring(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBankSoal: async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>("/api/bank-soal");
      if (res.data && Array.isArray(res.data)) {
        set({ bankSoalList: res.data });
        if (!get().activeBankSoalId && res.data.length > 0) {
          const firstBankId = res.data[0].id;
          set({ activeBankSoalId: firstBankId });
          await get().fetchQuestions(firstBankId);
        }
      }
    } catch (err) {
      console.error("Gagal fetch bank soal:", err);
    }
  },

  fetchExams: async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>("/api/ujian");
      if (res.data) {
        const formatted: ExamPackage[] = res.data.map((e) => ({
          id: e.id,
          title: e.title || e.judul || "Ujian",
          subject: e.subject || e.mapel?.nama || "Umum",
          targetClasses:
            e.targetClasses ||
            e.targetKelas?.map((k: any) => k.kelas?.nama) ||
            [],
          token: e.token || "",
          tokenSecondsRemaining: e.tokenSecondsRemaining ?? 600,
          tokenExpiresAt: e.tokenExpiresAt,
          durationMinutes: e.durationMinutes ?? e.durasiMenit ?? 60,
          totalQuestions:
            e.totalQuestions ?? e.bankSoal?.soalList?.length ?? 0,
          status: e.status || "AKTIF",
          kkm: e.kkm ?? 75,
          tampilkanNilai: e.tampilkanNilai ?? true,
        }));
        set({ exams: formatted });

        // Set default active exam if none selected, or sync active token & timer
        const currentActiveId = get().activeExamId;
        if (!currentActiveId && formatted.length > 0) {
          const first = formatted[0];
          set({
            activeExamId: first.id,
            activeExamTitle: first.title,
            activeToken: first.token,
            tokenSecondsRemaining: first.tokenSecondsRemaining ?? 600,
          });
          if (res.data[0]?.bankSoalId) {
            set({ activeBankSoalId: res.data[0].bankSoalId });
            get().fetchQuestions(res.data[0].bankSoalId);
          }
        } else if (currentActiveId) {
          const active = formatted.find((f) => f.id === currentActiveId);
          if (active) {
            set({
              activeToken: active.token,
              tokenSecondsRemaining: active.tokenSecondsRemaining ?? 600,
            });
          }
        }
      }
    } catch (err) {
      console.error("Gagal fetch exams:", err);
    }
  },

  fetchClasses: async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: string[] }>("/api/ujian/classes/all");
      if (res.data) {
        set({ availableClasses: res.data });
      }
    } catch (err) {
      console.error("Gagal fetch classes:", err);
    }
  },

  fetchProctoring: async () => {
    const { activeExamId } = get();
    try {
      const path = activeExamId ? `/api/proctoring/${activeExamId}` : "/api/proctoring";
      const res = await apiRequest<{ success: boolean; data: any }>(path);
      if (res.data) {
        if (Array.isArray(res.data.students)) {
          set({ students: res.data.students });
        }
        if (res.data.kpi) {
          set({ kpi: res.data.kpi });
        }
      }
    } catch (err) {
      console.error("Gagal fetch proctoring:", err);
    }
  },

  fetchQuestions: async (bankSoalId?: string) => {
    const targetId = bankSoalId || get().activeBankSoalId;
    if (!targetId) return;
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>(`/api/bank-soal/${targetId}/soal`);
      if (res.data) {
        const formatted: QuestionItem[] = res.data.map((q, idx) => ({
          id: q.id,
          number: q.nomorUrut || idx + 1,
          text: q.pertanyaan,
          imageUrl: q.gambarUrl,
          points: q.bobotNilai || 1,
          options: (q.options || q.pilihanJawaban || []).map((opt: any) => ({
            label: opt.label,
            text: opt.text ?? opt.teks ?? "",
            imageUrl: opt.imageUrl ?? opt.gambarUrl,
            isCorrect: Boolean(opt.isCorrect ?? opt.isKunci),
          })),
        }));
        set({ questions: formatted, activeBankSoalId: targetId });
      }
    } catch (err) {
      console.error("Gagal fetch questions:", err);
    }
  },
}));
