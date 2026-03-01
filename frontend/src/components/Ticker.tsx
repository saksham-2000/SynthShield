const ITEMS: { text: string }[] = [
  { text: 'Works on upto 50,000 rows' },
  { text: 'Laplace Noise Mechanism' },
  { text: 'LoRA powered synthesis' },
  { text: 'Client-Side privacy' },
  { text: 'Audit-ready certificate' },
]

function TickerRow() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="shrink-0 flex items-center">
          <span className="text-sm font-semibold tracking-wide text-emerald-400 px-2">
            {item.text}
          </span>
          <span className="text-zinc-700 mx-8">·</span>
        </span>
      ))}
    </>
  )
}

export function Ticker() {
  return (
    <div
      className="w-full bg-zinc-900/50 border-y border-zinc-800 overflow-hidden py-3.5 select-none"
      aria-hidden="true"
    >
      <div className="ticker-track flex whitespace-nowrap">
        <TickerRow />
        <TickerRow />
      </div>
    </div>
  )
}
