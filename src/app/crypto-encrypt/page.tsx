'use client'
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import dynamic from 'next/dynamic'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, StepList, Pill, Divider } from '@/components/zp/InfoBlocks'

/* ── Pipeline stages ────────────────────────────────────── */
const STAGES = [
  { id: 0, label: 'Key Gen',      color: '#6effc7', desc: 'Ed25519 + X25519 key pair generated from secure entropy.' },
  { id: 1, label: 'Key Exchange', color: '#38bdf8', desc: 'Ephemeral ECDH via Curve25519. Shared secret derived without transmission.' },
  { id: 2, label: 'KDF',          color: '#818cf8', desc: 'HKDF-SHA256 stretches the shared secret into Kenc + Kmac.' },
  { id: 3, label: 'Encryption',   color: '#34d399', desc: 'ChaCha20-Poly1305 encrypts payload. MAC authenticates ciphertext.' },
  { id: 4, label: 'PQ Encaps',    color: '#a78bfa', desc: 'ML-KEM-768 encapsulates a second secret. Hybrid ECDH + KEM for quantum safety.' },
  { id: 5, label: 'Forward Sec',  color: '#f59e0b', desc: 'Ephemeral keys destroyed. Past sessions can\'t be decrypted.' },
]

const STAGE_X = [-5, -3, -1, 1, 3, 5]

/* ── Key sphere (spinning octahedron) ──────────────────── */
function KeySphere({ stageIndex, active }: { stageIndex: number; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const color = STAGES[stageIndex].color

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * (active ? 1.2 : 0.25)
    ref.current.rotation.x += delta * (active ? 0.6 : 0.12)
    const mat = ref.current.material as THREE.MeshStandardMaterial
    const targetEmissive = active ? 1.2 : 0.08
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * delta * 5
    mat.opacity += ((active ? 0.95 : 0.3) - mat.opacity) * delta * 5
  })

  return (
    <group position={[STAGE_X[stageIndex], 0, 0]}>
      {/* Outer wireframe shell */}
      <mesh>
        <sphereGeometry args={[0.5, 10, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.4 : 0.05}
          transparent
          opacity={active ? 0.12 : 0.04}
          wireframe
        />
      </mesh>
      {/* Core */}
      <mesh ref={ref}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.08}
          transparent
          opacity={0.3}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
    </group>
  )
}

/* ── Pipeline tube connecting stages ───────────────────── */
function PipelineLink({ fromIdx, toIdx, active }: { fromIdx: number; toIdx: number; active: boolean }) {
  const mid = (STAGE_X[fromIdx] + STAGE_X[toIdx]) / 2
  const len = Math.abs(STAGE_X[toIdx] - STAGE_X[fromIdx])
  return (
    <mesh position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.025, 0.025, len * 0.85, 6]} />
      <meshStandardMaterial
        color={active ? '#6effc7' : '#1e293b'}
        emissive={active ? '#6effc7' : '#000'}
        emissiveIntensity={active ? 0.7 : 0}
        transparent
        opacity={active ? 0.6 : 0.15}
      />
    </mesh>
  )
}

/* ── Flowing data particles ─────────────────────────────── */
function DataFlow({ activeStage }: { activeStage: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const phase = ((t * 0.6 + i * 0.12) % 1)
      const xFrom = STAGE_X[0]
      const xTo   = STAGE_X[Math.min(activeStage, STAGES.length - 1)]
      child.position.x = xFrom + (xTo - xFrom) * phase
      child.position.y = Math.sin(t * 3 + i * 0.8) * 0.12
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
      mat.opacity = 0.4 + Math.sin(t * 4 + i) * 0.2
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} position={[STAGE_X[0], 0, 0]}>
          <sphereGeometry args={[0.045, 5, 5]} />
          <meshStandardMaterial
            color={STAGES[Math.min(activeStage, STAGES.length - 1)].color}
            emissive={STAGES[Math.min(activeStage, STAGES.length - 1)].color}
            emissiveIntensity={1.5}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── Encryption orbit rings ─────────────────────────────── */
function EncryptionOrbit({ active }: { active: boolean }) {
  const ref1 = useRef<THREE.Mesh>(null)
  const ref2 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref1.current) {
      ref1.current.rotation.z = t * 0.5
      const mat = ref1.current.material as THREE.MeshStandardMaterial
      mat.opacity += ((active ? 0.3 : 0.05) - mat.opacity) * 0.05
    }
    if (ref2.current) {
      ref2.current.rotation.x = t * -0.4
      const mat = ref2.current.material as THREE.MeshStandardMaterial
      mat.opacity += ((active ? 0.2 : 0.03) - mat.opacity) * 0.05
    }
  })

  return (
    <group position={[STAGE_X[3], 0, 0]}>
      <mesh ref={ref1} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[0.7, 0.018, 6, 48]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.5} transparent opacity={0.05} />
      </mesh>
      <mesh ref={ref2} rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[0.9, 0.012, 6, 48]} />
        <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.4} transparent opacity={0.03} />
      </mesh>
    </group>
  )
}

/* ── Full scene ─────────────────────────────────────────── */
function CryptoScene({ activeStage }: { activeStage: number }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 4, 5]} intensity={0.8} color="#6effc7" />
      <pointLight position={[0, -3, -4]} intensity={0.4} color="#818cf8" />

      {STAGES.map((_, i) => (
        <KeySphere key={i} stageIndex={i} active={i <= activeStage} />
      ))}

      {Array.from({ length: STAGES.length - 1 }).map((_, i) => (
        <PipelineLink key={i} fromIdx={i} toIdx={i + 1} active={i < activeStage} />
      ))}

      <EncryptionOrbit active={activeStage >= 3} />
      {activeStage >= 1 && <DataFlow activeStage={activeStage} />}

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

const LazyCrypto = dynamic(
  () => Promise.resolve(({ activeStage }: { activeStage: number }) => <CryptoScene activeStage={activeStage} />),
  { ssr: false }
)

/* ── Page ───────────────────────────────────────────────── */
export default function CryptoEncryptPage() {
  const [activeStage, setActiveStage] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(
      () => setActiveStage(s => (s + 1) % STAGES.length),
      2200
    )
    return () => clearInterval(id)
  }, [playing])

  const stage = STAGES[activeStage]

  const info = (
    <>
      <InfoSection label="Zero Protocol · Crypto Pipeline" title="Encryption Flow">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Zero Protocol uses a multi-step cryptographic pipeline combining classical
          elliptic-curve primitives with post-quantum key encapsulation for
          forward-secret, quantum-resistant encrypted tunnels.
        </p>
      </InfoSection>

      <Divider />

      <InfoSection label={`Stage ${activeStage + 1} / ${STAGES.length}`} title={stage.label}>
        <div
          className="h-1 w-full overflow-hidden rounded-full mb-3"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((activeStage + 1) / STAGES.length) * 100}%`,
              background: stage.color,
            }}
          />
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {stage.desc}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STAGES.map((s, i) => (
            <button
              key={i}
              className="rounded-full border px-2 py-0.5 text-[10px] transition-all"
              style={{
                borderColor: i === activeStage ? s.color : 'rgba(255,255,255,0.1)',
                color: i === activeStage ? s.color : 'var(--text-muted)',
                background: i === activeStage ? `${s.color}12` : 'transparent',
                fontFamily: 'var(--font-mono)',
              }}
              onClick={() => { setPlaying(false); setActiveStage(i) }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </InfoSection>

      <Divider />

      <InfoSection label="Classical Primitives" title="Elliptic-Curve Suite">
        <KV
          pairs={[
            { k: 'Key agreement', v: 'X25519 (Curve25519 ECDH)' },
            { k: 'Signing',       v: 'Ed25519' },
            { k: 'KDF',           v: 'HKDF-SHA256' },
            { k: 'AEAD',          v: 'ChaCha20-Poly1305' },
            { k: 'MAC',           v: 'BLAKE2b-256' },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection label="Post-Quantum" title="ML-KEM-768 (Kyber)">
        <KV
          pairs={[
            { k: 'Algorithm',     v: 'ML-KEM-768 (FIPS 203)' },
            { k: 'Security',      v: 'NIST PQC Level 3' },
            { k: 'Ciphertext',    v: '1 088 B per hop' },
            { k: 'Shared secret', v: '32 B' },
            { k: 'Hybrid mode',   v: 'ECDH ⊕ KEM (both must break)' },
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill variant="mix">Quantum-safe</Pill>
          <Pill variant="primary">Hybrid</Pill>
        </div>
      </InfoSection>

      <Divider />

      <InfoSection title="Pipeline Stages">
        <StepList
          steps={[
            {
              title: 'Key Generation',
              description: 'Ed25519 + X25519 pairs created from OS entropy (/dev/urandom).',
            },
            {
              title: 'Key Exchange',
              description: 'Ephemeral X25519 ECDH at each hop. Shared secret never leaves the session.',
            },
            {
              title: 'KDF Expansion',
              description: 'HKDF-SHA256 with per-hop salt produces Kenc (encryption) and Kmac (authentication).',
            },
            {
              title: 'AEAD Encryption',
              description: 'ChaCha20-Poly1305 encrypts and authenticates in one pass. Nonce derived from circuit ID.',
            },
            {
              title: 'PQ Encapsulation',
              description: 'ML-KEM-768 encapsulates a second 32-byte secret. Final key = HKDF(ECDH secret || KEM secret).',
            },
            {
              title: 'Forward Secrecy',
              description: 'All ephemeral keys zeroized on circuit teardown. Session cannot be decrypted retroactively.',
            },
          ]}
        />
      </InfoSection>

      <Divider />

      <InfoSection title="Privacy Level Crypto">
        <div className="space-y-2">
          {[
            { level: 'L1', desc: 'Raw — no encryption layer', color: '#94a3b8' },
            { level: 'L2', desc: 'Obfs4-Lite XOR obfuscation', color: '#38bdf8' },
            { level: 'L3', desc: 'Sphinx + TLS 1.3 morph (default)', color: '#6effc7' },
            { level: 'L4', desc: 'Sphinx + max jitter + cover traffic', color: '#818cf8' },
          ].map(l => (
            <div key={l.level} className="flex items-center gap-2">
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: `${l.color}18`, color: l.color, fontFamily: 'var(--font-mono)' }}
              >
                {l.level}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.desc}</span>
            </div>
          ))}
        </div>
      </InfoSection>
    </>
  )

  const controls = (
    <>
      <button className="btn btn-ghost text-xs" onClick={() => setPlaying(p => !p)}>
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      {STAGES.map((s, i) => (
        <button
          key={i}
          className="btn btn-ghost text-xs"
          style={{ color: i === activeStage ? s.color : undefined, opacity: i === activeStage ? 1 : 0.45 }}
          onClick={() => { setPlaying(false); setActiveStage(i) }}
        >
          {s.label}
        </button>
      ))}
    </>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · Cryptography"
      title="Encryption Pipeline"
      intro="Step through Zero Protocol's cryptographic pipeline — key generation, ECDH exchange, HKDF derivation, AEAD encryption, and post-quantum encapsulation."
      scene={<LazyCrypto activeStage={activeStage} />}
      cameraPosition={[0, 2, 11]}
      cameraFov={52}
      info={info}
      controls={controls}
    />
  )
}
