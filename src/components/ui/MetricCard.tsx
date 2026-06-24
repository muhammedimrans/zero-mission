'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  accent?: string
  description?: string
  delta?: string
}

export default function MetricCard({
  label,
  value,
  unit,
  icon,
  description,
  delta,
}: MetricCardProps) {
  return (
    <div className="bento-card overflow-hidden p-6 transition-all hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="label-caps mb-1.5 text-[10px] text-text-muted">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tabular-nums text-text-primary md:text-3xl">
              {value}
            </span>
            {unit && (
              <span className="text-base text-text-muted">{unit}</span>
            )}
          </div>
          {delta && (
            <p className="label-caps mt-1.5 text-[10px] text-primary">{delta}</p>
          )}
          {description && (
            <p className="mt-1 text-xs text-text-muted">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
