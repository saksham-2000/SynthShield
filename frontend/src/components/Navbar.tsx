'use client'

import Image from 'next/image'
import { Github, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function Navbar() {
  const { phase, reset } = useAppStore()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800">
      {/* Left side: GitHub + CheeseHacks */}
      <div className="flex items-center gap-5">
        {/* GitHub link */}
        <a
          href="https://github.com/saksham-2000/SynthShield"
          // target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors select-none group"
        >
          <Github className="w-5 h-5 group-hover:text-zinc-100 transition-colors" />
          <span className="text-sm font-medium tracking-wide hidden sm:inline">GitHub</span>
        </a>

        {/* Divider */}
        <span className="w-px h-4 bg-zinc-700 hidden sm:block" />

        {/* CheeseHacks badge */}
        <div className="flex items-center gap-2 select-none">
          <Image
            src="/cheesehacks-icon.png"
            alt="CheeseHacks"
            width={22}
            height={22}
            className="rounded-sm opacity-90"
          />
          {/* <span className="text-sm font-medium tracking-wide text-zinc-400 hidden sm:inline">
            CheeseHacks
          </span> */}
          <a
          href="https://cheesehacks.dev/"
          // target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors select-none group"
        >
          {/* <Github className="w-5 h-5 group-hover:text-zinc-100 transition-colors" /> */}
          <span className="text-sm font-medium tracking-wide hidden sm:inline">CheeseHacks</span>
        </a>

        </div>
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
