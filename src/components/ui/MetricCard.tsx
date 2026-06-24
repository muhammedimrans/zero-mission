'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  accent?: string
  description?: string
}

export default function MetricCard({
  label,
  value,
  unit,
  icon,
  accent = '#00d4ff',
  description,
}: MetricCardProps) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{
        background: 'rgba(10, 10, 20, 0.7)',
        border: `1px solid ${accent}20`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Glow accent */}
      <div
        className="absolute top-0 left-0 w-full h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-2"
            style={{ color: '#4a5568', fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold"
              style={{
                color: accent,
                fontFamily: 'var(--font-space-grotesk)',
                textShadow: `0 0 16px ${accent}60`,
              }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm" style={{ color: '#4a5568' }}>
                {unit}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs mt-1.5" style={{ color: '#4a5568' }}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
