import { create } from "zustand";
import { apiRequest } from "@/lib/api";

export interface StudentExamOption {
  id: string;
  label: string; // "A", "B", "C", "D", "E"
  text: string;
  imageUrl?: string | null;
}

export interface StudentExamQuestion {
  id: string;
  number: number;
  text: string;
  points: number;
  imageUrl?: string | null;
  options: StudentExamOption[];
}

interface CBTExamState {
  // Session & Exam Info
  sesiId: string;
  ujianId: string;
  examTitle: string;
  studentName: string;
  studentNIS: string;
  studentClass: string;

  // Questions & Navigation
  questions: StudentExamQuestion[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (idx: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;

  // Answers & Flags
  answers: Record<number, string>; // { [questionNumber]: "A" | "B" ... }
  answerIds: Record<number, string>; // { [questionNumber]: "pilihanId" }
  selectAnswer: (qNum: number, optionLabel: string, optionId?: string) => Promise<void>;
  flagged: Record<number, boolean>;
  toggleFlag: (qNum: number) => void;

  // Timer & Violations
  secondsRemaining: number;
  decrementTimer: () => void;
  setTimer: (secs: number) => void;
  violations: number;
  incrementViolations: () => Promise<void>;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  checkLockStatus: () => Promise<boolean>;

  // Submission
  isSubmitted: boolean;
  scoreResult: number | null;
  submitExam: () => Promise<void>;
  isLoading: boolean;

  // Actions
  initExamFromStorage: () => Promise<boolean>;
  startExamWithToken: (token: string, ujianId?: string) => Promise<{ success: boolean; message?: string }>;
}

export const useCBTExamStore = create<CBTExamState>((set, get) => ({
  sesiId: "",
  ujianId: "",
  examTitle: "",
  studentName: "",
  studentNIS: "",
  studentClass: "",

  questions: [],
  currentQuestionIndex: 0,
  setCurrentQuestionIndex: (idx) => set({ currentQuestionIndex: idx }),
  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        Math.max(0, state.questions.length - 1)
      ),
    })),
  prevQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  // Clean empty initial state
  answers: {},
  answerIds: {},
  flagged: {},
  secondsRemaining: 0,
  violations: 0,
  isLocked: false,
  setIsLocked: (locked) => set({ isLocked: locked }),
  isSubmitted: false,
  scoreResult: null,
  isLoading: false,

  selectAnswer: async (qNum, optionLabel, optionId) => {
    if (get().isLocked) return;

    // 1. Optimistic Update di UI
    set((state) => ({
      answers: { ...state.answers, [qNum]: optionLabel },
      answerIds: optionId ? { ...state.answerIds, [qNum]: optionId } : state.answerIds,
    }));

    // 2. Autosave ke Backend API
    const { sesiId, ujianId, questions } = get();
    const currentQ = questions.find((q) => q.number === qNum);
    if (!sesiId || !ujianId || !currentQ) return;

    try {
      await apiRequest("/api/exam/answer", {
        method: "PUT",
        body: JSON.stringify({
          sesiId,
          ujianId,
          soalId: currentQ.id,
          questionNumber: qNum,
          pilihanId: optionId || null,
          selectedOption: optionLabel,
          isFlagged: Boolean(get().flagged[qNum]),
        }),
      });
    } catch (err: any) {
      if (err?.message?.includes("terkunci") || err?.status === 403) {
        set({ isLocked: true });
      }
      console.warn("Autosave gagal, akan disimpan lokal:", err);
    }
  },

  toggleFlag: (qNum) => {
    const nextFlagged = !get().flagged[qNum];
    set((state) => ({
      flagged: { ...state.flagged, [qNum]: nextFlagged },
    }));

    const { sesiId, ujianId, questions, answers, answerIds } = get();
    const currentQ = questions.find((q) => q.number === qNum);
    if (!sesiId || !ujianId || !currentQ) return;

    apiRequest("/api/exam/answer", {
      method: "PUT",
      body: JSON.stringify({
        sesiId,
        ujianId,
        soalId: currentQ.id,
        questionNumber: qNum,
        pilihanId: answerIds[qNum] || null,
        selectedOption: answers[qNum] || undefined,
        isFlagged: nextFlagged,
      }),
    }).catch(() => {});
  },

  decrementTimer: () =>
    set((state) => {
      if (state.isLocked) return state; // Bekukan timer saat ujian terkunci
      const nextTime = Math.max(0, state.secondsRemaining - 1);
      if (nextTime === 0 && !state.isSubmitted && state.questions.length > 0) {
        setTimeout(() => get().submitExam(), 0);
      }
      return { secondsRemaining: nextTime };
    }),

  setTimer: (secs) => set({ secondsRemaining: secs }),

  incrementViolations: async () => {
    const nextViolations = get().violations + 1;
    const shouldLock = nextViolations >= 3;
    set((state) => ({
      violations: nextViolations,
      isLocked: shouldLock ? true : state.isLocked,
    }));

    const { sesiId, ujianId } = get();
    if (!sesiId && !ujianId) return;

    try {
      const res = await apiRequest<{ success: boolean; isLocked?: boolean; violations?: number }>(
        "/api/exam/violation",
        {
          method: "POST",
          body: JSON.stringify({ sesiId, ujianId }),
        }
      );
      if (res.isLocked) {
        set({ isLocked: true });
      }
    } catch {
      // ignore
    }
  },

  checkLockStatus: async () => {
    const { sesiId } = get();
    if (!sesiId) return false;
    try {
      const res = await apiRequest<{
        success: boolean;
        data?: { status: string; isLocked: boolean; violations: number };
      }>(`/api/exam/status/${sesiId}`);
      if (res.data) {
        const locked = res.data.isLocked || res.data.status === "TERKUNCI";
        set({
          isLocked: locked,
          violations: res.data.violations ?? get().violations,
        });
        return locked;
      }
    } catch {
      // ignore
    }
    return get().isLocked;
  },

  submitExam: async () => {
    const { sesiId, ujianId } = get();
    if (!sesiId || !ujianId) return;
    set({ isLoading: true });
    try {
      const res = await apiRequest<{ success: boolean; data: any }>("/api/exam/submit", {
        method: "POST",
        body: JSON.stringify({ sesiId, ujianId }),
      });
      set({
        isSubmitted: true,
        scoreResult: res.data?.score ?? null,
      });
    } catch (err) {
      console.error("Gagal submit ujian:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  startExamWithToken: async (token: string, ujianId?: string) => {
    set({ isLoading: true });
    try {
      const res = await apiRequest<{ success: boolean; message?: string; data: any }>(
        "/api/exam/start",
        {
          method: "POST",
          body: JSON.stringify({
            token: token.trim(),
            ...(ujianId ? { ujianId } : {}),
          }),
        }
      );

      if (res.data) {
        const d = res.data;
        const questionsList: StudentExamQuestion[] = (d.questions || []).map((q: any) => ({
          id: q.id,
          number: q.number,
          text: q.text,
          points: q.points || 1,
          imageUrl: q.imageUrl,
          options: (q.options || []).map((opt: any) => ({
            id: opt.id,
            label: opt.label,
            text: opt.text,
            imageUrl: opt.imageUrl,
          })),
        }));

        const userStr = typeof window !== "undefined" ? localStorage.getItem("cbt_user") : null;
        const userObj = userStr ? JSON.parse(userStr) : null;

        set({
          sesiId: d.sesiId,
          ujianId: d.ujianId,
          examTitle: d.examTitle || "Ujian Berbasis Komputer",
          questions: questionsList,
          secondsRemaining: d.sisaWaktuDetik ?? (d.durationMinutes || 60) * 60,
          studentName: userObj?.nama || "Siswa Peserta",
          studentNIS: userObj?.siswaProfile?.nisn || userObj?.username || "-",
          studentClass: userObj?.siswaProfile?.kelas?.nama || userObj?.kelas || "-",
          isSubmitted: Boolean(d.isSubmitted),
          scoreResult: d.score ?? null,
          isLocked: Boolean(d.isLocked),
          violations: d.violations ?? 0,
          currentQuestionIndex: 0,
          answers: d.savedAnswers || {},
          answerIds: d.savedAnswerIds || {},
          flagged: d.savedFlagged || {},
        });

        // Simpan sesiId & ujianId aktif ke localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("cbt_active_sesi", d.sesiId);
          localStorage.setItem("cbt_active_ujian", d.ujianId);
          if (token.trim()) {
            localStorage.setItem("cbt_active_token", token.trim());
          }
        }

        return { success: true };
      }
      return { success: false, message: res.message || "Gagal memulai ujian" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Koneksi ke server gagal" };
    } finally {
      set({ isLoading: false });
    }
  },

  initExamFromStorage: async () => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("cbt_active_token") || "";
    const ujianId = localStorage.getItem("cbt_active_ujian") || undefined;
    if (token || ujianId) {
      const res = await get().startExamWithToken(token, ujianId);
      return res.success;
    }
    return false;
  },
}));
