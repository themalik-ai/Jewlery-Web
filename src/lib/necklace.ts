import type { CharmInstance } from './types'

export const NECKLACE_VIEWBOX = { width: 1000, height: 580 }
export const T_MIN = 0.08
export const T_MAX = 0.92

export interface Point {
  x: number
  y: number
}

/**
 * Point along a symmetric, two-part quadratic necklace curve.
 * t is normalised across the full chain: 0 = left clasp, 1 = right clasp.
 */
export function pointOnNecklace(tValue: number): Point {
  const t = Math.min(1, Math.max(0, tValue))
  if (t <= 0.5) {
    const u = t * 2
    return quadratic({ x: 82, y: -10 }, { x: 122, y: 438 }, { x: 500, y: 428 }, u)
  }
  const u = (t - 0.5) * 2
  return quadratic({ x: 500, y: 428 }, { x: 878, y: 438 }, { x: 918, y: -10 }, u)
}

function quadratic(p0: Point, p1: Point, p2: Point, t: number): Point {
  const inv = 1 - t
  return {
    x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
  }
}

export function nearestTToPoint(point: Point): number {
  let bestT = 0.5
  let bestDistance = Number.POSITIVE_INFINITY
  // A dense sample is fast enough for the small editor and avoids path API differences.
  for (let i = 0; i <= 420; i += 1) {
    const t = T_MIN + (i / 420) * (T_MAX - T_MIN)
    const p = pointOnNecklace(t)
    const dx = p.x - point.x
    // Weight vertical distance slightly less so dropping immediately below the chain
    // still snaps to the intuitive horizontal position.
    const dy = (p.y - point.y) * 0.72
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      bestDistance = distance
      bestT = t
    }
  }
  return bestT
}

export function defaultCharmT(instances: CharmInstance[]): number {
  const preferred = [0.5, 0.43, 0.57, 0.36, 0.64, 0.29, 0.71, 0.22, 0.78, 0.15, 0.85]
  const occupied = instances.map((item) => item.t)
  const open = preferred.find((t) => occupied.every((value) => Math.abs(value - t) > 0.045))
  if (open != null) return open
  // More than the common number of charms: distribute safely along the usable arc.
  let widest = { start: T_MIN, end: T_MAX, size: 0 }
  const sorted = [T_MIN, ...occupied.sort((a, b) => a - b), T_MAX]
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const size = sorted[i + 1] - sorted[i]
    if (size > widest.size) widest = { start: sorted[i], end: sorted[i + 1], size }
  }
  return (widest.start + widest.end) / 2
}

export function artUrl(imageUrl: string): string {
  if (imageUrl.endsWith('.svg') && imageUrl.startsWith('/charms/')) {
    return imageUrl.replace(/\.svg$/, '-art.svg')
  }
  return imageUrl
}

export function clampT(t: number): number {
  return Math.max(T_MIN, Math.min(T_MAX, t))
}
