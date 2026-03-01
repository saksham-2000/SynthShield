import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SynthShield — Privacy-Guaranteed Synthetic Data',
  description:
    'Generate ε-differentially private synthetic data from sensitive datasets. LoRA-powered, membership-inference resistant, zero data retention.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  )
}
