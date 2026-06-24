'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/constants'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RouteNode {
  label: string
  color: string
  position: [number, number, number]
}

export interface RouteChainProps {
  nodes: RouteNode[]
  packetProgress: number   // 0..nodes.length (continuous, driven by parent)
  activeHop: number        // which hop is currently highlighted (-1 = none)
  showLabels?: boolean
  scale?: number
}

// ── Single chain node ─────────────────────────────────────────────────────────

function ChainNode({
  node,
  isActive,
  isBurst,
  showLabel,
}: {
  node: RouteNode
  isActive: boolean
  isBurst: boolean
  showLabel: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const burstRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return
    const t = clock.getElapsedTime()
    const pulse = 0.9 + Math.sin(t * 2.5) * 0.1

    const targetScale = isActive ? 1.5 : 1.0
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    )
    glowRef.current.scale.copy(meshRef.current.scale)

    const mat = glowRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = isActive ? 0.35 * pulse : 0.12

    if (burstRef.current) {
      const bMat = burstRef.current.material as THREE.MeshBasicMaterial
      if (isBurst) {
        burstRef.current.scale.lerp(new THREE.Vector3(3, 3, 3), 0.15)
        bMat.opacity = Math.max(0, bMat.opacity - 0.04)
      } else {
        burstRef.current.scale.set(0.5, 0.5, 0.5)
        bMat.opacity = 0.5
      }
    }
  })

  return (
    <group position={node.position}>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isActive ? 1.4 : 0.5}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.32, 14, 14]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Burst ring */}
      <mesh ref={burstRef}>
        <ringGeometry args={[0.22, 0.3, 24]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Label */}
      {showLabel && (
        <Html distanceFactor={8} center position={[0, -0.38, 0]}>
          <div
            style={{
              background: 'rgba(5,5,8,0.85)',
              border: `1px solid ${node.color}50`,
              borderRadius: 4,
              padding: '2px 8px',
              color: node.color,
              fontSize: 10,
              fontFamily: 'var(--font-jetbrains-mono)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {node.label}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Connection lines between chain nodes ──────────────────────────────────────

function ChainConnections({ nodes }: { nodes: RouteNode[] }) {
  const lineObjects = useMemo(() => {
    const result: { line: THREE.Line; key: string }[] = []
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i].position
      const to = nodes[i + 1].position
      const geo = new THREE.BufferGeometry()
      const pts = new Float32Array([...from, ...to])
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
      const mat = new THREE.LineBasicMaterial({
        color: COLORS.neonBlue,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      result.push({ line: new THREE.Line(geo, mat), key: `chain-${i}` })
    }
    return result
  }, [nodes])

  return (
    <>
      {lineObjects.map(({ line, key }) => (
        <primitive key={key} object={line} />
      ))}
    </>
  )
}

// ── Moving packet dot ─────────────────────────────────────────────────────────

function PacketDot({
  nodes,
  progress,
}: {
  nodes: RouteNode[]
  progress: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const progressRef = useRef(progress)

  // Keep ref in sync
  progressRef.current = progress

  useFrame(() => {
    if (!meshRef.current || nodes.length < 2) return
    const segCount = nodes.length - 1
    const total = progressRef.current % nodes.length
    const segIdx = Math.min(Math.floor(total), segCount - 1)
    const segT = total - segIdx

    const from = new THREE.Vector3(...nodes[segIdx].position)
    const to = new THREE.Vector3(...nodes[Math.min(segIdx + 1, nodes.length - 1)].position)
    const pos = from.lerp(to, Math.min(segT, 1))
    meshRef.current.position.copy(pos)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Exported component ────────────────────────────────────────────────────────

export default function RouteChain({
  nodes,
  packetProgress,
  activeHop,
  showLabels = true,
}: RouteChainProps) {
  return (
    <group>
      <ChainConnections nodes={nodes} />
      {nodes.map((node, i) => (
        <ChainNode
          key={node.label}
          node={node}
          isActive={i === activeHop}
          isBurst={i === activeHop}
          showLabel={showLabels}
        />
      ))}
      <PacketDot nodes={nodes} progress={packetProgress} />
    </group>
  )
}
