'use client'

export default function LiveBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
      style={{
        background: 'rgba(0, 255, 136, 0.08)',
        border: '1px solid rgba(0, 255, 136, 0.25)',
        color: '#00ff88',
        fontFamily: 'var(--font-jetbrains-mono)',
      }}
    >
      <span
        className="relative flex h-2 w-2"
        aria-hidden="true"
      >
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: '#00ff88' }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: '#00ff88' }}
        />
      </span>
      LIVE
    </span>
  )
}
