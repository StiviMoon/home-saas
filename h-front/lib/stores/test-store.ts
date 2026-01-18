import { create } from "zustand";

interface TestState {
  count: number;
  message: string;
  increment: () => void;
  decrement: () => void;
  setMessage: (message: string) => void;
}

export const useTestStore = create<TestState>((set) => ({
  count: 0,
  message: "Zustand está funcionando correctamente! 🎉",
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setMessage: (message: string) => set({ message }),
}));

