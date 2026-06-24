'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { NetworkNode, NodeType } from '@/lib/types'
import { COLORS } from '@/lib/constants'

// ── Constants ────────────────────────────────────────────────────────────────

const NODE_COLOR: Record<NodeType, string> = {
  guard: COLORS.guard,
  mix: COLORS.mix,
  exit: COLORS.exit,
  client: COLORS.client,
  service: COLORS.purple,
}

const NODE_SIZE: Record<NodeType, number> = {
  guard: 0.12,
  mix: 0.1,
  exit: 0.12,
  client: 0.1,
  service: 0.1,
}

// ── Seed-based layout (stable positions from node id) ────────────────────────

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

function nodePosition(id: string): [number, number, number] {
  const h = hashStr(id)
  const h2 = hashStr(id + 'y')
  const h3 = hashStr(id + 'z')
  const x = (((h & 0xffff) / 0xffff) * 2 - 1) * 5
  const y = (((h2 & 0xffff) / 0xffff) * 2 - 1) * 3
  const z = (((h3 & 0xffff) / 0xffff) * 2 - 1) * 2
  return [x, y, z]
}

// ── Individual interactive node sphere ───────────────────────────────────────

interface NodeSphereProps {
  node: NetworkNode
  position: [number, number, number]
  isSelected: boolean
  isHovered: boolean
  isFiltered: boolean
  onHover: (id: string | null) => void
  onSelect: (node: NetworkNode) => void
}

function NodeSphere({
  node,
  position,
  isSelected,
  isHovered,
  isFiltered,
  onHover,
  onSelect,
}: NodeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const color = NODE_COLOR[node.type] ?? '#ffffff'
  const baseSize = NODE_SIZE[node.type] ?? 0.1

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return
    const t = clock.getElapsedTime()
    const targetScale = isHovered || isSelected ? 1.5 : 1
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.12
    )
    glowRef.current.scale.copy(meshRef.current.scale)
    const mat = glowRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (0.15 + Math.sin(t * 1.5 + hashStr(node.id) * 0.01) * 0.05) *
      (isHovered || isSelected ? 1.6 : 1)
  })

  if (isFiltered) return null

  return (
    <group position={position}>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node.id) }}
        onPointerOut={(e) => { e.stopPropagation(); onHover(null) }}
        onClick={(e) => { e.stopPropagation(); onSelect(node) }}
      >
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered || isSelected ? 1.2 : 0.6}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * 1.8, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Label on hover/select */}
      {(isHovered || isSelected) && (
        <Html distanceFactor={10} center>
          <div
            style={{
              background: 'rgba(5,5,8,0.85)',
              border: `1px solid ${color}60`,
              borderRadius: 6,
              padding: '3px 8px',
              color,
              fontSize: 10,
              fontFamily: 'var(--font-jetbrains-mono)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: `0 0 10px ${color}40`,
            }}
          >
            {node.label}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Connection lines ──────────────────────────────────────────────────────────

interface ConnectionLinesProps {
  nodes: NetworkNode[]
  posMap: Map<string, [number, number, number]>
  filter: NodeType | 'all'
}

function ConnectionLines({ nodes, posMap, filter }: ConnectionLinesProps) {
  const lineObjects = useMemo(() => {
    const seen = new Set<string>()
    const nodeMap = new Map(nodes.map((n) => [n.id, n])
    )
    const result: { line: THREE.Line; key: string }[] = []

    nodes.forEach((node) => {
      if (filter !== 'all' && node.type !== filter) return
      const color = NODE_COLOR[node.type] ?? '#ffffff'
      node.connections.forEach((targetId) => {
        const edgeKey = [node.id, targetId].sort().join('|')
        if (seen.has(edgeKey)) return
        seen.add(edgeKey)

        const target = nodeMap.get(targetId)
        if (!target) return
        if (filter !== 'all' && target.type !== filter) return

        const from = posMap.get(node.id)
        const to = posMap.get(targetId)
        if (!from || !to) return

        const geo = new THREE.BufferGeometry()
        const pts = new Float32Array([...from, ...to])
        geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))

        const mat = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })

        result.push({ line: new THREE.Line(geo, mat), key: edgeKey })
      })
    })

    return result
  }, [nodes, posMap, filter])

  return (
    <>
      {lineObjects.map(({ line, key }) => (
        <primitive key={key} object={line} />
      ))}
    </>
  )
}

// ── Packet dots moving along connections ─────────────────────────────────────

interface PacketData {
  fromPos: [number, number, number]
  toPos: [number, number, number]
  progress: number
  speed: number
  color: string
}

function PacketDots({
  nodes,
  posMap,
}: {
  nodes: NetworkNode[]
  posMap: Map<string, [number, number, number]>
}) {
  const groupRef = useRef<THREE.Group>(null)

  const packets = useMemo<PacketData[]>(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const result: PacketData[] = []
    let seed = 0

    nodes.slice(0, 25).forEach((node) => {
      const targetId = node.connections[0]
      if (!targetId) return
      const target = nodeMap.get(targetId)
      if (!target) return

      const from = posMap.get(node.id)
      const to = posMap.get(target.id)
      if (!from || !to) return

      result.push({
        fromPos: from,
        toPos: to,
        progress: (seed++ / 25),
        speed: 0.004 + ((hashStr(node.id) & 0xff) / 255) * 0.006,
        color: NODE_COLOR[node.type] ?? '#ffffff',
      })
    })
    return result
  }, [nodes, posMap])

  const progressRef = useRef<number[]>(packets.map((p) => p.progress))
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(() => {
    packets.forEach((pkt, i) => {
      progressRef.current[i] = (progressRef.current[i] + pkt.speed) % 1
      const t = progressRef.current[i]

      const from = new THREE.Vector3(...pkt.fromPos)
      const to = new THREE.Vector3(...pkt.toPos)
      const pos = from.lerp(to, t)

      const mesh = meshRefs.current[i]
      if (mesh) mesh.position.copy(pos)
    })
  })

  return (
    <group ref={groupRef}>
      {packets.map((pkt, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el }}
        >
          <sphereGeometry args={[0.028, 6, 6]} />
          <meshBasicMaterial
            color={pkt.color}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

export interface NetworkSceneProps {
  filter: NodeType | 'all'
}

export default function NetworkScene({ filter }: NetworkSceneProps) {
  const nodes = useAppStore((s) => s.nodes)
  const selectedNode = useAppStore((s) => s.selectedNode)
  const hoveredNode = useAppStore((s) => s.hoveredNode)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)
  const setHoveredNode = useAppStore((s) => s.setHoveredNode)

  const handleHover = useCallback(
    (id: string | null) => setHoveredNode(id),
    [setHoveredNode]
  )

  const handleSelect = useCallback(
    (node: NetworkNode) => {
      setSelectedNode(selectedNode?.id === node.id ? null : node)
    },
    [selectedNode, setSelectedNode]
  )

  // Stable positions keyed by node id
  const posMap = useMemo(() => {
    const m = new Map<string, [number, number, number]>()
    nodes.forEach((n) => m.set(n.id, nodePosition(n.id)))
    return m
  }, [nodes])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.25} color="#1a1a2e" />
      <pointLight position={[5, 5, 5]} intensity={2} color="#38bdf8" distance={25} />
      <pointLight position={[-5, -3, -3]} intensity={1.2} color="#818cf8" distance={20} />
      <pointLight position={[0, 8, 2]} intensity={0.6} color="#ffffff" distance={18} />

      {/* Fog */}
      <fog attach="fog" args={['#020b18', 18, 35]} />

      {/* Connection lines */}
      <ConnectionLines nodes={nodes} posMap={posMap} filter={filter} />

      {/* Packet animations */}
      <PacketDots nodes={nodes} posMap={posMap} />

      {/* Node spheres */}
      {nodes.map((node) => {
        const pos = posMap.get(node.id)
        if (!pos) return null
        const isFiltered = filter !== 'all' && node.type !== filter
        return (
          <NodeSphere
            key={node.id}
            node={node}
            position={pos}
            isSelected={selectedNode?.id === node.id}
            isHovered={hoveredNode === node.id}
            isFiltered={isFiltered}
            onHover={handleHover}
            onSelect={handleSelect}
          />
        )
      })}

      {/* Controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={20}
        dampingFactor={0.08}
        enableDamping
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
