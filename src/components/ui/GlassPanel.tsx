'use client'

import { ReactNode, CSSProperties } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  padding?: string
  glow?: boolean
  accentColor?: string // deprecated — visual parity uses brand primary
  hover?: boolean      // deprecated — handled by CSS
}

export default function GlassPanel({
  children,
  className = '',
  style,
  padding,
  glow = false,
  // accentColor and hover intentionally unused — brand consistency
}: GlassPanelProps) {
  return (
    <div
      className={`bento-card overflow-hidden p-6 transition-all hover:border-primary/30 ${glow ? 'shadow-[var(--shadow-glow-soft)]' : ''} ${className}`}
      style={{ ...(padding ? { padding } : {}), ...style }}
    >
      {children}
    </div>
  )
}
