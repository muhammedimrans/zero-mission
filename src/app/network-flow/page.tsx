'use client'
import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import dynamic from 'next/dynamic'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, Pill, Divider } from '@/components/zp/InfoBlocks'

/* ── Level config ───────────────────────────────────────── */
type Level = 'L1' | 'L2' | 'L3' | 'L4'

const LEVEL_CONFIG = {
  L1: { hops: 1, circuits: 1, cover: false, jitter: 0,   label: 'Raw',           color: '#94a3b8' },
  L2: { hops: 3, circuits: 1, cover: false, jitter: 0,   label: 'Obfs4-Lite XOR', color: '#38bdf8' },
  L3: { hops: 4, circuits: 3, cover: true,  jitter: 50,  label: 'TLS 1.3 morph', color: '#6effc7' },
  L4: { hops: 4, circuits: 3, cover: true,  jitter: 400, label: 'Max Stealth',   color: '#818cf8' },
} as const

/* ── Particle positions ─────────────────────────────────── */
interface Particle {
  progress: number
  speed: number
  cover: boolean
  circuit: number
}

function useParticles(level: Level) {
  const cfg = LEVEL_CONFIG[level]
  return useMemo<Particle[]>(() => {
    const arr: Particle[] = []
    for (let c = 0; c < cfg.circuits; c++) {
      for (let i = 0; i < 18; i++) {
        arr.push({ progress: Math.random(), speed: 0.25 + Math.random() * 0.15, cover: false, circuit: c })
      }
    }
    if (cfg.cover) {
      for (let i = 0; i < 12; i++) {
        arr.push({ progress: Math.random(), speed: 0.18 + Math.random() * 0.1, cover: true, circuit: 0 })
      }
    }
    return arr
  }, [level, cfg.circuits, cfg.cover])
}

/* ── Node positions (hop columns) ──────────────────────── */
const NODE_X = [-5, -2.5, 0, 2.5, 5]

function FlowParticles({ particles, level }: { particles: Particle[]; level: Level }) {
  const cfg = LEVEL_CONFIG[level]
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const progRef  = useRef(particles.map(p => p.progress))

  useFrame((_, delta) => {
    progRef.current.forEach((prog, i) => {
      progRef.current[i] = (prog + particles[i].speed * delta) % 1
      const mesh = meshRefs.current[i]
      if (!mesh) return
      const hops = cfg.hops
      const xFrom = NODE_X[0]
      const xTo   = NODE_X[hops]
      const t = progRef.current[i]
      const yOffset = (particles[i].circuit - (cfg.circuits - 1) / 2) * 0.35
      mesh.position.set(
        xFrom + (xTo - xFrom) * t,
        yOffset + Math.sin(t * Math.PI * 6 + i) * 0.06,
        (particles[i].circuit - 1) * 0.18
      )
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.opacity = particles[i].cover
        ? 0.25 + Math.sin(t * 8 + i) * 0.1
        : 0.6 + Math.sin(t * 5 + i) * 0.25
    })
  })

  return (
    <>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el }}
          position={[NODE_X[0], 0, 0]}
        >
          <sphereGeometry args={[p.cover ? 0.05 : 0.07, 5, 5]} />
          <meshStandardMaterial
            color={p.cover ? '#f59e0b' : cfg.color}
            emissive={p.cover ? '#f59e0b' : cfg.color}
            emissiveIntensity={p.cover ? 0.8 : 1.4}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </>
  )
}

function HopNodes({ level }: { level: Level }) {
  const cfg = LEVEL_CONFIG[level]
  const hops = cfg.hops
  return (
    <>
      {Array.from({ length: hops + 1 }).map((_, i) => (
        <mesh key={i} position={[NODE_X[i], 0, 0]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial
            color={cfg.color}
            emissive={cfg.color}
            emissiveIntensity={0.7}
            roughness={0.25}
            metalness={0.5}
          />
        </mesh>
      ))}
      {Array.from({ length: hops }).map((_, i) => {
        const mid = (NODE_X[i] + NODE_X[i + 1]) / 2
        const len = Math.abs(NODE_X[i + 1] - NODE_X[i])
        return (
          <mesh key={i} position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, len, 6]} />
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.color}
              emissiveIntensity={0.4}
              transparent
              opacity={0.35}
            />
          </mesh>
        )
      })}
    </>
  )
}

function NetworkScene({ level }: { level: Level }) {
  const particles = useParticles(level)
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 5, 6]} intensity={0.8} color="#6effc7" />
      <pointLight position={[0, -4, -4]} intensity={0.3} color="#38bdf8" />
      <HopNodes level={level} />
      <FlowParticles particles={particles} level={level} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.25} />
    </>
  )
}

const LazyNetwork = dynamic(
  () => Promise.resolve(({ level }: { level: Level }) => <NetworkScene level={level} />),
  { ssr: false }
)

/* ── Level Button ───────────────────────────────────────── */
function LevelBtn({
  lvl,
  active,
  onClick,
}: {
  lvl: Level
  active: boolean
  onClick: () => void
}) {
  const cfg = LEVEL_CONFIG[lvl]
  return (
    <button
      className="btn btn-ghost text-xs"
      style={{
        color: active ? cfg.color : undefined,
        borderColor: active ? cfg.color : undefined,
        opacity: active ? 1 : 0.5,
      }}
      onClick={onClick}
    >
      {lvl}
    </button>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export default function NetworkFlowPage() {
  const [level, setLevel] = useState<Level>('L3')
  const cfg = LEVEL_CONFIG[level]

  const info = (
    <>
      <InfoSection label="Zero Protocol · Privacy Levels" title="Network Flow">
        <div className="flex flex-wrap gap-2">
          {(['L1', 'L2', 'L3', 'L4'] as Level[]).map(l => (
            <button
              key={l}
              className="btn btn-ghost text-xs"
              style={{
                color: level === l ? LEVEL_CONFIG[l].color : undefined,
                opacity: level === l ? 1 : 0.5,
              }}
              onClick={() => setLevel(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </InfoSection>

      <Divider />

      <InfoSection label={`Level ${level} — ${cfg.label}`} title="Current Configuration">
        <KV
          pairs={[
            { k: 'Hops',         v: String(cfg.hops) },
            { k: 'Circuits',     v: String(cfg.circuits) },
            { k: 'Cover traffic',v: cfg.cover ? 'Enabled (Poisson)' : 'Disabled' },
            { k: 'Max jitter',   v: cfg.jitter ? `${cfg.jitter} ms` : 'None' },
            { k: 'Obfuscation',  v: cfg.label },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection title="All Levels">
        {(['L1', 'L2', 'L3', 'L4'] as Level[]).map(l => {
          const c = LEVEL_CONFIG[l]
          return (
            <div key={l} className="flex items-start gap-3 py-1.5">
              <Pill variant={l === 'L3' ? 'primary' : l === 'L1' ? 'warn' : l === 'L2' ? 'guard' : 'mix'}>
                {l}
              </Pill>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {c.label}{l === 'L3' ? ' (Default)' : ''}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {c.hops} hop{c.hops > 1 ? 's' : ''} · {c.circuits} circuit{c.circuits > 1 ? 's' : ''}
                  {c.cover ? ' · cover traffic' : ''}
                </div>
              </div>
            </div>
          )
        })}
      </InfoSection>

      <Divider />

      <InfoSection title="Legend">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: '#6effc7' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Real traffic</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: '#f59e0b' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cover traffic (L3/L4 only)</span>
        </div>
      </InfoSection>
    </>
  )

  const controls = (
    <>
      {(['L1', 'L2', 'L3', 'L4'] as Level[]).map(l => (
        <LevelBtn key={l} lvl={l} active={level === l} onClick={() => setLevel(l)} />
      ))}
    </>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · Privacy Layer"
      title="Network Flow"
      intro="Visualize real-time packet routing across Zero Protocol privacy levels. Green = real traffic, orange = cover traffic."
      scene={<LazyNetwork level={level} />}
      cameraPosition={[0, 2, 10]}
      cameraFov={52}
      info={info}
      controls={controls}
    />
  )
}
