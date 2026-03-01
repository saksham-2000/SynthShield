import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Ticker } from '@/components/Ticker'
import { MainContent } from '@/components/MainContent'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Ticker />
      <MainContent />
    </>
  )
}
