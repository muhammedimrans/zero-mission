'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Packet, NetworkNode } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import { latLngToVector3 } from '@/lib/utils'

interface PacketRendererProps {
  packets: Packet[]
  nodes: NetworkNode[]
  globeRadius?: number
}

function lerpOnArc(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
  height = 0.12
): THREE.Vector3 {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  mid.normalize().multiplyScalar(start.length() + height)

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  return curve.getPoint(t)
}

function PacketMesh({
  packet,
  nodeMap,
  globeRadius,
}: {
  packet: Packet
  nodeMap: Map<string, NetworkNode>
  globeRadius: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const progressRef = useRef(packet.progress)
  const segmentRef = useRef(0)

  useFrame((_, delta) => {
    progressRef.current += delta * 0.25
    if (progressRef.current >= 1) {
      progressRef.current = 0
      segmentRef.current = (segmentRef.current + 1) % Math.max(1, packet.path.length - 1)
    }

    const seg = segmentRef.current
    const fromId = packet.path[seg]
    const toId = packet.path[seg + 1]
    if (!fromId || !toId) return

    const fromNode = nodeMap.get(fromId)
    const toNode = nodeMap.get(toId)
    if (!fromNode || !toNode) return

    const fromPos = latLngToVector3(fromNode.lat, fromNode.lng, globeRadius + 0.01)
    const toPos = latLngToVector3(toNode.lat, toNode.lng, globeRadius + 0.01)
    const pos = lerpOnArc(fromPos, toPos, progressRef.current)

    if (meshRef.current) {
      meshRef.current.position.copy(pos)
    }
  })

  const color = packet.encrypted ? COLORS.neonBlue : COLORS.red

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.012, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  )
}

export default function PacketRenderer({
  packets,
  nodes,
  globeRadius = 1,
}: PacketRendererProps) {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  return (
    <group>
      {packets.map((packet) => (
        <PacketMesh
          key={packet.id}
          packet={packet}
          nodeMap={nodeMap}
          globeRadius={globeRadius}
        />
      ))}
    </group>
  )
}
