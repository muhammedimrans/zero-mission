'use client'
import type { ReactNode } from 'react'

/* ── InfoSection ───────────────────────────────────────── */
interface InfoSectionProps {
  label?: string
  title: string
  children: ReactNode
}

export function InfoSection({ label, title, children }: InfoSectionProps) {
  return (
    <section className="mb-8 last:mb-0">
      {label && (
        <div
          className="label-caps mb-1 text-[10px]"
          style={{ color: 'var(--primary)', opacity: 0.7 }}
        >
          {label}
        </div>
      )}
      <h2
        className="mb-3 text-base font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

/* ── KV (key-value table) ──────────────────────────────── */
interface KVPair {
  k: string
  v: string | ReactNode
}

interface KVProps {
  pairs: KVPair[]
}

export function KV({ pairs }: KVProps) {
  return (
    <dl
      className="grid gap-x-4 gap-y-1.5"
      style={{
        gridTemplateColumns: 'auto 1fr',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
      }}
    >
      {pairs.map(({ k, v }) => (
        <>
          <dt
            key={`k-${k}`}
            className="whitespace-nowrap"
            style={{ color: 'var(--text-muted, #64748b)' }}
          >
            {k}
          </dt>
          <dd
            key={`v-${k}`}
            style={{ color: 'var(--text-primary)' }}
          >
            {v}
          </dd>
        </>
      ))}
    </dl>
  )
}

/* ── StepList ──────────────────────────────────────────── */
interface Step {
  title: string
  description?: string
}

interface StepListProps {
  steps: Step[]
}

export function StepList({ steps }: StepListProps) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <div
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
            style={{
              borderColor: 'rgba(110,255,199,0.4)',
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {i + 1}
          </div>
          <div>
            <div
              className="text-xs font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {step.title}
            </div>
            {step.description && (
              <div
                className="mt-0.5 text-xs leading-relaxed"
                style={{ color: 'var(--text-muted, #64748b)' }}
              >
                {step.description}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ── Pill ──────────────────────────────────────────────── */
type PillVariant = 'primary' | 'guard' | 'mix' | 'exit' | 'warn'

const PILL_COLORS: Record<PillVariant, { border: string; text: string; bg: string }> = {
  primary: { border: '#6effc7', text: '#6effc7', bg: 'rgba(110,255,199,0.08)' },
  guard:   { border: '#38bdf8', text: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  mix:     { border: '#818cf8', text: '#818cf8', bg: 'rgba(129,140,248,0.08)' },
  exit:    { border: '#34d399', text: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  warn:    { border: '#f59e0b', text: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
}

interface PillProps {
  variant?: PillVariant
  children: ReactNode
}

export function Pill({ variant = 'primary', children }: PillProps) {
  const c = PILL_COLORS[variant]
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: c.border,
        color: c.text,
        background: c.bg,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
    </span>
  )
}

/* ── Divider ───────────────────────────────────────────── */
export function Divider() {
  return <hr className="my-6 border-white/10" />
}
