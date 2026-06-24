'use client'

import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { NetworkNode } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import { latLngToVector3 } from '@/lib/utils'

interface RouteRendererProps {
  nodes: NetworkNode[]
  globeRadius?: number
  activeRoute?: string[]
}

function arcPoints(
  from: [number, number, number],
  to: [number, number, number],
  segments = 32,
  height = 0.15
): THREE.Vector3[] {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  mid.normalize().multiplyScalar(start.length() + height)

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  return curve.getPoints(segments)
}

export default function RouteRenderer({
  nodes,
  globeRadius = 1,
  activeRoute = [],
}: RouteRendererProps) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  )

  const connectionLines = useMemo(() => {
    const lines: { points: THREE.Vector3[]; color: string; opacity: number }[] = []
    const seen = new Set<string>()

    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const key = [node.id, targetId].sort().join('|')
        if (seen.has(key)) return
        seen.add(key)

        const target = nodeMap.get(targetId)
        if (!target) return

        const fromPos = latLngToVector3(node.lat, node.lng, globeRadius + 0.005)
        const toPos = latLngToVector3(target.lat, target.lng, globeRadius + 0.005)
        const isActive =
          activeRoute.includes(node.id) && activeRoute.includes(targetId)

        lines.push({
          points: arcPoints(fromPos, toPos),
          color: isActive ? COLORS.neonBlue : COLORS.muted,
          opacity: isActive ? 0.8 : 0.12,
        })
      })
    })
    return lines
  }, [nodes, nodeMap, globeRadius, activeRoute])

  return (
    <group>
      {connectionLines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.color}
          lineWidth={line.opacity > 0.5 ? 1.5 : 0.5}
          transparent
          opacity={line.opacity}
        />
      ))}
    </group>
  )
}
