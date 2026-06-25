'use client'
import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import dynamic from 'next/dynamic'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, Pill, Divider } from '@/components/zp/InfoBlocks'

/* ── Peer roles ─────────────────────────────────────────── */
type PeerRole = 'seed' | 'guard' | 'mix' | 'exit' | 'service'

const ROLE_COLORS: Record<PeerRole, string> = {
  seed:    '#6effc7',
  guard:   '#38bdf8',
  mix:     '#818cf8',
  exit:    '#34d399',
  service: '#a78bfa',
}

const SHELL_RADII = [0.9, 1.6, 2.3, 3.0, 3.7, 4.4, 5.1]

function randomRole(): PeerRole {
  const roles: PeerRole[] = ['guard', 'guard', 'mix', 'mix', 'exit', 'service', 'seed']
  return roles[Math.floor(Math.random() * roles.length)]
}

interface Peer {
  pos: THREE.Vector3
  role: PeerRole
  shell: number
}

function usePeers(): Peer[] {
  return useMemo(() => {
    const peers: Peer[] = []
    SHELL_RADII.forEach((r, si) => {
      const count = 8 + si * 3
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi   = Math.acos(2 * Math.random() - 1)
        peers.push({
          pos: new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          ),
          role: randomRole(),
          shell: si,
        })
      }
    })
    return peers
  }, [])
}

/* ── Peer sphere ────────────────────────────────────────── */
function PeerNode({ peer, visible }: { peer: Peer; visible: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    const target = visible ? 0.9 : 0
    mat.opacity += (target - mat.opacity) * delta * 5
    mat.emissiveIntensity += ((visible ? 1.0 : 0) - mat.emissiveIntensity) * delta * 4
  })

  return (
    <mesh ref={meshRef} position={peer.pos}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshStandardMaterial
        color={ROLE_COLORS[peer.role]}
        emissive={ROLE_COLORS[peer.role]}
        emissiveIntensity={0}
        transparent
        opacity={0}
      />
    </mesh>
  )
}

/* ── Shell ring ─────────────────────────────────────────── */
function ShellRing({ radius, visible }: { radius: number; visible: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.opacity += ((visible ? 0.08 : 0) - mat.opacity) * delta * 4
    if (ref.current) ref.current.rotation.y += delta * 0.05
  })

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 6, 64]} />
      <meshStandardMaterial
        color="#6effc7"
        emissive="#6effc7"
        emissiveIntensity={0.5}
        transparent
        opacity={0}
      />
    </mesh>
  )
}

/* ── Center client node ─────────────────────────────────── */
function ClientNode() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.4
      ;(ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(clock.getElapsedTime() * 2) * 0.3
    }
  })
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial
        color="#6effc7"
        emissive="#6effc7"
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.6}
      />
    </mesh>
  )
}

/* ── Full scene ─────────────────────────────────────────── */
function DiscoveryScene({ wave }: { wave: number }) {
  const peers = usePeers()

  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 6, 6]} intensity={0.7} color="#6effc7" />
      <pointLight position={[0, -5, -5]} intensity={0.3} color="#818cf8" />

      <ClientNode />

      {SHELL_RADII.map((r, i) => (
        <ShellRing key={i} radius={r} visible={i < wave} />
      ))}

      {peers.map((p, i) => (
        <PeerNode key={i} peer={p} visible={p.shell < wave} />
      ))}

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.35} />
    </>
  )
}

const LazyDiscovery = dynamic(
  () => Promise.resolve(({ wave }: { wave: number }) => <DiscoveryScene wave={wave} />),
  { ssr: false }
)

/* ── Page ───────────────────────────────────────────────── */
export default function NodeDiscoveryPage() {
  const [wave, setWave] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setWave(w => (w >= 8 ? 0 : w + 1)), 1100)
    return () => clearInterval(id)
  }, [playing])

  const info = (
    <>
      <InfoSection label="Zero Protocol · DHT" title="Node Discovery">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Zero Protocol uses a Kademlia-inspired DHT for decentralized node discovery.
          Each lookup expands outward through XOR-distance shells, progressively
          revealing closer peers until the target bucket is found.
        </p>
      </InfoSection>

      <Divider />

      <InfoSection label="DHT Parameters" title="Kademlia Config">
        <KV
          pairs={[
            { k: 'K (bucket size)',  v: '16' },
            { k: 'α (concurrency)', v: '3' },
            { k: 'Node ID',         v: 'BLAKE2b-256' },
            { k: 'Value cap',       v: '8 192 B' },
            { k: 'Freshness',       v: '7 200 s (2 h)' },
            { k: 'Routing table',   v: '7 XOR-distance shells' },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection title="Peer Roles">
        {(Object.entries(ROLE_COLORS) as [PeerRole, string][]).map(([role, color]) => (
          <div key={role} className="flex items-center gap-2 py-0.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-xs capitalize" style={{ color: 'var(--text-primary)' }}>
              {role}
            </span>
          </div>
        ))}
      </InfoSection>

      <Divider />

      <InfoSection title="Discovery Wave">
        <div className="flex flex-wrap gap-2">
          <Pill variant="primary">Wave {wave} / 8</Pill>
          <Pill variant="guard">{SHELL_RADII.length} shells</Pill>
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Each shell represents peers at increasing XOR distance. The lookup converges
          in O(log n) hops with K=16 bucket granularity.
        </p>
      </InfoSection>
    </>
  )

  const controls = (
    <>
      <button className="btn btn-ghost text-xs" onClick={() => setPlaying(p => !p)}>
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      <button className="btn btn-ghost text-xs" onClick={() => setWave(0)}>
        ↺ Reset
      </button>
    </>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · DHT Discovery"
      title="Node Discovery"
      intro="Watch a Kademlia lookup expand outward through XOR-distance shells, revealing guard, mix, and exit nodes."
      scene={<LazyDiscovery wave={wave} />}
      cameraPosition={[0, 3, 12]}
      cameraFov={50}
      info={info}
      controls={controls}
    />
  )
}
