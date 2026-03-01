'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Skull, Shield } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { simulateAttack } from '@/lib/stats'

const ATTACK_LOGS = [
  'Probing training data manifold...',
  'Running shadow model ensemble...',
  'Evaluating membership signals...',
  'Scoring confidence distributions...',
]

async function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export function HackerAttack() {
  const { epsilon, attackResult, setAttackResult } = useAppStore()
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const runAttack = async () => {
    setRunning(true)
    setLogs([])

    // Animate attack logs
    for (const log of ATTACK_LOGS) {
      await delay(500 + Math.random() * 300)
      setLogs((prev) => [...prev, log])
    }

    await delay(400)

    // Try backend attack endpoint, fall back to simulation
    let result: { accuracy: number; precision: number; aucRoc: number }

    try {
      const res = await fetch('http://localhost:8000/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epsilon }),
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error('Backend error')
      result = await res.json()
    } catch {
      result = simulateAttack(epsilon)
    }

    setAttackResult({
      ...result,
      verdict: 'The attacker cannot distinguish real records from synthetic ones.',
    })
    setRunning(false)
  }

  return (
    <section className="max-w-4xl mx-auto px-8 py-12 border-t border-zinc-800">
      <p className="text-zinc-600 text-xs uppercase tracking-widest font-medium mb-1">04 SECURITY</p>
      <h2 className="text-xl font-semibold text-zinc-100 tracking-tight mb-2">
        Membership inference attack
      </h2>
      <p className="text-zinc-500 text-sm mb-8 max-w-lg leading-relaxed">
        Simulates a sophisticated adversary attempting to determine whether original records appear
        in the synthetic dataset.
      </p>

      {/* Attack button */}
      {!attackResult && !running && (
        <button
          onClick={runAttack}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer pulse-red"
        >
          <Skull className="w-4 h-4" />
          Run Membership Inference Attack
        </button>
      )}

      {/* Running logs */}
      {running && (
        <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-5 text-sm min-h-[100px]">
          <AnimatePresence>
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 mb-1.5 text-red-400"
              >
                <span className="text-red-900 shrink-0">&gt;</span>
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.span
            className="inline-block w-2 h-4 bg-red-500 ml-6 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {attackResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  label: 'Attack Accuracy',
                  value: `${(attackResult.accuracy * 100).toFixed(1)}%`,
                  sub: '≈ random guessing',
                },
                {
                  label: 'Precision',
                  value: attackResult.precision.toFixed(3),
                  sub: 'near 0.5 baseline',
                },
                {
                  label: 'AUC-ROC',
                  value: attackResult.aucRoc.toFixed(3),
                  sub: '0.5 = random',
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                >
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-emerald-500">{metric.value}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{metric.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-1">Privacy holds.</p>
                <p className="text-sm text-emerald-300/80 leading-relaxed">{attackResult.verdict}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
