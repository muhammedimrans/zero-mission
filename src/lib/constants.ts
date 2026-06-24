// ── Brand design tokens — must match Zero Protocol website (0protocol.net) ──

export const COLORS = {
  /* Backgrounds — neutral near-black, no blue tint */
  bg:          '#08090a',
  bgSecondary: '#0d0e0f',
  bg3:         '#121315',
  surface:     '#0d0e0f',
  surfaceLow:  '#121315',
  surfaceHigh: '#1b1c1d',
  card:        '#0f1216',

  /* Brand primary — neon mint */
  primary:    '#6effc7',
  primaryDim: '#00e5a8',
  secondary:  '#afc6ff',

  /* Text */
  textPrimary:   '#ffffff',
  textSecondary: '#c9d1d9',
  textMuted:     '#9aa4af',

  /* Borders — neutral gray, no color tint */
  border:       'rgba(139,148,158,0.18)',
  borderStrong: 'rgba(139,148,158,0.32)',

  /* Glow */
  glowPrimary: '0 0 24px rgba(0, 229, 168, 0.18)',
  glowSoft:    '0 0 60px rgba(0, 229, 168, 0.08)',

  /* Node-type semantic colors (for Three.js visualization only) */
  guard:  '#38bdf8',   /* Guard nodes — cyan */
  mix:    '#818cf8',   /* Mix nodes — indigo */
  exit:   '#34d399',   /* Exit nodes — emerald */
  client: '#e3e2e3',   /* Client — foreground text */
  warn:   '#ffbe55',   /* Warning */
  danger: '#ff6b6b',   /* Danger */

  /* Legacy aliases — keep for Three.js scenes and pages backward compat */
  accent:       '#38bdf8',
  accent2:      '#818cf8',
  accent3:      '#34d399',
  accent4:      '#a78bfa',
  neonBlue:     '#38bdf8',
  neonBlueGlow: '#38bdf840',
  purple:       '#818cf8',
  purpleGlow:   '#818cf840',
  green:        '#34d399',
  red:          '#ff6b6b',
  white:        '#ffffff',

  /* Text aliases — used throughout pages */
  text:   '#c9d1d9',
  text2:  '#9aa4af',
  muted:  '#9aa4af',
} as const

export const NODE_LABELS: Record<string, string> = {
  guard:   'Guard Node',
  mix:     'Mix Node',
  exit:    'Exit Node',
  client:  'Client',
  service: 'Hidden Service',
}
