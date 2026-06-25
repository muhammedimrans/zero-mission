'use client'
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import dynamic from 'next/dynamic'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, StepList, Pill, Divider } from '@/components/zp/InfoBlocks'

/* ── Constants ─────────────────────────────────────────── */
const HOPS = [
  { label: 'Client',  color: '#6effc7', role: 'client' as const },
  { label: 'Guard',   color: '#38bdf8', role: 'guard'  as const },
  { label: 'Mix 1',   color: '#818cf8', role: 'mix'    as const },
  { label: 'Mix 2',   color: '#818cf8', role: 'mix'    as const },
  { label: 'Exit',    color: '#34d399', role: 'exit'   as const },
]
const HOP_X = [-5, -2.5, 0, 2.5, 5]

/* ── HopNode ───────────────────────────────────────────── */
function HopNode({ index, active }: { index: number; active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { color } = HOPS[index]

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4
      const target = active ? 1 : 0.3
      const curr = (meshRef.current.material as THREE.MeshStandardMaterial).opacity
      ;(meshRef.current.material as THREE.MeshStandardMaterial).opacity +=
        (target - curr) * delta * 4
    }
  })

  return (
    <group position={[HOP_X[index], 0, 0]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.9 : 0.1}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.2 : 0.15}
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={active ? 0.95 : 0.4}
        />
      </mesh>
    </group>
  )
}

/* ── OnionPacket ────────────────────────────────────────── */
function OnionPacket({ built }: { built: number }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.5
  })

  const shells = [
    { r: 0.22, color: '#6effc7', opacity: 0.3 },
    { r: 0.34, color: '#38bdf8', opacity: 0.22 },
    { r: 0.44, color: '#818cf8', opacity: 0.16 },
    { r: 0.54, color: '#818cf8', opacity: 0.12 },
    { r: 0.64, color: '#34d399', opacity: 0.08 },
  ]

  return (
    <group ref={groupRef} position={[HOP_X[0] - 1.8, 0, 0]}>
      {shells.slice(0, built + 1).map((s, i) => (
        <mesh key={i}>
          <sphereGeometry args={[s.r, 12, 12]} />
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={0.5}
            transparent
            opacity={s.opacity}
            wireframe
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── TunnelSegment ──────────────────────────────────────── */
function TunnelSegment({ from, to, active }: { from: number; to: number; active: boolean }) {
  const mid = (HOP_X[from] + HOP_X[to]) / 2
  const len = Math.abs(HOP_X[to] - HOP_X[from])
  return (
    <mesh position={[mid, 0, -0.1]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.04, 0.04, len, 8]} />
      <meshStandardMaterial
        color={active ? '#6effc7' : '#1e293b'}
        emissive={active ? '#6effc7' : '#000'}
        emissiveIntensity={active ? 0.6 : 0}
        transparent
        opacity={active ? 0.7 : 0.25}
      />
    </mesh>
  )
}

/* ── CircuitFlow (animated packets) ────────────────────── */
function CircuitFlow({ built }: { built: number }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const phase = (t * 0.8 + i * 0.1) % 1
      const xFrom = HOP_X[0]
      const xTo   = HOP_X[built]
      child.position.x = xFrom + (xTo - xFrom) * phase
      child.position.y = Math.sin(t * 2 + i) * 0.06
      ;(child as THREE.Mesh & { material: THREE.MeshStandardMaterial }).material.opacity =
        0.3 + Math.sin(t * 3 + i * 0.7) * 0.2
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial
            color="#6effc7"
            emissive="#6effc7"
            emissiveIntensity={1.5}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── Full Scene ─────────────────────────────────────────── */
function CircuitScene({ built }: { built: number }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 4, 6]} intensity={0.8} color="#6effc7" />
      <pointLight position={[0, -3, -4]} intensity={0.4} color="#38bdf8" />

      {HOPS.map((_, i) => (
        <HopNode key={i} index={i} active={i <= built} />
      ))}

      {Array.from({ length: built }).map((_, i) => (
        <TunnelSegment key={i} from={i} to={i + 1} active />
      ))}

      {built >= 0 && <OnionPacket built={built} />}
      {built >= 1 && <CircuitFlow built={built} />}

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

/* ── Lazy Scene ─────────────────────────────────────────── */
const LazyCircuit = dynamic(
  () => Promise.resolve(({ built }: { built: number }) => <CircuitScene built={built} />),
  { ssr: false }
)

/* ── Page ───────────────────────────────────────────────── */
export default function CircuitBuilderPage() {
  const [built, setBuilt] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setBuilt(b => (b + 1) % 5), 1700)
    return () => clearInterval(id)
  }, [playing])

  const info = (
    <>
      <InfoSection label="Zero Protocol · L3 Multi-Path" title="Circuit Construction">
        <StepList
          steps={[
            {
              title: 'Key Exchange — Guard Node',
              description: 'Client performs Sphinx ECDH with the guard. Derives shared secret K₁, wraps first layer.',
            },
            {
              title: 'Extend — Mix Node 1',
              description: 'Guard relays EXTEND cell. Client completes second ECDH without guard seeing destination.',
            },
            {
              title: 'Extend — Mix Node 2',
              description: 'Each hop adds an onion layer. The relay never knows more than its predecessor and successor.',
            },
            {
              title: 'Extend — Exit Node',
              description: 'Final hop established. All four keys derived. Packet traverses 4 nodes, 4 layers of encryption.',
            },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection label="Sphinx V1 Parameters" title="Packet Format">
        <KV
          pairs={[
            { k: 'HEADER_LEN', v: '576 B' },
            { k: 'α (DH key)', v: '32 B' },
            { k: 'γ (MAC)',    v: '32 B' },
            { k: 'β (routing)',v: '512 B' },
            { k: 'Payload',   v: '1 024 B' },
            { k: 'SPHINX_LEN',v: '1 600 B total' },
            { k: 'MAX_HOPS',  v: '4' },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection title="Privacy Level">
        <div className="flex flex-wrap gap-2">
          <Pill variant="primary">L3 · Multi-Path</Pill>
          <Pill variant="guard">3 Circuits</Pill>
          <Pill variant="mix">Cover Traffic</Pill>
        </div>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          At L3 each stream is split across three independent circuits. An adversary
          controlling any single relay learns nothing about the full path.
        </p>
      </InfoSection>
    </>
  )

  const controls = (
    <>
      <button
        className="btn btn-ghost text-xs"
        onClick={() => setPlaying(p => !p)}
      >
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      <button
        className="btn btn-ghost text-xs"
        onClick={() => setBuilt(0)}
      >
        ↺ Reset
      </button>
      {HOPS.map((h, i) => (
        <button
          key={i}
          className="btn btn-ghost text-xs"
          style={{ color: i <= built ? h.color : undefined, opacity: i <= built ? 1 : 0.4 }}
          onClick={() => { setPlaying(false); setBuilt(i) }}
        >
          {h.label}
        </button>
      ))}
    </>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · Circuit Layer"
      title="Circuit Builder"
      intro="Watch how Zero Protocol constructs a 4-hop onion circuit, wrapping each packet in successive encryption layers."
      scene={<LazyCircuit built={built} />}
      cameraPosition={[0, 2, 10]}
      cameraFov={50}
      info={info}
      controls={controls}
    />
  )
}
