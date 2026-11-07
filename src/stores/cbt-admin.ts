import { create } from "zustand";

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
}

interface CBTAdminState {
  // Navigation & Active tab
  activeTab: "proctoring" | "bank-soal" | "jadwal" | "nilai" | "settings";
  setActiveTab: (tab: "proctoring" | "bank-soal" | "jadwal" | "nilai" | "settings") => void;

  // Active Session & Token
  activeToken: string;
  regenerateToken: () => void;
  activeExamTitle: string;
  setActiveExamTitle: (title: string) => void;

  // Proctoring Students Data
  students: StudentProctor[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: "all" | "online" | "idle" | "flagged";
  setFilterStatus: (status: "all" | "online" | "idle" | "flagged") => void;

  // Proctor Actions
  resetStudentLogin: (studentId: string) => void;
  addStudentTime: (studentId: string, minutes?: number) => void;
  warnStudent: (studentId: string) => void;
  broadcastMessage: string;
  setBroadcastMessage: (msg: string) => void;

  // Class Management (Bisa pilih dan tambah kelas mandiri)
  availableClasses: string[];
  addNewClass: (className: string) => void;

  // Questions Management (Custom A-E)
  questions: QuestionItem[];
  addQuestion: (q: Omit<QuestionItem, "id" | "number">) => void;
  updateQuestion: (id: string, q: Partial<QuestionItem>) => void;
  deleteQuestion: (id: string) => void;

  // Exams List
  exams: ExamPackage[];
  createExam: (exam: Omit<ExamPackage, "id">) => void;
}

export const useCBTAdminStore = create<CBTAdminState>((set, get) => ({
  activeTab: "proctoring",
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeToken: "MAT-8492",
  regenerateToken: () => {
    const newToken = "MAT-" + Math.floor(1000 + Math.random() * 9000);
    set({ activeToken: newToken });
  },
  activeExamTitle: "Penilaian Akhir Semester (PAS) — Matematika Wajib XII",
  setActiveExamTitle: (title) => set({ activeExamTitle: title }),

  // Default demo data matching Design/Dashboard.html
  students: [
    { id: "1", name: "Ahmad Fauzi", nis: "210401", class: "XII MIPA 1", status: "online", progress: 28, totalQ: 40, violations: 0, timeLeft: "01:14:20" },
    { id: "2", name: "Bunga Citra Lestari", nis: "210402", class: "XII MIPA 1", status: "online", progress: 40, totalQ: 40, violations: 0, timeLeft: "00:00:00" },
    { id: "3", name: "Dimas Anggara", nis: "210403", class: "XII MIPA 2", status: "idle", progress: 14, totalQ: 40, violations: 2, timeLeft: "01:28:45" },
    { id: "4", name: "Eka Putri Rahayu", nis: "210404", class: "XII MIPA 1", status: "online", progress: 32, totalQ: 40, violations: 0, timeLeft: "00:45:10" },
    { id: "5", name: "Fajar Pratama", nis: "210405", class: "XII MIPA 2", status: "online", progress: 38, totalQ: 40, violations: 1, timeLeft: "00:15:30" },
    { id: "6", name: "Gita Gutawa", nis: "210406", class: "XII MIPA 3", status: "offline", progress: 8, totalQ: 40, violations: 0, timeLeft: "01:45:00" },
    { id: "7", name: "Hafiz Suhendar", nis: "210407", class: "XII MIPA 1", status: "online", progress: 22, totalQ: 40, violations: 0, timeLeft: "01:05:00" },
    { id: "8", name: "Indah Permatasari", nis: "210408", class: "XII MIPA 2", status: "online", progress: 30, totalQ: 40, violations: 0, timeLeft: "00:52:18" },
  ],
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  filterStatus: "all",
  setFilterStatus: (status) => set({ filterStatus: status }),

  resetStudentLogin: (studentId) =>
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? { ...s, status: "idle" } : s
      ),
    })),

  addStudentTime: (studentId, minutes = 10) =>
    set((state) => ({
      students: state.students.map((s) => {
        if (s.id !== studentId) return s;
        const parts = s.timeLeft.split(":").map(Number);
        if (parts.length === 3) {
          let totalSecs = parts[0] * 3600 + (parts[1] + minutes) * 60 + parts[2];
          const h = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
          const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
          const sec = String(totalSecs % 60).padStart(2, "0");
          return { ...s, timeLeft: `${h}:${m}:${sec}` };
        }
        return s;
      }),
    })),

  warnStudent: (studentId) =>
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? { ...s, violations: s.violations + 1 } : s
      ),
    })),

  broadcastMessage: "",
  setBroadcastMessage: (msg) => set({ broadcastMessage: msg }),

  availableClasses: ["XII MIPA 1", "XII MIPA 2", "XII MIPA 3", "XII IPS 1", "XII IPS 2"],
  addNewClass: (className) => {
    const trimmed = className.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.availableClasses.includes(trimmed)) return state;
      return { availableClasses: [...state.availableClasses, trimmed] };
    });
  },

  questions: [
    {
      id: "q1",
      number: 1,
      text: "Sebuah segitiga ABC memiliki sudut A = 45°, sudut B = 75°, dan panjang sisi yang berseberangan dengan sudut C adalah 12 cm. Berapakah panjang sisi AB?",
      points: 2.5,
      options: [
        { label: "A", text: "6√2 cm", isCorrect: false },
        { label: "B", text: "3√2 cm", isCorrect: true },
        { label: "C", text: "12√2 cm", isCorrect: false },
        { label: "D", text: "3 cm", isCorrect: false },
        { label: "E", text: "6 cm", isCorrect: false },
      ],
    },
    {
      id: "q2",
      number: 2,
      text: "Jika fungsi f(x) = 2x³ - 9x² + 12x + 5, tentukan interval di mana grafik f(x) selalu naik!",
      points: 2.5,
      options: [
        { label: "A", text: "x < 1 atau x > 2", isCorrect: true },
        { label: "B", text: "1 < x < 2", isCorrect: false },
        { label: "C", text: "x < -2 atau x > -1", isCorrect: false },
        { label: "D", text: "-2 < x < 1", isCorrect: false },
        { label: "E", text: "Semua nilai real x", isCorrect: false },
      ],
    },
  ],

  addQuestion: (q) =>
    set((state) => {
      const newNumber = state.questions.length + 1;
      const newQ: QuestionItem = {
        ...q,
        id: "q_" + Date.now(),
        number: newNumber,
      };
      return { questions: [...state.questions, newQ] };
    }),

  updateQuestion: (id, updated) =>
    set((state) => ({
      questions: state.questions.map((q) => (q.id === id ? { ...q, ...updated } : q)),
    })),

  deleteQuestion: (id) =>
    set((state) => ({
      questions: state.questions
        .filter((q) => q.id !== id)
        .map((q, idx) => ({ ...q, number: idx + 1 })),
    })),

  exams: [
    {
      id: "ex1",
      title: "Penilaian Akhir Semester (PAS) — Matematika Wajib XII",
      subject: "Matematika",
      targetClasses: ["XII MIPA 1", "XII MIPA 2"],
      token: "MAT-8492",
      durationMinutes: 120,
      totalQuestions: 40,
      status: "AKTIF",
    },
    {
      id: "ex2",
      title: "Kuis Harian Persamaan Diferensial",
      subject: "Matematika",
      targetClasses: ["XII MIPA 1"],
      token: "MTH-3910",
      durationMinutes: 45,
      totalQuestions: 15,
      status: "DRAFT",
    },
  ],

  createExam: (exam) =>
    set((state) => {
      const newExam: ExamPackage = {
        ...exam,
        id: "ex_" + Date.now(),
      };
      return { exams: [newExam, ...state.exams] };
    }),
}));

