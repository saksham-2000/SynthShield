import { create } from 'zustand'
import {
  AppPhase,
  AttackResult,
  ParsedDataset,
  ProgressStep,
  SynthesisResult,
} from '@/lib/types'

interface AppState {
  phase: AppPhase
  dataset: ParsedDataset | null
  epsilon: number
  progressSteps: ProgressStep[]
  progressPercent: number
  synthesisResult: SynthesisResult | null
  attackResult: AttackResult | null

  // Actions
  setDataset: (dataset: ParsedDataset) => void
  setEpsilon: (epsilon: number) => void
  startGeneration: () => void
  addProgressStep: (log: string) => void
  setProgressPercent: (pct: number) => void
  setSynthesisResult: (result: SynthesisResult) => void
  setAttackResult: (result: AttackResult) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'idle',
  dataset: null,
  epsilon: 2.0,
  progressSteps: [],
  progressPercent: 0,
  synthesisResult: null,
  attackResult: null,

  setDataset: (dataset) => set({ dataset }),

  setEpsilon: (epsilon) => set({ epsilon }),

  startGeneration: () =>
    set({ phase: 'generating', progressSteps: [], progressPercent: 0, attackResult: null }),

  addProgressStep: (log) =>
    set((state) => ({
      progressSteps: [
        ...state.progressSteps,
        { id: state.progressSteps.length, log },
      ],
    })),

  setProgressPercent: (progressPercent) => set({ progressPercent }),

  setSynthesisResult: (result) => set({ synthesisResult: result, phase: 'results' }),

  setAttackResult: (attackResult) => set({ attackResult }),

  reset: () =>
    set({
      phase: 'idle',
      dataset: null,
      epsilon: 2.0,
      progressSteps: [],
      progressPercent: 0,
      synthesisResult: null,
      attackResult: null,
    }),
}))
