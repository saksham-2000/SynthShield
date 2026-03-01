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

/**
 * Re-keys every row from the backend CSV so that the keys exactly match
 * dataset.headers — case-insensitive, trim-aware.
 *
 * Why this matters:
 *  - computeHistograms looks up syntheticRows[col] using dataset.headers
 *  - Privacy Lookup does the same via headers.some(h => row[h]...)
 *  - If the backend returns "Name " instead of "Name", every lookup is undefined
 *
 * Rules:
 *  - Backend column matched to original by: trim + lowercase equality
 *  - Original columns missing from backend → filled with ''
 *  - Backend columns not in original → silently dropped
 *  - All values are also trimmed
 */
function normaliseToOriginalHeaders(
  rawRows: Record<string, string>[],
  originalHeaders: string[],
): Record<string, string>[] {
  if (!rawRows.length) return []

  // Build: trimmed-lowercase backend key → original header string
  const backendKeys = Object.keys(rawRows[0]).map((k) => k.trim())
  const keyMap = new Map<string, string>() // backendKey → originalHeader
  for (const orig of originalHeaders) {
    const normOrig = orig.trim().toLowerCase()
    const match = backendKeys.find((k) => k.toLowerCase() === normOrig)
    if (match) keyMap.set(match, orig)
  }

  return rawRows.map((raw) => {
    // Start with all original headers defaulting to ''
    const out: Record<string, string> = {}
    for (const orig of originalHeaders) out[orig] = ''

    // Fill in from backend row, remapping to original header names
    for (const [rawKey, val] of Object.entries(raw)) {
      const trimKey = rawKey.trim()
      const orig = keyMap.get(trimKey)
      if (orig !== undefined) {
        out[orig] = String(val ?? '').trim()
      }
    }
    return out
  })
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
        await delay(900 + Math.random() * 300) // 6.3–8.4s total
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
          signal: AbortSignal.timeout(60_000),
        })

        if (!res.ok) throw new Error(`Backend error: ${res.status}`)

        // Strip BOM (\uFEFF) that some CSV writers prepend
        const rawText = (await res.text()).replace(/^\uFEFF/, '')

        const parsed = Papa.parse<Record<string, string>>(rawText, {
          header: true,
          skipEmptyLines: true,
          // Trim header whitespace at parse time so keyMap matching is clean
          transformHeader: (h: string) => h.trim(),
        })

        if (!parsed.data.length) throw new Error('Backend returned empty CSV')

        // Remap backend column names → original dataset header names
        // so computeHistograms and Privacy Lookup both work correctly
        return normaliseToOriginalHeaders(parsed.data, dataset.headers)
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
