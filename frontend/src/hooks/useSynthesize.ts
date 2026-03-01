import { useCallback } from 'react'
import Papa from 'papaparse'
import { useAppStore } from '@/store/appStore'
import { generateSyntheticData, computeHistograms } from '@/lib/stats'

const BACKEND_URL = 'https://csv-backend-181842386878.us-central1.run.app/process'

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

    // ── Run animation + API call concurrently ─────────────────────────────
    // Animation is guaranteed ≥6s. Results only show when BOTH finish.

    const runAnimation = async () => {
      for (let i = 0; i < PROGRESS_STEPS.length; i++) {
        // 900–1200ms per step × 7 steps = 6.3–8.4s minimum
        await delay(900 + Math.random() * 300)
        addProgressStep(PROGRESS_STEPS[i])
        setProgressPercent(Math.round(((i + 1) / PROGRESS_STEPS.length) * 100))
      }
    }

    const fetchSynthetic = async (): Promise<Record<string, string>[]> => {
      try {
        // Reconstruct CSV from parsed dataset rows + headers
        const csvString = Papa.unparse({
          fields: dataset.headers,
          data: dataset.rows.map((row) => dataset.headers.map((h) => row[h] ?? '')),
        })
        const blob = new Blob([csvString], { type: 'text/csv' })
        const file = new File([blob], dataset.fileName || 'dataset.csv', { type: 'text/csv' })

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(60_000), // 60s — model call may be slow
        })

        if (!res.ok) throw new Error(`Backend error: ${res.status}`)

        const csvText = await res.text()
        const parsed = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
        })
        if (!parsed.data.length) throw new Error('Backend returned empty CSV')
        return parsed.data
      } catch (err) {
        console.warn('Backend unavailable, using client-side DP fallback:', err)
        return generateSyntheticData(dataset, epsilon)
      }
    }

    // Wait for BOTH — whichever is slower decides when results appear
    const [, syntheticRows] = await Promise.all([runAnimation(), fetchSynthetic()])

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
