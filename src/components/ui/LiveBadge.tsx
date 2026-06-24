export default function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1 label-caps text-[10px] text-primary">
      <span aria-hidden className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
      Live
    </span>
  )
}
