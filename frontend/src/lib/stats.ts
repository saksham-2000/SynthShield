import { ColumnHistogram, HistogramBin, ParsedDataset } from './types'

const NUM_BINS = 20

// ─── Helpers ───────────────────────────────────────────────────────────────

function getNumericValues(rows: Record<string, string>[], column: string): number[] {
  return rows.map((r) => parseFloat(r[column])).filter((v) => !isNaN(v))
}

function klDivergence(bins: HistogramBin[]): number {
  const eps = 1e-10
  return bins.reduce((sum, b) => {
    const p = b.original + eps
    const q = b.synthetic + eps
    return sum + p * Math.log(p / q)
  }, 0)
}

// ─── Histogram computation ─────────────────────────────────────────────────

function computeNumericHistogram(
  original: number[],
  synthetic: number[],
  column: string,
): ColumnHistogram {
  const allValues = [...original, ...synthetic]
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = max - min || 1
  const binSize = range / NUM_BINS

  const bins: HistogramBin[] = Array.from({ length: NUM_BINS }, (_, i) => {
    const lo = min + i * binSize
    const hi = i === NUM_BINS - 1 ? max + 1e-9 : lo + binSize
    return {
      label: lo.toFixed(1),
      original: original.filter((v) => v >= lo && v < hi).length / Math.max(original.length, 1),
      synthetic: synthetic.filter((v) => v >= lo && v < hi).length / Math.max(synthetic.length, 1),
    }
  })

  return { column, bins, klDivergence: klDivergence(bins), isNumeric: true }
}

function computeCategoricalHistogram(
  originalRows: Record<string, string>[],
  syntheticRows: Record<string, string>[],
  column: string,
): ColumnHistogram {
  const allCats = Array.from(
    new Set([...originalRows.map((r) => r[column]), ...syntheticRows.map((r) => r[column])]),
  )
    .filter(Boolean)
    .slice(0, 12)

  const bins: HistogramBin[] = allCats.map((cat) => ({
    label: cat.length > 10 ? cat.slice(0, 10) + '…' : cat,
    original: originalRows.filter((r) => r[column] === cat).length / Math.max(originalRows.length, 1),
    synthetic: syntheticRows.filter((r) => r[column] === cat).length / Math.max(syntheticRows.length, 1),
  }))

  return { column, bins, klDivergence: klDivergence(bins), isNumeric: false }
}

export function computeHistograms(
  originalRows: Record<string, string>[],
  syntheticRows: Record<string, string>[],
  dataset: ParsedDataset,
): { histograms: ColumnHistogram[]; meanKlDivergence: number } {
  const cols = dataset.headers.slice(0, 6)

  const histograms: ColumnHistogram[] = cols.map((col) => {
    if (dataset.numericColumns.includes(col)) {
      const orig = getNumericValues(originalRows, col)
      const synth = getNumericValues(syntheticRows, col)
      if (orig.length > 0 && synth.length > 0) {
        return computeNumericHistogram(orig, synth, col)
      }
    }
    return computeCategoricalHistogram(originalRows, syntheticRows, col)
  })

  const meanKlDivergence =
    histograms.reduce((s, h) => s + h.klDivergence, 0) / Math.max(histograms.length, 1)

  return { histograms, meanKlDivergence }
}

// ─── Synthetic data generation (client-side DP simulation) ─────────────────

function laplaceSample(scale: number): number {
  // Inverse CDF method for Laplace distribution
  const u = Math.random() - 0.5
  const safe = Math.min(Math.abs(u), 0.4999)
  return -scale * Math.sign(u) * Math.log(1 - 2 * safe)
}

function sampleNormal(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.max(Math.random(), 1e-10)
  const u2 = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export function generateSyntheticData(
  dataset: ParsedDataset,
  epsilon: number,
): Record<string, string>[] {
  const { headers, rows, numericColumns } = dataset
  const sensitivity = 1.0

  // Pre-compute per-column statistics
  type ColStats =
    | { kind: 'numeric'; mean: number; std: number }
    | { kind: 'categorical'; categories: { cat: string; freq: number }[] }

  const colStats: Record<string, ColStats> = {}

  for (const col of headers) {
    if (numericColumns.includes(col)) {
      const vals = getNumericValues(rows, col)
      const mean = vals.reduce((s, v) => s + v, 0) / Math.max(vals.length, 1)
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(vals.length, 1)
      colStats[col] = { kind: 'numeric', mean, std: Math.sqrt(variance) }
    } else {
      // Categorical: compute frequencies and add DP noise
      const freq: Record<string, number> = {}
      rows.forEach((r) => {
        const v = r[col] ?? ''
        freq[v] = (freq[v] ?? 0) + 1
      })

      const noisyEntries = Object.entries(freq).map(([cat, count]) => ({
        cat,
        freq: Math.max(0, count + laplaceSample(sensitivity / epsilon)),
      }))

      const total = noisyEntries.reduce((s, e) => s + e.freq, 0) || 1
      colStats[col] = {
        kind: 'categorical',
        categories: noisyEntries.map((e) => ({ cat: e.cat, freq: e.freq / total })),
      }
    }
  }

  // Generate synthetic rows
  return Array.from({ length: rows.length }, () => {
    const row: Record<string, string> = {}

    for (const col of headers) {
      const stats = colStats[col]

      if (stats.kind === 'numeric') {
        // Add Laplace noise to the mean, sample from perturbed Gaussian
        const noisyMean = stats.mean + laplaceSample(sensitivity / epsilon)
        row[col] = sampleNormal(noisyMean, stats.std).toFixed(2)
      } else {
        // Sample from noisy categorical distribution
        const { categories } = stats
        if (categories.length === 0) {
          row[col] = ''
          continue
        }
        const rand = Math.random()
        let cumul = 0
        let chosen = categories[0].cat
        for (const { cat, freq } of categories) {
          cumul += freq
          if (rand < cumul) {
            chosen = cat
            break
          }
        }
        row[col] = chosen
      }
    }

    return row
  })
}

// ─── Membership inference attack simulation ────────────────────────────────

export function simulateAttack(epsilon: number): {
  accuracy: number
  precision: number
  aucRoc: number
} {
  // Lower ε = stronger privacy = attacker accuracy closer to random (50%)
  // ε 1 → ~50-52%, ε 10 → ~54-58%
  const epsilonEffect = ((epsilon - 1) / 9) * 0.08
  const noise = () => (Math.random() - 0.5) * 0.02

  const accuracy = Math.min(0.60, 0.5 + epsilonEffect + noise())
  const precision = Math.max(0.4, accuracy - 0.01 + noise())
  const aucRoc = Math.min(0.6, accuracy + noise())

  return {
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: Math.round(precision * 100) / 100,
    aucRoc: Math.round(aucRoc * 1000) / 1000,
  }
}
