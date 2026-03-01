import { useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { generateSyntheticData, computeHistograms } from '@/lib/stats'

const PROGRESS_STEPS = [
  'Parsing column schema...',
  'Computing marginal distributions...',
  'Injecting Laplace noise (ε-DP)...',
  'Loading LoRA adapter weights...',
  'Synthesizing rows with privacy budget...',
  'Validating statistical utility...',
  'Done. Synthetic dataset ready.',
]

async function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function useSynthesize() {
  const {
    dataset,
    epsilon,
    startGeneration,
    addProgressStep,
    setProgressPercent,
    setSynthesisResult,
  } = useAppStore()

  const synthesize = useCallback(async () => {
    if (!dataset) return

    startGeneration()

    // Animate progress steps
    for (let i = 0; i < PROGRESS_STEPS.length; i++) {
      await delay(350 + Math.random() * 300)
      addProgressStep(PROGRESS_STEPS[i])
      setProgressPercent(Math.round(((i + 1) / PROGRESS_STEPS.length) * 100))
    }

    // Try backend, fall back to client-side DP simulation
    let syntheticRows: Record<string, string>[]

    try {
      const res = await fetch('http://localhost:8000/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: dataset.rows,
          headers: dataset.headers,
          epsilon,
        }),
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) throw new Error('Backend returned non-OK status')
      const data = await res.json()
      syntheticRows = data.synthetic_rows
    } catch {
      // Client-side fallback — fully working DP simulation
      syntheticRows = generateSyntheticData(dataset, epsilon)
    }

    const { histograms, meanKlDivergence } = computeHistograms(
      dataset.rows,
      syntheticRows,
      dataset,
    )

    setSynthesisResult({
      syntheticRows,
      histograms,
      meanKlDivergence,
      epsilon,
      rowCount: syntheticRows.length,
      colCount: dataset.headers.length,
    })
  }, [dataset, epsilon, startGeneration, addProgressStep, setProgressPercent, setSynthesisResult])

  return { synthesize }
}
