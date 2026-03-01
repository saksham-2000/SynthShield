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
            width={96}
            height={96}
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

        {/* Subtitle — main pitch, complementary cyan, zooms on hover */}
        <motion.p
          className="text-cyan-400/70 text-base max-w-lg mx-auto mt-6 leading-relaxed cursor-default font-medium"
          whileHover={{ scale: 1.09, color: 'rgba(103,232,249,1)' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          Safely train models with statistically equivalent synthetic data.
        </motion.p>
      </div>
    </section>
  )
}
