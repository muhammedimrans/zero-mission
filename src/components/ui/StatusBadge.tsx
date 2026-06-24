'use client'

type Status = 'online' | 'offline' | 'building' | 'active' | 'warning'

interface StatusBadgeProps {
  status: Status
}

const statusConfig: Record<Status, { label: string; color: string; dot: string; bg: string; border: string }> = {
  online: {
    label: 'ONLINE',
    color: '#00ff88',
    dot: '#00ff88',
    bg: 'rgba(0, 255, 136, 0.08)',
    border: 'rgba(0, 255, 136, 0.25)',
  },
  offline: {
    label: 'OFFLINE',
    color: '#ff3366',
    dot: '#ff3366',
    bg: 'rgba(255, 51, 102, 0.08)',
    border: 'rgba(255, 51, 102, 0.25)',
  },
  building: {
    label: 'BUILDING',
    color: '#f59e0b',
    dot: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  active: {
    label: 'ACTIVE',
    color: '#00d4ff',
    dot: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.08)',
    border: 'rgba(0, 212, 255, 0.25)',
  },
  warning: {
    label: 'WARNING',
    color: '#f59e0b',
    dot: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontFamily: 'var(--font-jetbrains-mono)',
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  )
}
