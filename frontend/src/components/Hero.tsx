'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section
      className="relative w-full pt-32 pb-4 text-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.08), transparent)',
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-8">
        {/* Icon + Heading */}
        <div className="flex flex-col items-center gap-5">
          <Image
            src="/privacy-icon.svg"
            alt="SynthShield"
            width={56}
            height={56}
            className="invert opacity-70"
          />
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-100 leading-[1.05]">
            SynthShield
            <br />
            <span className="text-emerald-500 text-4xl md:text-5xl font-semibold">
              Guaranteed Synthetic Data
            </span>
          </h1>
        </div>

        {/* Subtitle — faded, grows slightly on hover */}
        <motion.p
          className="text-zinc-500/60 text-base max-w-md mx-auto mt-6 leading-relaxed cursor-default"
          whileHover={{ scale: 1.04, color: 'rgba(161,161,170,0.8)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          Transform sensitive records into mathematically private synthetic clones.
        </motion.p>
      </div>
    </section>
  )
}
