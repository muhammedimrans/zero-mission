'use client'

import { NodeType } from '@/lib/types'
import { COLORS, NODE_LABELS } from '@/lib/constants'

interface PacketBadgeProps {
  type: NodeType
  size?: 'sm' | 'md'
}

const TYPE_COLORS: Record<NodeType, string> = {
  guard: COLORS.guard,
  mix: COLORS.mix,
  exit: COLORS.exit,
  client: COLORS.client,
  service: COLORS.purple,
}

export default function PacketBadge({ type, size = 'md' }: PacketBadgeProps) {
  const color = TYPE_COLORS[type]
  const label = NODE_LABELS[type] ?? type

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5'
      : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
        fontFamily: 'var(--font-jetbrains-mono)',
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: size === 'sm' ? 5 : 6,
          height: size === 'sm' ? 5 : 6,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  )
}
