'use client'

import { FileText, Award } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { downloadCSV } from '@/lib/csv'
import { generatePrivacyCertificate } from '@/lib/pdf'

export function Download() {
  const { dataset, synthesisResult, attackResult } = useAppStore()
  if (!synthesisResult) return null

  const handleCSVDownload = () => {
    downloadCSV(synthesisResult.syntheticRows, 'synthetic.csv')
  }

  const handleCertDownload = async () => {
    if (!dataset) return
    await generatePrivacyCertificate(dataset.fileName, synthesisResult, attackResult)
  }

  return (
    <section className="max-w-4xl mx-auto px-8 py-12 pb-24 border-t border-zinc-800">
      <p className="text-zinc-600 text-xs uppercase tracking-widest font-medium mb-1">05 EXPORT</p>
      <h2 className="text-xl font-semibold text-zinc-100 tracking-tight mb-8">Download</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Synthetic CSV */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100 text-sm">synthetic.csv</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {synthesisResult.rowCount.toLocaleString()} rows · {synthesisResult.colCount} columns
              </p>
            </div>
          </div>
          <button
            onClick={handleCSVDownload}
            className="px-5 py-2.5 border border-cyan-500/40 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Download CSV
          </button>
        </div>

        {/* Privacy Certificate */}
        <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-6 flex flex-col gap-4 hover:border-emerald-500/35 transition-colors glow-green">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100 text-sm">Privacy Certificate</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                PDF · ε = {synthesisResult.epsilon.toFixed(1)}
                {attackResult && ' · Attack verified'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCertDownload}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-sm transition-colors cursor-pointer"
          >
            Download PDF
          </button>
        </div>
      </div>

      <p className="text-zinc-700 text-xs mt-6">
        All data processed locally · Never transmitted to any server
      </p>
    </section>
  )
}
