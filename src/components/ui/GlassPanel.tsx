'use client'

import { ReactNode, CSSProperties } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  accentColor?: string
  padding?: string
}

export default function GlassPanel({
  children,
  className = '',
  style,
  accentColor = '#00d4ff',
  padding = '1.5rem',
}: GlassPanelProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(10, 10, 20, 0.6)',
        border: `1px solid ${accentColor}18`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding,
        ...style,
      }}
    >
      {/* Top edge glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}40 50%, transparent 100%)`,
        }}
      />
      {children}
    </div>
  )
}
