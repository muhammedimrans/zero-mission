export const COLORS = {
  bg: '#050508',
  bgSecondary: '#0a0a14',
  neonBlue: '#00d4ff',
  neonBlueGlow: '#00d4ff40',
  purple: '#7c3aed',
  purpleGlow: '#7c3aed40',
  green: '#00ff88',
  red: '#ff3366',
  white: '#f0f4ff',
  muted: '#4a5568',
  guard: '#00d4ff',
  mix: '#7c3aed',
  exit: '#00ff88',
  client: '#f0f4ff',
} as const

export const NODE_LABELS: Record<string, string> = {
  guard: 'Guard Node',
  mix: 'Mix Node',
  exit: 'Exit Node',
  client: 'Client',
  service: 'Hidden Service',
}
