'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section
      className="relative w-full pt-32 pb-24 text-center overflow-hidden"
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

      <div className="relative max-w-4xl mx-auto px-2">
        {/* Icon + Heading */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/privacy-icon.svg"
            alt="SynthShield"
            width={192}
            height={192}
            className="invert opacity-70"
          />
          <h1
            className="text-7xl md:text-9xl  tracking-tight leading-[1.05]"
            style={{
              background: 'linear-gradient(135deg, #f4f4f5 0%, #a1a1aa 60%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SynthShield
          </h1>
        </div>

        {/* Subtitle — main pitch, emerald-tinted, zooms on hover */}
        <motion.p
          className="italic font-medium text-emerald-400/80 text-xl md:text-2xl max-w-xl mx-auto mt-6 leading-relaxed cursor-default"
          whileHover={{ scale: 1.05, color: 'rgba(52,161,153,1)' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          Safely train models with statistically equivalent <span className="text-green-200">synthetic data.</span>
        </motion.p>
      </div>
    </section>
  )
}
