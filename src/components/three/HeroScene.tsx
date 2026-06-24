'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { latLngToVector3 } from '@/lib/utils'
import { COLORS } from '@/lib/constants'
import ParticleField from './ParticleField'

// ── Globe ────────────────────────────────────────────────────────────────────

function HeroGlobe({ radius = 1 }: { radius?: number }) {
  const coreRef = useRef<THREE.Mesh>(null)
  const glow1Ref = useRef<THREE.Mesh>(null)
  const glow2Ref = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
    const t = clock.getElapsedTime()
    if (glow1Ref.current) {
      ;(glow1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.1 + Math.sin(t * 0.8) * 0.025
    }
    if (glow2Ref.current) {
      ;(glow2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.05 + Math.sin(t * 0.6 + 1) * 0.015
    }
  })

  return (
    <group ref={groupRef}>
      {/* Deep blue base sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          color="#001a2e"
          emissive="#0a1f3d"
          emissiveIntensity={0.4}
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Neon-blue wireframe overlay */}
      <mesh>
        <sphereGeometry args={[radius + 0.002, 36, 36]} />
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric glow layer 1 — purple/blue, 1.02x */}
      <mesh ref={glow1Ref}>
        <sphereGeometry args={[radius * 1.02, 64, 64]} />
        <meshBasicMaterial
          color="#3b6fef"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Atmospheric glow layer 2 — outer purple, 1.05x */}
      <mesh ref={glow2Ref}>
        <sphereGeometry args={[radius * 1.05, 64, 64]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// ── Star field ───────────────────────────────────────────────────────────────

function StarField({ count = 3000 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 80 + Math.random() * 40
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      sz[i] = Math.random() * 3 + 0.5
    }
    return [pos, sz]
  }, [count])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00015
      pointsRef.current.rotation.x += 0.00005
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        sizeAttenuation
        color="#a8c8ff"
        transparent
        opacity={0.65}
        fog={false}
      />
    </points>
  )
}

// ── Node markers ─────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  guard: COLORS.guard,
  mix: COLORS.mix,
  exit: COLORS.exit,
  client: COLORS.client,
  service: COLORS.purple,
}

function NodeMarkers({ globeRadius = 1 }: { globeRadius?: number }) {
  const nodes = useAppStore((s) => s.nodes)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  const markers = useMemo(() => {
    return nodes.slice(0, 40).map((node) => {
      const [x, y, z] = latLngToVector3(node.lat, node.lng, globeRadius + 0.015)
      const color = NODE_COLORS[node.type] ?? '#ffffff'
      return { id: node.id, x, y, z, color }
    })
  }, [nodes, globeRadius])

  return (
    <group ref={groupRef}>
      {markers.map(({ id, x, y, z, color }) => (
        <group key={id} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
          {/* Glow halo */}
          <mesh>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.18}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Route arcs ───────────────────────────────────────────────────────────────

function arcPoints(
  from: [number, number, number],
  to: [number, number, number],
  segments = 48,
  height = 0.18
): Float32Array {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  mid.normalize().multiplyScalar(start.length() + height)
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  const pts = curve.getPoints(segments)
  const arr = new Float32Array(pts.length * 3)
  pts.forEach((p, i) => {
    arr[i * 3] = p.x
    arr[i * 3 + 1] = p.y
    arr[i * 3 + 2] = p.z
  })
  return arr
}

function RouteArcs({ globeRadius = 1 }: { globeRadius?: number }) {
  const nodes = useAppStore((s) => s.nodes)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  const lineObjects = useMemo(() => {
    const seen = new Set<string>()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const result: THREE.Line[] = []

    const mat = new THREE.LineBasicMaterial({
      color: '#00d4ff',
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    nodes.slice(0, 30).forEach((node) => {
      node.connections.forEach((targetId) => {
        const edgeKey = [node.id, targetId].sort().join('|')
        if (seen.has(edgeKey)) return
        seen.add(edgeKey)

        const target = nodeMap.get(targetId)
        if (!target) return

        const from = latLngToVector3(node.lat, node.lng, globeRadius + 0.005)
        const to = latLngToVector3(target.lat, target.lng, globeRadius + 0.005)
        const positions = arcPoints(from, to)

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        result.push(new THREE.Line(geo, mat))
      })
    })
    return result
  }, [nodes, globeRadius])

  return (
    <group ref={groupRef}>
      {lineObjects.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
}

// ── Moving packet dots ────────────────────────────────────────────────────────

interface PacketDot {
  from: [number, number, number]
  to: [number, number, number]
  progress: number
  speed: number
  color: string
}

function PacketDots({ globeRadius = 1 }: { globeRadius?: number }) {
  const nodes = useAppStore((s) => s.nodes)
  const groupRef = useRef<THREE.Group>(null)

  const packets = useMemo<PacketDot[]>(() => {
    if (nodes.length < 2) return []
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const result: PacketDot[] = []
    const colors = ['#00d4ff', '#7c3aed', '#00ff88']

    nodes.slice(0, 20).forEach((node, idx) => {
      const targetId = node.connections[0]
      const target = nodeMap.get(targetId)
      if (!target) return
      result.push({
        from: latLngToVector3(node.lat, node.lng, globeRadius + 0.012),
        to: latLngToVector3(target.lat, target.lng, globeRadius + 0.012),
        progress: (idx / 20),
        speed: 0.003 + Math.random() * 0.004,
        color: colors[idx % colors.length],
      })
    })
    return result
  }, [nodes, globeRadius])

  const progressRef = useRef(packets.map((p) => p.progress))
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  useEffect(() => {
    progressRef.current = packets.map((p) => p.progress)
  }, [packets])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }

    packets.forEach((pkt, i) => {
      progressRef.current[i] = (progressRef.current[i] + pkt.speed) % 1

      const t = progressRef.current[i]
      const start = new THREE.Vector3(...pkt.from)
      const end = new THREE.Vector3(...pkt.to)
      const mid = start.clone().lerp(end, 0.5)
      mid.normalize().multiplyScalar(start.length() + 0.18)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      const pos = curve.getPoint(t)

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
          <sphereGeometry args={[0.009, 6, 6]} />
          <meshBasicMaterial
            color={pkt.color}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Mouse parallax camera ────────────────────────────────────────────────────

function CameraController() {
  const { camera } = useThree()
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame(() => {
    targetRef.current.x += (mouseRef.current.x - targetRef.current.x) * 0.04
    targetRef.current.y += (mouseRef.current.y - targetRef.current.y) * 0.04

    camera.position.x = targetRef.current.x * 0.25
    camera.position.y = targetRef.current.y * 0.15
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ── Lighting ─────────────────────────────────────────────────────────────────

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} color="#1a2a4a" />
      <pointLight position={[4, 4, 4]} intensity={1.5} color="#00d4ff" distance={20} />
      <pointLight position={[-4, -2, -4]} intensity={0.8} color="#7c3aed" distance={15} />
      <pointLight position={[0, 6, 0]} intensity={0.5} color="#ffffff" distance={12} />
    </>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

export default function HeroScene() {
  return (
    <>
      <SceneLights />
      <CameraController />
      <StarField count={3000} />
      <ParticleField />
      <HeroGlobe radius={1} />
      <NodeMarkers globeRadius={1} />
      <RouteArcs globeRadius={1} />
      <PacketDots globeRadius={1} />
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
