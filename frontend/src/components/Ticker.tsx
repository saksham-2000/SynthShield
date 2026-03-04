// Each item cycles through the rainbow with a staggered delay
const ITEMS = [
  'Differential Privacy (ε-δ)',
  'DP-SGD via Opacus',
  'T5-small + LoRA',
  'RDP Accountant',
  'KL Divergence Verified',
  'HIPAA / GDPR Ready',
  'Works on 50,000+ rows',
  'Audit-ready Certificate',
]

function TickerRow() {
  return (
    <>
      {ITEMS.map((text, i) => (
        <span
          key={i}
          className="ticker-item shrink-0 flex items-center"
          style={{ animationDelay: `${i * 0.8}s` }}
        >
          <span
            className="ticker-rainbow text-md font-semibold tracking-wide px-2"
            style={{ animationDelay: `${i * 0.8}s` }}
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
      className="ticker-fade w-full overflow-hidden py-1.5 select-none"
      aria-hidden="true"
    >
      <div className="ticker-track flex whitespace-nowrap">
        <TickerRow />
        <TickerRow />
      </div>
    </div>
  )
}
