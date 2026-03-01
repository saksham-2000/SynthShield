'use client'

import { RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function Navbar() {
  const { phase, reset } = useAppStore()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-2 select-none">
        <span className="text-emerald-500 text-sm">■</span>
        <span className="text-zinc-100 font-semibold text-sm tracking-wide">SynthShield</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {phase === 'generating' && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Processing
          </span>
        )}
        {phase === 'results' && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mr-2 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Start over
          </button>
        )}
        <button className="rounded-lg px-4 py-1.5 text-xs font-medium border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer">
          Log in
        </button>
        <button className="rounded-lg px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black transition-colors cursor-pointer">
          Sign up
        </button>
      </div>
    </nav>
  )
}
