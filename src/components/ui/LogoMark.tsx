export default function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className="text-primary"
      role="img"
      aria-label="Zero Protocol logo"
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="6" stroke="currentColor" strokeOpacity="0.4" />
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.4" />
      <line x1="6" y1="26" x2="26" y2="6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
