'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useAppStore } from '@/store/appStore'
import { ColumnHistogram } from '@/lib/types'

function KLBadge({ score }: { score: number }) {
  if (score < 0.05) {
    return <span className="text-[10px] font-mono text-green-400">KL {score.toFixed(4)} ✓</span>
  }
  if (score < 0.15) {
    return <span className="text-[10px] font-mono text-amber-400">KL {score.toFixed(4)}</span>
  }
  return <span className="text-[10px] font-mono text-red-400">KL {score.toFixed(4)}</span>
}

function HistogramCard({ hist }: { hist: ColumnHistogram }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-semibold text-zinc-100 truncate mr-2">{hist.column}</span>
        <KLBadge score={hist.klDivergence} />
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <BarChart
          data={hist.bins}
          margin={{ top: 0, right: 0, bottom: 0, left: -24 }}
          barGap={0}
          barCategoryGap="0%"
        >
          <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#52525b', fontSize: 8, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#52525b', fontSize: 8, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              background: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 11,
            }}
            labelStyle={{ color: '#a1a1aa' }}
            formatter={(val: number, name: string) => [val.toFixed(4), name]}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="original" name="original" fill="#06b6d4" opacity={0.7} radius={[2, 2, 0, 0]} />
          <Bar dataKey="synthetic" name="synthetic" fill="#10b981" opacity={0.6} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Results() {
  const { synthesisResult } = useAppStore()
  if (!synthesisResult) return null

  const { histograms, meanKlDivergence } = synthesisResult
  const klColor =
    meanKlDivergence < 0.05
      ? 'text-emerald-500'
      : meanKlDivergence < 0.2
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <section className="max-w-4xl mx-auto px-8 py-12 border-t border-zinc-800">
      {/* Section header */}
      <p className="text-zinc-600 text-xs uppercase tracking-widest font-medium mb-1">03 RESULTS</p>
      <h2 className="text-xl font-semibold text-zinc-100 tracking-tight mb-8">
        Distribution comparison
      </h2>

      {/* KL Divergence panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Big KL number */}
          <div className="shrink-0">
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">KL DIVERGENCE</p>
            <p className={`text-4xl font-bold ${klColor}`}>{meanKlDivergence.toFixed(4)}</p>
            <p className="text-zinc-600 text-xs mt-1">
              {meanKlDivergence < 0.05
                ? 'Excellent fidelity'
                : meanKlDivergence < 0.2
                  ? 'Good fidelity'
                  : 'Degraded fidelity'}
            </p>
          </div>

          {/* Per-column bars */}
          <div className="flex-1 space-y-2">
            {histograms.map((h) => {
              const barColor =
                h.klDivergence < 0.05 ? '#10b981' : h.klDivergence < 0.2 ? '#f59e0b' : '#ef4444'
              const barWidth = Math.min(100, h.klDivergence * 600)
              return (
                <div key={h.column} className="flex items-center gap-3">
                  <span className="text-zinc-500 text-xs w-24 truncate shrink-0">{h.column}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-[3px] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barWidth}%`, background: barColor }}
                    />
                  </div>
                  <span className="text-zinc-600 text-xs w-12 text-right shrink-0">
                    {h.klDivergence.toFixed(4)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-4 text-xs">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-cyan-500 opacity-70" />
          <span className="text-zinc-500">original</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-emerald-500 opacity-60" />
          <span className="text-zinc-500">synthetic</span>
        </span>
      </div>

      {/* Chart grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {histograms.map((hist) => (
          <HistogramCard key={hist.column} hist={hist} />
        ))}
      </div>

      {histograms.length === 0 && (
        <p className="text-zinc-700 text-sm text-center py-12">
          No columns available for visualization.
        </p>
      )}
    </section>
  )
}
