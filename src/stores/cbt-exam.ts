import { create } from "zustand";

export interface StudentExamQuestion {
  number: number;
  id: string;
  text: string;
  points: number;
  hasDiagram?: boolean;
  options: {
    label: string; // "A", "B", "C", "D", "E"
    text: string;
  }[];
}

interface CBTExamState {
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (idx: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;

  answers: Record<number, string>; // { [questionNumber]: "A" | "B" | ... }
  selectAnswer: (qNum: number, optionLabel: string) => void;

  flagged: Record<number, boolean>; // { [questionNumber]: true }
  toggleFlag: (qNum: number) => void;

  secondsRemaining: number;
  decrementTimer: () => void;
  setTimer: (secs: number) => void;

  violations: number;
  incrementViolations: () => void;

  isSubmitted: boolean;
  submitExam: () => void;

  // Student profile
  studentName: string;
  studentNIS: string;
  studentClass: string;
  examTitle: string;
}

export const useCBTExamStore = create<CBTExamState>((set, get) => ({
  currentQuestionIndex: 6, // default question 7 (index 6) matching design
  setCurrentQuestionIndex: (idx) => set({ currentQuestionIndex: idx }),
  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, 39),
    })),
  prevQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  answers: {
    1: "A",
    2: "C",
    3: "B",
    4: "D",
    5: "A",
    6: "B",
    7: "B",
  },
  selectAnswer: (qNum, optionLabel) =>
    set((state) => ({
      answers: { ...state.answers, [qNum]: optionLabel },
    })),

  flagged: {
    4: true, // example flagged question
  },
  toggleFlag: (qNum) =>
    set((state) => ({
      flagged: { ...state.flagged, [qNum]: !state.flagged[qNum] },
    })),

  secondsRemaining: 6621, // 01:50:21
  decrementTimer: () =>
    set((state) => ({
      secondsRemaining: Math.max(0, state.secondsRemaining - 1),
    })),
  setTimer: (secs) => set({ secondsRemaining: secs }),

  violations: 0,
  incrementViolations: () =>
    set((state) => ({ violations: state.violations + 1 })),

  isSubmitted: false,
  submitExam: () => set({ isSubmitted: true }),

  studentName: "Muhammad Farhan Pratama",
  studentNIS: "210401889",
  studentClass: "XII MIPA 1",
  examTitle: "Penilaian Akhir Semester Ganjil — Matematika Peminatan",
}));

