'use client'
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import dynamic from 'next/dynamic'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, Pill, Divider } from '@/components/zp/InfoBlocks'

/* ── Packet layers ──────────────────────────────────────── */
const LAYERS = [
  { name: 'α – DH Key',   bytes: 32,   color: '#6effc7', yOff: 0 },
  { name: 'γ – MAC',      bytes: 32,   color: '#afc6ff', yOff: 32 },
  { name: 'β – Routing',  bytes: 512,  color: '#38bdf8', yOff: 64 },
  { name: 'Payload',      bytes: 1024, color: '#818cf8', yOff: 576 },
]
const TOTAL = 1600

/* ── One packet layer slab ──────────────────────────────── */
function LayerSlab({
  layer,
  index,
  exploded,
}: {
  layer: typeof LAYERS[0]
  index: number
  exploded: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const height = (layer.bytes / TOTAL) * 4
  const baseY = (layer.yOff / TOTAL) * 4 - 2
  const explodedY = (index - 1.5) * 1.6

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const targetY = exploded ? explodedY : baseY
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * delta * 4
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    const targetEmissive = exploded ? 0.7 : 0.25
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * delta * 4
  })

  return (
    <mesh ref={meshRef} position={[0, baseY, 0]}>
      <boxGeometry args={[1.8, height * 0.95, 0.35]} />
      <meshStandardMaterial
        color={layer.color}
        emissive={layer.color}
        emissiveIntensity={0.25}
        roughness={0.3}
        metalness={0.5}
        transparent
        opacity={0.85}
      />
    </mesh>
  )
}

/* ── Outer wireframe shell ──────────────────────────────── */
function PacketShell({ exploded }: { exploded: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.15
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.opacity += ((exploded ? 0 : 0.15) - mat.opacity) * delta * 5
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[2.1, 4.2, 0.55]} />
      <meshStandardMaterial
        color="#6effc7"
        emissive="#6effc7"
        emissiveIntensity={0.2}
        transparent
        opacity={0.15}
        wireframe
      />
    </mesh>
  )
}

/* ── Scene ──────────────────────────────────────────────── */
function PacketScene({ exploded }: { exploded: boolean }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[3, 4, 5]} intensity={0.9} color="#afc6ff" />
      <pointLight position={[-3, -3, -3]} intensity={0.4} color="#6effc7" />

      <PacketShell exploded={exploded} />
      {LAYERS.map((l, i) => (
        <LayerSlab key={i} layer={l} index={i} exploded={exploded} />
      ))}

      <OrbitControls enablePan={false} enableZoom={false} autoRotate={!exploded} autoRotateSpeed={0.5} />
    </>
  )
}

const LazyPacket = dynamic(
  () => Promise.resolve(({ exploded }: { exploded: boolean }) => <PacketScene exploded={exploded} />),
  { ssr: false }
)

/* ── Page ───────────────────────────────────────────────── */
export default function PacketExplorerPage() {
  const [exploded, setExploded] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setExploded(e => !e), 4200)
    return () => clearInterval(id)
  }, [])

  const info = (
    <>
      <InfoSection label="Zero Protocol · Sphinx V1" title="Packet Anatomy">
        <KV
          pairs={[
            { k: 'Total',       v: '1 600 B' },
            { k: 'α  DH pub',   v: '32 B  — Curve25519 ephemeral' },
            { k: 'γ  MAC',      v: '32 B  — BLAKE2b-256 tag' },
            { k: 'β  Routing',  v: '512 B — encrypted routing block' },
            { k: 'Payload',     v: '1 024 B — application data' },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection label="Sphinx V2 · Post-Quantum" title="PQ Header">
        <KV
          pairs={[
            { k: 'Version',     v: '0x02' },
            { k: 'Algorithm',   v: 'ML-KEM-768' },
            { k: 'Header',      v: '4 929 B' },
            { k: 'PQ ciphertexts', v: '4 × 1 088 = 4 352 B' },
            { k: 'Total PQ',    v: '9 281 B per packet' },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection title="Replay Protection">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Each node maintains a 65 536-entry Bloom window. At L3 throughput (~1 000 pkt/s)
          the window covers ~44 minutes of unique packet IDs, preventing replay attacks
          across sessions.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill variant="guard">Window: 65 536</Pill>
          <Pill variant="mix">≈ 44 min at L3</Pill>
        </div>
      </InfoSection>

      <Divider />

      <InfoSection title="Layer Colors">
        <div className="space-y-1.5">
          {LAYERS.map(l => (
            <div key={l.name} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ background: l.color }}
              />
              <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                {l.name}
              </span>
              <span
                className="ml-auto text-xs"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {l.bytes} B
              </span>
            </div>
          ))}
        </div>
      </InfoSection>
    </>
  )

  const controls = (
    <button
      className="btn btn-ghost text-xs"
      onClick={() => setExploded(e => !e)}
    >
      {exploded ? '▣ Collapse' : '⊞ Explode Layers'}
    </button>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · Sphinx V1 / V2"
      title="Packet Explorer"
      intro="Inspect the 1 600-byte Sphinx V1 packet structure, and compare with the post-quantum V2 format using ML-KEM-768."
      scene={<LazyPacket exploded={exploded} />}
      cameraPosition={[0, 0, 7]}
      cameraFov={45}
      info={info}
      controls={controls}
    />
  )
}
