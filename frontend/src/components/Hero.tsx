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

      <div className="relative max-w-4xl mx-auto px-8">
        {/* Icon + Heading */}
        <div className="flex flex-col items-center gap-5">
          <Image
            src="/privacy-icon.svg"
            alt="SynthShield"
            width={144}
            height={144}
            className="invert opacity-70"
          />
          <h1 className="text-8xl md:text-10xl font-bold tracking-tight text-yellow-100 leading-[1.05]">
            SynthShield
          </h1>
        </div>

        {/* Subtitle — main pitch, soft mint green (distinct from ticker rainbow), zooms on hover */}
        <motion.p
          className="font-bold text-orange-300 text-2xl max-w-xl mx-auto mt-4 leading-relaxed cursor-default"
          whileHover={{ scale: 1.10, color: 'rgba(247,180,20,1)' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          Safely train models with statistically equivalent synthetic data.
        </motion.p>
      </div>
    </section>
  )
}
