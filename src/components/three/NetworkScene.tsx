'use client'

import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { NetworkNode, NodeType } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import { latLngToVector3 } from '@/lib/utils'
import worldTopology from 'world-atlas/countries-110m.json'
import { mesh } from 'topojson-client'
import type { Topology } from 'topojson-specification'

// Pre-computed at module level (runs once, not per render)
function buildGeoLineSegments(
  multiLine: { coordinates: number[][][] },
  radius: number,
): Float32Array {
  const pts: number[] = []
  multiLine.coordinates.forEach((ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lng1, lat1] = ring[i]
      const [lng2, lat2] = ring[i + 1]
      if (Math.abs(lng2 - lng1) > 90) continue // skip antimeridian wraps
      // latLngToVector3 formula inline (avoids import cycle)
      const toXYZ = (lat: number, lng: number) => {
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = (lng + 180) * (Math.PI / 180)
        return [
          -(radius * Math.sin(phi) * Math.cos(theta)),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta),
        ]
      }
      const [x1, y1, z1] = toXYZ(lat1, lng1)
      const [x2, y2, z2] = toXYZ(lat2, lng2)
      pts.push(x1, y1, z1, x2, y2, z2)
    }
  })
  return new Float32Array(pts)
}

const BORDER_RADIUS = 3.603 // just above globe surface

// Land/coastline outlines
const LAND_POSITIONS = buildGeoLineSegments(
  mesh(worldTopology as unknown as Topology, (worldTopology as any).objects.land),
  BORDER_RADIUS,
)

// Internal country borders (exclude coastlines - where a !== b)
const COUNTRY_POSITIONS = buildGeoLineSegments(
  mesh(
    worldTopology as unknown as Topology,
    (worldTopology as any).objects.countries,
    (a: any, b: any) => a !== b,
  ),
  BORDER_RADIUS,
)

// ── Constants ─────────────────────────────────────────────────────────────────

const GLOBE_RADIUS = 3.6
const TRAIL_LENGTH = 10

const NODE_COLOR: Record<NodeType, string> = {
  guard: COLORS.guard,
  mix:   COLORS.mix,
  exit:  COLORS.exit,
  client: COLORS.client,
  service: COLORS.purple,
}

const NODE_SIZE: Record<NodeType, number> = {
  guard:   0.042,
  mix:     0.036,
  exit:    0.042,
  client:  0.034,
  service: 0.034,
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

// ── Arc geometry builder ──────────────────────────────────────────────────────

function buildArcPositions(
  from: [number, number, number],
  to:   [number, number, number],
  segments = 52,
  lift = GLOBE_RADIUS * 0.11,
): Float32Array {
  const start = new THREE.Vector3(...from)
  const end   = new THREE.Vector3(...to)
  const mid   = start.clone().lerp(end, 0.5)
  mid.normalize().multiplyScalar(start.length() + lift)
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  const pts   = curve.getPoints(segments)
  const arr   = new Float32Array(pts.length * 3)
  pts.forEach((p, i) => {
    arr[i * 3]     = p.x
    arr[i * 3 + 1] = p.y
    arr[i * 3 + 2] = p.z
  })
  return arr
}

// ── Globe base with atmosphere ────────────────────────────────────────────────

function GlobeBase() {
  const atmo1 = useRef<THREE.Mesh>(null)
  const atmo2 = useRef<THREE.Mesh>(null)
  const atmo3 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (atmo1.current)
      (atmo1.current.material as THREE.MeshBasicMaterial).opacity =
        0.16 + Math.sin(t * 0.65) * 0.03
    if (atmo2.current)
      (atmo2.current.material as THREE.MeshBasicMaterial).opacity =
        0.07 + Math.sin(t * 0.48 + 1.2) * 0.015
    if (atmo3.current)
      (atmo3.current.material as THREE.MeshBasicMaterial).opacity =
        0.03 + Math.sin(t * 0.35 + 2.5) * 0.008
  })

  return (
    <group>
      {/* Deep ocean sphere */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 80, 80]} />
        <meshStandardMaterial
          color="#010c1a"
          emissive="#040e20"
          emissiveIntensity={0.55}
          roughness={0.9}
          metalness={0.08}
        />
      </mesh>

      {/* Latitude / longitude wireframe */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.012, 22, 14]} />
        <meshBasicMaterial
          color={COLORS.guard}
          wireframe
          transparent
          opacity={0.055}
          depthWrite={false}
        />
      </mesh>

      {/* Inner atmosphere — warm blue */}
      <mesh ref={atmo1}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.028, 64, 64]} />
        <meshBasicMaterial
          color="#1a3e88"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Mid atmosphere — indigo */}
      <mesh ref={atmo2}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.065, 48, 48]} />
        <meshBasicMaterial
          color="#3560d8"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer corona */}
      <mesh ref={atmo3}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.16, 32, 32]} />
        <meshBasicMaterial
          color="#5080ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// ── Globe country border lines ────────────────────────────────────────────────

function GlobeCountryBorders() {
  const landGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(LAND_POSITIONS, 3))
    return geo
  }, [])

  const borderGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(COUNTRY_POSITIONS, 3))
    return geo
  }, [])

  return (
    <group>
      {/* Coastlines — visible teal-gray */}
      <lineSegments geometry={landGeo}>
        <lineBasicMaterial
          color="#3a6a8a"
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Country borders — subtler */}
      <lineSegments geometry={borderGeo}>
        <lineBasicMaterial
          color="#2a4560"
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}

// ── Individual node marker ────────────────────────────────────────────────────

interface NodeMarkerProps {
  node:       NetworkNode
  position:   [number, number, number]
  isSelected: boolean
  isHovered:  boolean
  isFiltered: boolean
  onHover:    (id: string | null) => void
  onSelect:   (node: NetworkNode) => void
}

function NodeMarker({
  node, position, isSelected, isHovered, isFiltered, onHover, onSelect,
}: NodeMarkerProps) {
  const coreRef   = useRef<THREE.Mesh>(null)
  const glowRef   = useRef<THREE.Mesh>(null)
  const pulse1Ref = useRef<THREE.Mesh>(null)
  const pulse2Ref = useRef<THREE.Mesh>(null)

  const color    = NODE_COLOR[node.type] ?? '#ffffff'
  const baseSize = NODE_SIZE[node.type] ?? 0.036
  const offset   = useMemo(
    () => ((hashStr(node.id) & 0xffff) / 0xffff) * Math.PI * 2,
    [node.id],
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (coreRef.current) {
      const target = isHovered || isSelected ? 1.8 : 1.0
      coreRef.current.scale.lerp(
        new THREE.Vector3(target, target, target), 0.12,
      )
    }
    if (glowRef.current) {
      glowRef.current.scale.copy(coreRef.current?.scale ?? new THREE.Vector3(1, 1, 1))
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        (0.18 + Math.sin(t * 1.1 + offset) * 0.06) *
        (isHovered || isSelected ? 2.2 : 1)
    }

    // Dual pulse rings
    if (pulse1Ref.current) {
      const p1 = ((t * 0.48 + offset) % (Math.PI * 2)) / (Math.PI * 2)
      const s1 = 1 + p1 * 4.5
      pulse1Ref.current.scale.set(s1, s1, s1)
      ;(pulse1Ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p1) * 0.38
    }
    if (pulse2Ref.current) {
      const p2 = ((t * 0.48 + offset + Math.PI) % (Math.PI * 2)) / (Math.PI * 2)
      const s2 = 1 + p2 * 4.5
      pulse2Ref.current.scale.set(s2, s2, s2)
      ;(pulse2Ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p2) * 0.2
    }
  })

  if (isFiltered) return null

  return (
    <group position={position}>
      {/* Core sphere */}
      <mesh
        ref={coreRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node.id) }}
        onPointerOut={(e)  => { e.stopPropagation(); onHover(null) }}
        onClick={(e)       => { e.stopPropagation(); onSelect(node) }}
      >
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered || isSelected ? 2.4 : 1.0}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * 2.4, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Pulse ring 1 */}
      <mesh ref={pulse1Ref}>
        <sphereGeometry args={[baseSize * 1.1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Pulse ring 2 — offset half cycle */}
      <mesh ref={pulse2Ref}>
        <sphereGeometry args={[baseSize * 1.1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* HTML label on hover/select */}
      {(isHovered || isSelected) && (
        <Html distanceFactor={10} center>
          <div
            style={{
              background: 'rgba(5,5,8,0.92)',
              border: `1px solid ${color}70`,
              borderRadius: 6,
              padding: '3px 9px',
              color,
              fontSize: 10,
              fontFamily: 'var(--font-jetbrains-mono)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: `0 0 14px ${color}55`,
            }}
          >
            {node.label}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Arc connections (curved on globe surface) ─────────────────────────────────

function GlobeArcs({
  nodes,
  filter,
}: {
  nodes:  NetworkNode[]
  filter: NodeType | 'all'
}) {
  const lineObjects = useMemo(() => {
    const seen    = new Set<string>()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const result: { line: THREE.Line; key: string }[] = []

    nodes.forEach((node) => {
      if (filter !== 'all' && node.type !== filter) return
      const color = NODE_COLOR[node.type]

      node.connections.slice(0, 2).forEach((targetId) => {
        const edgeKey = [node.id, targetId].sort().join('|')
        if (seen.has(edgeKey)) return
        seen.add(edgeKey)

        const target = nodeMap.get(targetId)
        if (!target) return
        if (filter !== 'all' && target.type !== filter) return

        const from = latLngToVector3(node.lat, node.lng, GLOBE_RADIUS + 0.022)
        const to   = latLngToVector3(target.lat, target.lng, GLOBE_RADIUS + 0.022)

        const geo = new THREE.BufferGeometry()
        geo.setAttribute(
          'position',
          new THREE.BufferAttribute(buildArcPositions(from, to), 3),
        )
        const mat = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
        result.push({ line: new THREE.Line(geo, mat), key: edgeKey })
      })
    })
    return result
  }, [nodes, filter])

  return (
    <>
      {lineObjects.map(({ line, key }) => (
        <primitive key={key} object={line} />
      ))}
    </>
  )
}

// ── Packet dots with glowing trails ──────────────────────────────────────────

interface GlobePacket {
  from:     [number, number, number]
  to:       [number, number, number]
  progress: number
  speed:    number
  color:    string
}

function GlobePacketDots({ nodes }: { nodes: NetworkNode[] }) {
  const packets = useMemo<GlobePacket[]>(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const result: GlobePacket[] = []
    let seed = 0

    nodes.slice(0, 22).forEach((node) => {
      const targetId = node.connections[0]
      if (!targetId) return
      const target = nodeMap.get(targetId)
      if (!target) return

      result.push({
        from:     latLngToVector3(node.lat, node.lng, GLOBE_RADIUS + 0.045),
        to:       latLngToVector3(target.lat, target.lng, GLOBE_RADIUS + 0.045),
        progress: seed++ / 22,
        speed:    0.003 + ((hashStr(node.id) & 0xff) / 255) * 0.0042,
        color:    NODE_COLOR[node.type] ?? '#ffffff',
      })
    })
    return result
  }, [nodes])

  const progressRef  = useRef<number[]>([])
  const headRefs     = useRef<(THREE.Mesh | null)[]>([])
  const trailRefs    = useRef<(THREE.Mesh | null)[][]>([])
  const trailHistory = useRef<THREE.Vector3[][]>([])

  useEffect(() => {
    progressRef.current  = packets.map((p) => p.progress)
    trailHistory.current = packets.map(() =>
      Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3()),
    )
  }, [packets])

  useFrame(() => {
    packets.forEach((pkt, i) => {
      if (progressRef.current[i] === undefined) return
      progressRef.current[i] = (progressRef.current[i] + pkt.speed) % 1
      const t = progressRef.current[i]

      const start = new THREE.Vector3(...pkt.from)
      const end   = new THREE.Vector3(...pkt.to)
      const mid   = start.clone().lerp(end, 0.5)
      mid.normalize().multiplyScalar(start.length() + GLOBE_RADIUS * 0.11)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      const pos   = curve.getPoint(t)

      const head = headRefs.current[i]
      if (head) head.position.copy(pos)

      // Shift trail history
      const history = trailHistory.current[i]
      if (history) {
        for (let j = TRAIL_LENGTH - 1; j > 0; j--) history[j].copy(history[j - 1])
        history[0].copy(pos)

        trailRefs.current[i]?.forEach((mesh, ti) => {
          if (mesh && history[ti]) {
            mesh.position.copy(history[ti])
            ;(mesh.material as THREE.MeshBasicMaterial).opacity =
              (1 - ti / TRAIL_LENGTH) * 0.55
          }
        })
      }
    })
  })

  return (
    <group>
      {packets.map((pkt, i) => (
        <group key={i}>
          {/* Packet head */}
          <mesh ref={(el) => { headRefs.current[i] = el }}>
            <sphereGeometry args={[0.028, 6, 6]} />
            <meshBasicMaterial
              color={pkt.color}
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Trail particles */}
          {Array.from({ length: TRAIL_LENGTH }, (_, ti) => (
            <mesh
              key={ti}
              ref={(el) => {
                if (!trailRefs.current[i]) trailRefs.current[i] = []
                trailRefs.current[i][ti] = el
              }}
            >
              <sphereGeometry
                args={[Math.max(0.006, 0.022 * (1 - ti / TRAIL_LENGTH)), 4, 4]}
              />
              <meshBasicMaterial
                color={pkt.color}
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

export interface NetworkSceneProps {
  filter: NodeType | 'all'
}

export default function NetworkScene({ filter }: NetworkSceneProps) {
  const nodes         = useAppStore((s) => s.nodes)
  const selectedNode  = useAppStore((s) => s.selectedNode)
  const hoveredNode   = useAppStore((s) => s.hoveredNode)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)
  const setHoveredNode  = useAppStore((s) => s.setHoveredNode)

  const handleHover = useCallback(
    (id: string | null) => setHoveredNode(id),
    [setHoveredNode],
  )

  const handleSelect = useCallback(
    (node: NetworkNode) => {
      setSelectedNode(selectedNode?.id === node.id ? null : node)
    },
    [selectedNode, setSelectedNode],
  )

  const nodePositions = useMemo(() => {
    const m = new Map<string, [number, number, number]>()
    nodes.forEach((n) =>
      m.set(n.id, latLngToVector3(n.lat, n.lng, GLOBE_RADIUS + 0.045)),
    )
    return m
  }, [nodes])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.18} color="#0c1825" />
      <pointLight position={[10, 7, 10]}  intensity={3.5} color="#38bdf8" distance={50} />
      <pointLight position={[-9, -5, -7]} intensity={1.8} color="#818cf8" distance={35} />
      <pointLight position={[0, 12, 2]}   intensity={1.0} color="#ffffff"  distance={30} />
      <pointLight position={[0, -10, 0]}  intensity={0.6} color="#6effc7"  distance={25} />
      <directionalLight position={[8, 4, 6]} intensity={0.35} color="#7ab4ff" />

      {/* Globe */}
      <GlobeBase />
      <GlobeCountryBorders />

      {/* Arc connections */}
      <GlobeArcs nodes={nodes} filter={filter} />

      {/* Packet dots + trails */}
      <GlobePacketDots nodes={nodes} />

      {/* Node markers */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id)
        if (!pos) return null
        return (
          <NodeMarker
            key={node.id}
            node={node}
            position={pos}
            isSelected={selectedNode?.id === node.id}
            isHovered={hoveredNode === node.id}
            isFiltered={filter !== 'all' && node.type !== filter}
            onHover={handleHover}
            onSelect={handleSelect}
          />
        )
      })}

      {/* Orbit controls — auto-rotating globe */}
      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={5.5}
        maxDistance={18}
        dampingFactor={0.06}
        enableDamping
        autoRotate
        autoRotateSpeed={0.35}
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.7}
          luminanceThreshold={0.14}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
