type ClassValue = string | number | boolean | null | undefined | ClassValue[]

/**
 * Merge class names conditionally.
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 1)
    .filter((v) => v !== false && v !== null && v !== undefined && v !== '')
    .join(' ')
}

/**
 * Convert lat/lng to a 3D cartesian point on a unit sphere.
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number = 1
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Format a latency value for display.
 */
export function formatLatency(ms: number): string {
  return `${ms}ms`
}

/**
 * Format a reputation score as a percentage string.
 */
export function formatReputation(score: number): string {
  return `${(score * 100).toFixed(1)}%`
}
