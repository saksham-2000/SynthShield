// Each item cycles through the rainbow with a staggered delay
const ITEMS = [
  'Works on upto 50,000 rows',
  'Laplace Noise Mechanism',
  'LoRA powered synthesis',
  'Client-Side privacy',
  'Audit-ready certificate',
]

function TickerRow() {
  return (
    <>
      {ITEMS.map((text, i) => (
        <span key={i} className="shrink-0 flex items-center">
          <span
            className="ticker-rainbow text-sm font-semibold tracking-wide px-2"
            style={{ animationDelay: `${i * 1.1}s` }}
          >
            {text}
          </span>
          <span className="text-zinc-800 mx-8 select-none">·</span>
        </span>
      ))}
    </>
  )
}

export function Ticker() {
  return (
    <div
      className="ticker-fade w-full overflow-hidden py-3.5 select-none"
      aria-hidden="true"
    >
      <div className="ticker-track flex whitespace-nowrap">
        <TickerRow />
        <TickerRow />
      </div>
    </div>
  )
}
