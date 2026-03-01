'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { UploadConfig } from './UploadConfig'
import { GenerateProgress } from './GenerateProgress'
import { Results } from './Results'
import { Download } from './Download'

const SECTION_VARIANTS = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 0.68, 0, 1.2] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

function ScrollReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1.2] }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {children}
    </motion.div>
  )
}

export function MainContent() {
  const { phase } = useAppStore()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'idle') {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [phase])

  return (
    <div ref={contentRef} className="border-t border-zinc-800">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="upload" {...SECTION_VARIANTS}>
            <UploadConfig />
          </motion.div>
        )}

        {phase === 'generating' && (
          <motion.div key="progress" {...SECTION_VARIANTS}>
            <GenerateProgress />
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div key="results" {...SECTION_VARIANTS}>
            <Results />
            <ScrollReveal>
              <Download />
            </ScrollReveal>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
