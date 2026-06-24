'use client'

import { useRef, useMemo, useEffect } from 'react'
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

// ── Connection lines with active-hop highlight ────────────────────────────────

function ChainConnections({
  nodes,
  activeHop,
}: {
  nodes:     RouteNode[]
  activeHop: number
}) {
  const matRefs = useRef<(THREE.LineBasicMaterial | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    matRefs.current.forEach((mat, i) => {
      if (!mat) return
      const isActive = i === activeHop
      const target = isActive ? 0.85 : 0.22
      mat.opacity += (target - mat.opacity) * 0.12
      if (isActive) {
        // Animated pulse along active edge
        mat.opacity = 0.55 + Math.sin(t * 8) * 0.3
      }
    })
  })

  const lineObjects = useMemo(() => {
    const result: { line: THREE.Line; mat: THREE.LineBasicMaterial; key: string }[] = []
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i].position
      const to   = nodes[i + 1].position
      const geo  = new THREE.BufferGeometry()
      const pts  = new Float32Array([...from, ...to])
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
      const blendColor = nodes[i].color
      const mat = new THREE.LineBasicMaterial({
        color:      blendColor,
        transparent: true,
        opacity:    0.22,
        depthWrite: false,
        blending:   THREE.AdditiveBlending,
      })
      result.push({ line: new THREE.Line(geo, mat), mat, key: `chain-${i}` })
    }
    return result
  }, [nodes])

  useEffect(() => {
    matRefs.current = lineObjects.map((o) => o.mat)
  }, [lineObjects])

  return (
    <>
      {lineObjects.map(({ line, key }) => (
        <primitive key={key} object={line} />
      ))}
    </>
  )
}

// ── Moving packet dot with mint glow trail ────────────────────────────────────

const PACKET_TRAIL = 8

function PacketDot({
  nodes,
  progress,
}: {
  nodes:    RouteNode[]
  progress: number
}) {
  const headRef      = useRef<THREE.Mesh>(null)
  const trailRefs    = useRef<(THREE.Mesh | null)[]>([])
  const trailHistory = useRef<THREE.Vector3[]>(
    Array.from({ length: PACKET_TRAIL }, () => new THREE.Vector3()),
  )
  const progressRef = useRef(progress)
  progressRef.current = progress

  useFrame(() => {
    if (!headRef.current || nodes.length < 2) return
    const segCount = nodes.length - 1
    const total    = progressRef.current % nodes.length
    const segIdx   = Math.min(Math.floor(total), segCount - 1)
    const segT     = total - segIdx

    const from = new THREE.Vector3(...nodes[segIdx].position)
    const to   = new THREE.Vector3(...nodes[Math.min(segIdx + 1, nodes.length - 1)].position)
    const pos  = from.lerp(to, Math.min(segT, 1))
    headRef.current.position.copy(pos)

    // Shift trail history
    for (let j = PACKET_TRAIL - 1; j > 0; j--) {
      trailHistory.current[j].copy(trailHistory.current[j - 1])
    }
    trailHistory.current[0].copy(pos)

    // Update trail mesh positions + opacity
    trailRefs.current.forEach((mesh, i) => {
      if (mesh && trailHistory.current[i]) {
        mesh.position.copy(trailHistory.current[i])
        ;(mesh.material as THREE.MeshBasicMaterial).opacity =
          (1 - i / PACKET_TRAIL) * 0.65
      }
    })
  })

  return (
    <group>
      {/* Head — bright white */}
      <mesh ref={headRef}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Mint trail */}
      {Array.from({ length: PACKET_TRAIL }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { trailRefs.current[i] = el }}
        >
          <sphereGeometry
            args={[Math.max(0.01, 0.055 * (1 - i / PACKET_TRAIL)), 6, 6]}
          />
          <meshBasicMaterial
            color={COLORS.primary ?? '#6effc7'}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
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
      <ChainConnections nodes={nodes} activeHop={activeHop} />
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
