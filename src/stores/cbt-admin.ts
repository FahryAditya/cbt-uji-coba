import { create } from "zustand";
import { apiRequest } from "@/lib/api";

export interface StudentProctor {
  id: string;
  name: string;
  nis: string;
  class: string;
  status: "online" | "idle" | "offline";
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
  durationMinutes: number;
  totalQuestions: number;
  status: "DRAFT" | "AKTIF" | "SELESAI";
  kkm?: number;
}

interface CBTAdminState {
  // Navigation & Active tab
  activeTab: "proctoring" | "bank-soal" | "jadwal" | "nilai" | "settings";
  setActiveTab: (tab: "proctoring" | "bank-soal" | "jadwal" | "nilai" | "settings") => void;

  // Active Session & Token
  activeExamId: string;
  setActiveExamId: (id: string) => void;
  activeToken: string;
  regenerateToken: () => Promise<void>;
  activeExamTitle: string;
  setActiveExamTitle: (title: string) => void;

  // Proctoring Students Data
  students: StudentProctor[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: "all" | "online" | "idle" | "flagged";
  setFilterStatus: (status: "all" | "online" | "idle" | "flagged") => void;

  // Proctor Actions
  resetStudentLogin: (studentId: string) => Promise<void>;
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
  activeBankSoalId: string;
  addQuestion: (q: Omit<QuestionItem, "id" | "number">) => Promise<void>;
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

  // Loading & Sync
  isLoading: boolean;
  fetchAllData: () => Promise<void>;
  fetchProctoring: () => Promise<void>;
  fetchExams: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchQuestions: (bankSoalId?: string) => Promise<void>;
}

export const useCBTAdminStore = create<CBTAdminState>((set, get) => ({
  activeTab: "proctoring",
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeExamId: "",
  setActiveExamId: (id) => {
    const exam = get().exams.find((e) => e.id === id);
    set({
      activeExamId: id,
      activeExamTitle: exam ? exam.title : "",
      activeToken: exam ? exam.token : "",
    });
    get().fetchProctoring();
  },

  activeToken: "",
  regenerateToken: async () => {
    const { activeExamId } = get();
    if (!activeExamId) return;
    try {
      const res = await apiRequest<{ success: boolean; data: { token: string } }>(
        `/api/ujian/${activeExamId}/token`,
        { method: "PATCH" }
      );
      if (res.data?.token) {
        set({ activeToken: res.data.token });
        // Update exam in state
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === activeExamId ? { ...e, token: res.data.token } : e
          ),
        }));
      }
    } catch (err) {
      console.error("Gagal regenerate token:", err);
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
    } catch (err) {
      console.error("Gagal reset login:", err);
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
    } catch (err) {
      console.error("Gagal tambah waktu:", err);
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
    } catch (err) {
      console.error("Gagal kirim peringatan:", err);
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
    } catch (err) {
      console.error("Gagal kirim broadcast:", err);
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
    } catch (err) {
      console.error("Gagal tambah kelas:", err);
    }
  },

  questions: [],
  activeBankSoalId: "",
  addQuestion: async (q) => {
    const { activeBankSoalId } = get();
    if (!activeBankSoalId) return;
    try {
      const kunciOpsi = q.options.find((o) => o.isCorrect);
      await apiRequest(`/api/bank-soal/${activeBankSoalId}/soal`, {
        method: "POST",
        body: JSON.stringify({
          pertanyaan: q.text,
          bobotNilai: q.points,
          gambarUrl: q.imageUrl || null,
          opsi: q.options.map((opt) => ({
            label: opt.label,
            teks: opt.text,
            isKunci: opt.isCorrect,
          })),
        }),
      });
      // Refetch questions
      await get().fetchQuestions(activeBankSoalId);
    } catch (err) {
      console.error("Gagal simpan soal:", err);
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
    } catch (err) {
      console.error("Gagal hapus soal:", err);
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
      }
    } catch (err) {
      console.error("Gagal buat ujian:", err);
    }
  },

  isLoading: false,

  fetchAllData: async () => {
    set({ isLoading: true });
    try {
      await Promise.allSettled([
        get().fetchExams(),
        get().fetchClasses(),
        get().fetchProctoring(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExams: async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>("/api/ujian");
      if (res.data) {
        const formatted: ExamPackage[] = res.data.map((e) => ({
          id: e.id,
          title: e.judul,
          subject: e.mapel?.nama || "Umum",
          targetClasses: e.targetKelas?.map((k: any) => k.kelas?.nama) || [],
          token: e.token || "",
          durationMinutes: e.durasiMenit || 60,
          totalQuestions: e.bankSoal?.soalList?.length || 0,
          status: e.status || "AKTIF",
          kkm: e.kkm || 75,
        }));
        set({ exams: formatted });

        // Set default active exam if none selected
        if (!get().activeExamId && formatted.length > 0) {
          const first = formatted[0];
          set({
            activeExamId: first.id,
            activeExamTitle: first.title,
            activeToken: first.token,
          });
          // Also fetch questions for first exam's bank soal if present
          if (res.data[0]?.bankSoalId) {
            set({ activeBankSoalId: res.data[0].bankSoalId });
            get().fetchQuestions(res.data[0].bankSoalId);
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
      if (res.data?.students) {
        set({ students: res.data.students });
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
          options: (q.pilihanJawaban || []).map((opt: any) => ({
            label: opt.label,
            text: opt.teks,
            imageUrl: opt.gambarUrl,
            isCorrect: Boolean(opt.isKunci),
          })),
        }));
        set({ questions: formatted, activeBankSoalId: targetId });
      }
    } catch (err) {
      console.error("Gagal fetch questions:", err);
    }
  },
}));
