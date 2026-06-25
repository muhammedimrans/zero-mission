'use client'
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import dynamic from 'next/dynamic'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, Pill, Divider } from '@/components/zp/InfoBlocks'

/* ── Services ───────────────────────────────────────────── */
interface Service {
  id: number
  label: string
  pos: [number, number, number]
  color: string
  depends: number[]
  detail: string
}

const SERVICES: Service[] = [
  { id: 0,  label: 'IPC',           pos: [0,    0,    0   ], color: '#6effc7', depends: [],       detail: 'Unix domain socket, auth challenge handshake' },
  { id: 1,  label: 'Config',        pos: [-2.4, 1.4, -0.5 ], color: '#38bdf8', depends: [0],      detail: 'TOML config loader, validates schema v2' },
  { id: 2,  label: 'Key Vault',     pos: [2.4,  1.4, -0.5 ], color: '#818cf8', depends: [0, 1],   detail: 'Ed25519 + X25519 keys, HKDF derivation' },
  { id: 3,  label: 'DHT',           pos: [-2.4,-1.4,  0.5 ], color: '#38bdf8', depends: [1, 2],   detail: 'Kademlia routing table, K=16 buckets' },
  { id: 4,  label: 'Directory',     pos: [2.4, -1.4,  0.5 ], color: '#34d399', depends: [2, 3],   detail: 'Signed node descriptors, 2 h freshness' },
  { id: 5,  label: 'Sphinx',        pos: [0,    2.2,  0.8 ], color: '#6effc7', depends: [2],      detail: 'HEADER_LEN=576, onion layer processing' },
  { id: 6,  label: 'UDP/TLS',       pos: [-2.8, 0,    0.8 ], color: '#38bdf8', depends: [1, 5],   detail: 'Multiplexed QUIC + TLS 1.3, port 7000' },
  { id: 7,  label: 'Circuit Pool',  pos: [2.8,  0,    0.8 ], color: '#818cf8', depends: [3, 5, 6],detail: '3 pre-built circuits per L3 session' },
  { id: 8,  label: 'TUN/SOCKS5',   pos: [0,   -2.2,  0.8 ], color: '#34d399', depends: [7],      detail: 'tun0 + SOCKS5 proxy, transparent routing' },
  { id: 9,  label: 'Kill Switch',   pos: [-1.8, 0.6, -1.5 ], color: '#f59e0b', depends: [6, 8],   detail: 'iptables fallback, drops clearnet on failure' },
  { id: 10, label: 'Cover Traffic', pos: [1.8,  0.6, -1.5 ], color: '#a78bfa', depends: [7],      detail: 'Poisson-distributed dummy cells, 40 ms avg' },
]

/* ── Wireframe hull ─────────────────────────────────────── */
function HullBox() {
  return (
    <mesh>
      <boxGeometry args={[7.5, 5.5, 4.5]} />
      <meshStandardMaterial
        color="#6effc7"
        emissive="#6effc7"
        emissiveIntensity={0.15}
        transparent
        opacity={0.04}
        wireframe
      />
    </mesh>
  )
}

/* ── Service node ───────────────────────────────────────── */
function ServiceNode({
  service,
  active,
}: {
  service: Service
  active: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.opacity += ((active ? 0.9 : 0.2) - mat.opacity) * delta * 5
    mat.emissiveIntensity += ((active ? 1.2 : 0.05) - mat.emissiveIntensity) * delta * 5
    if (active) {
      meshRef.current.rotation.y += delta * 0.6
    }
  })

  return (
    <mesh ref={meshRef} position={service.pos}>
      <octahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial
        color={service.color}
        emissive={service.color}
        emissiveIntensity={0.05}
        transparent
        opacity={0.2}
        roughness={0.3}
        metalness={0.6}
      />
    </mesh>
  )
}

/* ── Dependency lines ───────────────────────────────────── */
function DepLines({ step }: { step: number }) {
  const lineRefs = useRef<THREE.Line[]>([])

  const lines = SERVICES.flatMap(svc =>
    svc.depends.map(dep => ({
      from: SERVICES[dep].pos,
      to:   svc.pos,
      active: step > svc.id && step > dep,
    }))
  )

  useEffect(() => {
    lineRefs.current = []
  }, [])

  return (
    <>
      {lines.map((line, i) => {
        const points = [
          new THREE.Vector3(...line.from),
          new THREE.Vector3(...line.to),
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <primitive
            key={i}
            object={
              new THREE.Line(
                geo,
                new THREE.LineBasicMaterial({
                  color: line.active ? '#6effc7' : '#1e293b',
                  transparent: true,
                  opacity: line.active ? 0.4 : 0.12,
                })
              )
            }
          />
        )
      })}
    </>
  )
}

/* ── Full scene ─────────────────────────────────────────── */
function DaemonScene({ step }: { step: number }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 5, 5]} intensity={0.7} color="#6effc7" />
      <pointLight position={[0, -4, -4]} intensity={0.3} color="#818cf8" />

      <HullBox />
      <DepLines step={step} />

      {SERVICES.map(svc => (
        <ServiceNode key={svc.id} service={svc} active={step > svc.id} />
      ))}

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

const LazyDaemon = dynamic(
  () => Promise.resolve(({ step }: { step: number }) => <DaemonScene step={step} />),
  { ssr: false }
)

/* ── Page ───────────────────────────────────────────────── */
export default function DaemonStartupPage() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    if (step >= SERVICES.length) {
      const pause = setTimeout(() => setStep(0), 2500)
      return () => clearTimeout(pause)
    }
    const id = setTimeout(() => setStep(s => s + 1), 900)
    return () => clearTimeout(id)
  }, [playing, step])

  const currentService = SERVICES[step - 1]

  const info = (
    <>
      <InfoSection label="Zero Protocol · Runtime" title="Daemon Startup">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          The Zero daemon boots 11 subsystems in dependency order. Each service waits
          until its dependencies are healthy before initializing.
        </p>
      </InfoSection>

      <Divider />

      <InfoSection label={`Step ${step} / ${SERVICES.length}`} title="Boot Progress">
        <div className="space-y-1">
          {SERVICES.map(svc => (
            <div
              key={svc.id}
              className="flex items-center gap-2 rounded px-2 py-1 text-xs"
              style={{
                background: step > svc.id ? 'rgba(110,255,199,0.06)' : 'transparent',
                color: step > svc.id ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'background 0.3s',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: step > svc.id ? svc.color : '#1e293b' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                {svc.label}
              </span>
              {step > svc.id && (
                <span className="ml-auto text-[9px]" style={{ color: svc.color }}>
                  ● OK
                </span>
              )}
            </div>
          ))}
        </div>
      </InfoSection>

      {currentService && (
        <>
          <Divider />
          <InfoSection label="Active Service" title={currentService.label}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {currentService.detail}
            </p>
            {currentService.depends.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Depends on:</span>
                {currentService.depends.map(d => (
                  <Pill key={d} variant="primary">{SERVICES[d].label}</Pill>
                ))}
              </div>
            )}
          </InfoSection>
        </>
      )}

      <Divider />

      <InfoSection title="Subsystems">
        <KV
          pairs={[
            { k: 'Total services', v: String(SERVICES.length) },
            { k: 'Boot time',      v: '~2.5 s (cold)' },
            { k: 'IPC socket',     v: '/run/zero/daemon.sock' },
            { k: 'Config path',    v: '/etc/zero/config.toml' },
          ]}
        />
      </InfoSection>
    </>
  )

  const controls = (
    <>
      <button className="btn btn-ghost text-xs" onClick={() => setPlaying(p => !p)}>
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      <button className="btn btn-ghost text-xs" onClick={() => { setStep(0) }}>
        ↺ Restart
      </button>
      <Pill variant={step >= SERVICES.length ? 'primary' : 'warn'}>
        {step >= SERVICES.length ? 'Online' : `Booting ${step}/${SERVICES.length}`}
      </Pill>
    </>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · Daemon"
      title="Daemon Startup"
      intro="Watch the Zero daemon initialize 11 subsystems in dependency order, from IPC socket to cover traffic."
      scene={<LazyDaemon step={step} />}
      cameraPosition={[0, 2, 12]}
      cameraFov={52}
      info={info}
      controls={controls}
    />
  )
}
