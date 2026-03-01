'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'

export function GenerateProgress() {
  const { progressSteps, progressPercent, epsilon } = useAppStore()
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log window as new steps appear
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progressSteps.length])

  return (
    <section className="max-w-4xl mx-auto px-8 py-12" id="progress-section">
      <p className="text-zinc-600 text-xs uppercase tracking-widest font-medium mb-1">02 SYNTHESIZING</p>
      <div className="flex items-baseline gap-3 mb-8">
        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Generating...</h2>
        <span className="text-emerald-500 text-sm font-bold">{progressPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          style={{ boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ ease: 'easeOut', duration: 0.4 }}
        />
      </div>

      {/* Terminal log */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-5 text-sm min-h-[180px] max-h-[240px] overflow-y-auto">
        <AnimatePresence>
          {progressSteps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex gap-2 mb-1.5"
            >
              <span className="text-zinc-700 shrink-0">&gt;</span>
              <span className="text-emerald-400">{step.log}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {progressPercent < 100 && (
          <motion.span
            className="inline-block w-2 h-4 bg-emerald-500 ml-6 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
        <div ref={logEndRef} />
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-600">
        <span>ε = <span className="text-emerald-500">{epsilon.toFixed(1)}</span></span>
        <span>·</span>
        <span>Laplace noise injected</span>
        <span>·</span>
        <span>LoRA adapter active</span>
        <span>·</span>
        <span>Zero data leaves your browser</span>
      </div>
    </section>
  )
}
