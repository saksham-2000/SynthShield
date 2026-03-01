'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { CloudUpload, FileText } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useDataset } from '@/hooks/useDataset'
import { useSynthesize } from '@/hooks/useSynthesize'
import { ParsedDataset } from '@/lib/types'

// ── Epsilon helpers ─────────────────────────────────────────────────────────

function epsilonColor(eps: number) {
  if (eps <= 20) return 'text-emerald-500'
  if (eps <= 50) return 'text-amber-400'
  return 'text-red-400'
}

function epsilonPillStyle(eps: number) {
  if (eps <= 20) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  if (eps <= 50) return 'bg-amber-400/10 text-amber-400 border-amber-400/30'
  return 'bg-red-500/10 text-red-400 border-red-500/30'
}

function epsilonLabel(eps: number) {
  if (eps <= 20) return 'Strong guarantee'
  if (eps <= 50) return 'Moderate guarantee'
  return 'Low guarantee'
}

// ── Metadata section ────────────────────────────────────────────────────────

function DatasetMeta({ dataset }: { dataset: ParsedDataset }) {
  const missingPct = useMemo(() => {
    const total = dataset.rows.length * dataset.headers.length
    if (total === 0) return '0.0'
    const missing = dataset.rows.reduce(
      (sum, row) =>
        sum + dataset.headers.filter((h) => !row[h] || row[h].trim() === '').length,
      0,
    )
    return ((missing / total) * 100).toFixed(1)
  }, [dataset])

  const completeness = (100 - parseFloat(missingPct)).toFixed(1)

  const stats = [
    { label: 'ROWS', value: dataset.rowCount.toLocaleString(), color: 'text-cyan-400' },
    { label: 'COLUMNS', value: dataset.colCount.toString(), color: 'text-cyan-400' },
    { label: 'NUMERIC', value: dataset.numericColumns.length.toString(), color: 'text-amber-400' },
    { label: 'CATEGORICAL', value: dataset.categoricalColumns.length.toString(), color: 'text-amber-400' },
    { label: 'MISSING', value: `${missingPct}%`, color: 'text-emerald-500' },
    { label: 'COMPLETE', value: `${completeness}%`, color: 'text-emerald-500' },
  ]

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800">
      <p className="text-zinc-600 text-xs uppercase tracking-widest font-medium mb-4">
        Dataset Summary
      </p>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center hover:border-zinc-700 transition-colors"
          >
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Schema card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-3">Column Schema</p>
        <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto">
          {dataset.headers.map((col) => {
            const isNum = dataset.numericColumns.includes(col)
            return (
              <div key={col} className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-medium rounded px-1.5 py-0.5 shrink-0 ${
                    isNum
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isNum ? 'NUM' : 'CAT'}
                </span>
                <span className="text-zinc-400 text-xs truncate">{col}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function UploadConfig() {
  const { dataset, epsilon, setEpsilon } = useAppStore()
  const { handleFile } = useDataset()
  const { synthesize } = useSynthesize()

  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      try {
        await handleFile(file)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse file')
      }
    },
    [handleFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  return (
    <section className="max-w-4xl mx-auto px-8 py-12" id="upload-section">
      {/* Section header */}
      <p className="text-zinc-600 text-xs uppercase tracking-widest font-medium mb-1">01 UPLOAD</p>
      <h2 className="text-xl font-semibold text-zinc-100 tracking-tight mb-8">
        Configure your dataset
      </h2>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── LEFT: File upload ──────────────────────────────────────── */}
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-2">
            Dataset
          </p>

          <div
            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-zinc-700 bg-zinc-900/50 hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            {dataset ? (
              <div className="flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/5 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-emerald-400 text-xs font-medium truncate max-w-[160px]">
                    {dataset.fileName}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs mt-1">
                  {dataset.rowCount.toLocaleString()} rows · {dataset.colCount} columns
                </p>
                <p className="text-zinc-700 text-[10px] mt-1">Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <CloudUpload className="w-8 h-8 text-zinc-600" />
                <p className="text-zinc-500 text-sm">Drag &amp; drop CSV or click to browse</p>
                <p className="text-zinc-700 text-xs mt-1">
                  Patient records · Salary data · Financial logs
                </p>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>

        {/* ── RIGHT: Epsilon slider ──────────────────────────────────── */}
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-2">
            Privacy Budget
          </p>

          {/* Big epsilon display */}
          <p className={`text-4xl font-bold tracking-tight mt-2 transition-colors ${epsilonColor(epsilon)}`}>
            ε = {Math.round(epsilon)}
          </p>

          {/* Slider */}
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={epsilon}
            onChange={(e) => setEpsilon(parseFloat(e.target.value))}
            className="w-full mt-4"
          />

          {/* Labels */}
          <div className="flex justify-between text-zinc-600 text-xs mt-1">
            <span>High Privacy (ε=1)</span>
            <span>Low Privacy (ε=100)</span>
          </div>

          {/* Status pill */}
          <span
            className={`inline-block mt-3 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${epsilonPillStyle(epsilon)}`}
          >
            {epsilonLabel(epsilon)}
          </span>
        </div>
      </div>

      {/* ── Metadata (after file upload) ──────────────────────────────── */}
      {dataset && <DatasetMeta dataset={dataset} />}

      {/* ── Generate button ────────────────────────────────────────────── */}
      <div className="mt-8">
        <button
          onClick={synthesize}
          disabled={!dataset}
          className={`px-6 py-3 rounded-lg font-bold text-sm transition-colors ${
            dataset
              ? 'bg-emerald-500 hover:bg-emerald-600 text-black cursor-pointer'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {dataset ? 'Generate Synthetic Data →' : 'Upload a CSV file to begin'}
        </button>
      </div>
    </section>
  )
}
