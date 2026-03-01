export type AppPhase = 'idle' | 'generating' | 'results'

export interface ParsedDataset {
  headers: string[]
  rows: Record<string, string>[]
  numericColumns: string[]
  categoricalColumns: string[]
  rowCount: number
  colCount: number
  fileName: string
}

export interface HistogramBin {
  label: string
  original: number
  synthetic: number
}

export interface ColumnHistogram {
  column: string
  bins: HistogramBin[]
  klDivergence: number
  isNumeric: boolean
}

export interface AttackResult {
  accuracy: number
  precision: number
  aucRoc: number
  verdict: string
}

export interface SynthesisResult {
  syntheticRows: Record<string, string>[]
  histograms: ColumnHistogram[]
  meanKlDivergence: number
  epsilon: number
  rowCount: number
  colCount: number
}

export interface ProgressStep {
  id: number
  log: string
}
