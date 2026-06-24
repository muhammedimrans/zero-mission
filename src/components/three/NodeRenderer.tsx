'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { NetworkNode } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import { latLngToVector3 } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

interface NodeRendererProps {
  nodes: NetworkNode[]
  globeRadius?: number
}

const NODE_COLORS: Record<string, string> = {
  guard: COLORS.guard,
  mix: COLORS.mix,
  exit: COLORS.exit,
  client: COLORS.client,
  service: COLORS.purple,
}

function NodeMesh({ node, globeRadius }: { node: NetworkNode; globeRadius: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { hoveredNode, selectedNode, setHoveredNode, setSelectedNode } = useAppStore()

  const color = NODE_COLORS[node.type] ?? '#ffffff'
  const isHovered = hoveredNode === node.id
  const isSelected = selectedNode?.id === node.id

  const [x, y, z] = latLngToVector3(node.lat, node.lng, globeRadius + 0.01)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      const pulse = 0.5 + Math.sin(clock.getElapsedTime() * 2 + parseInt(node.id.split('-')[1], 10)) * 0.3
      mat.opacity = isHovered || isSelected ? 1 : 0.7 + pulse * 0.3
    }
  })

  return (
    <group position={[x, y, z]}>
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHoveredNode(node.id)}
        onPointerLeave={() => setHoveredNode(null)}
        onClick={() => setSelectedNode(isSelected ? null : node)}
      >
        <sphereGeometry args={[isHovered || isSelected ? 0.025 : 0.015, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>

      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.04, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered || isSelected ? 0.6 : 0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {(isHovered || isSelected) && (
        <Html distanceFactor={4} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(5,5,8,0.85)',
              border: `1px solid ${color}60`,
              borderRadius: 6,
              padding: '4px 8px',
              color,
              fontSize: 10,
              fontFamily: 'var(--font-jetbrains-mono)',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(8px)',
            }}
          >
            {node.label}
            <br />
            <span style={{ color: '#4a5568' }}>
              {node.latency}ms · {node.country}
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default function NodeRenderer({ nodes, globeRadius = 1 }: NodeRendererProps) {
  const instancedColors = useMemo(
    () => nodes.map((n) => NODE_COLORS[n.type] ?? '#ffffff'),
    [nodes]
  )
  void instancedColors

  return (
    <group>
      {nodes.map((node) => (
        <NodeMesh key={node.id} node={node} globeRadius={globeRadius} />
      ))}
    </group>
  )
}
