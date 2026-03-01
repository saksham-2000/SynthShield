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
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-zinc-100 leading-[1.05]">
          Privacy-guaranteed
          <br />
          <span className="text-emerald-500">synthetic data.</span>
        </h1>

        <p className="text-zinc-400 text-lg max-w-md mx-auto mt-6 leading-relaxed">
          Transform sensitive records into mathematically private synthetic clones.
        </p>

        <div className="flex flex-col items-center gap-2 mt-20 text-zinc-700 text-xs select-none">
          <span>scroll to begin</span>
          <span className="animate-bounce">↓</span>
        </div>
      </div>
    </section>
  )
}
