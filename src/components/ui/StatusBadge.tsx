type Status = 'online' | 'offline' | 'building' | 'active' | 'warning'

const tones: Record<Status, string> = {
  online:   'border-node-exit/30 bg-node-exit/[0.06] text-node-exit',
  offline:  'border-destructive/30 bg-destructive/10 text-destructive',
  building: 'border-warning/30 bg-warning/10 text-warning',
  active:   'border-primary/30 bg-primary/[0.06] text-primary',
  warning:  'border-warning/30 bg-warning/10 text-warning',
}

const dots: Record<Status, string> = {
  online:   'bg-node-exit',
  offline:  'bg-destructive',
  building: 'bg-warning',
  active:   'animate-pulse-dot bg-primary',
  warning:  'bg-warning',
}

const labels: Record<Status, string> = {
  online:   'Online',
  offline:  'Offline',
  building: 'Building',
  active:   'Active',
  warning:  'Warning',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 label-caps text-[10px] ${tones[status]}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  )
}
