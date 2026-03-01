const ITEMS: { text: string; highlight: boolean }[] = [
  { text: 'ε-DP Guaranteed', highlight: true },
  { text: 'Membership Inference Resistant', highlight: false },
  { text: 'Works on 50–5000 rows', highlight: false },
  { text: 'LoRA-powered synthesis', highlight: true },
  { text: 'Zero data retention', highlight: true },
  { text: 'Laplace Noise Mechanism', highlight: false },
  { text: 'GDPR-compatible', highlight: false },
  { text: 'Open-source core', highlight: false },
  { text: 'Client-side privacy', highlight: false },
  { text: 'Audit-ready certificate', highlight: false },
]

function TickerRow() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="shrink-0 flex items-center">
          <span
            className={`text-xs font-medium tracking-wide ${
              item.highlight ? 'text-emerald-500' : 'text-zinc-500'
            }`}
          >
            {item.text}
          </span>
          <span className="text-zinc-700 mx-4">·</span>
        </span>
      ))}
    </>
  )
}

export function Ticker() {
  return (
    <div
      className="w-full bg-zinc-900/50 border-y border-zinc-800 overflow-hidden py-3 select-none"
      aria-hidden="true"
    >
      <div className="ticker-track flex whitespace-nowrap">
        <TickerRow />
        <TickerRow />
      </div>
    </div>
  )
}
