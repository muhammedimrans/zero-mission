'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, StepList, Pill, Divider } from '@/components/zp/InfoBlocks'
import { COLORS } from '@/lib/constants'
import { LAYERS } from '@/components/three/SphinxScene'

const SphinxScene = dynamic(
  () => import('@/components/three/SphinxScene'),
  { ssr: false }
)

/* ── Layer operations per hop ───────────────────────────── */
const LAYER_OPS: string[][] = [
  ['Header decryption (AES-256-GCM)', 'MAC verification (HMAC-SHA256)', 'Routing info extracted', 'Packet forwarded'],
  ['ECDH key derivation', 'KDF → Kenc + Kmac', 'Layer 2 header decrypted', 'Next-hop resolved'],
  ['ChaCha20 stream decryption', 'Integrity check passed', 'Payload wrapper removed', 'Blinding factor applied'],
  ['Inner header decrypted', 'Ephemeral key destroyed', 'Final routing computed', 'SURB processed'],
  ['Final payload exposed', 'All layers consumed', 'Application data delivered', 'Forward secrecy ensured'],
]

const MOCK_KEYS = [
  '0x3f9a2b1c…e84d7f62',
  '0xa1b2c3d4…9e8f7a6b',
  '0x5c4d3e2f…1a0b9c8d',
  '0x7e6f5d4c…3b2a1908',
  '0x9d8c7b6a…5e4f3021',
]

/* ── Sphinx live scene wrapper ──────────────────────────── */
function LiveSphinxScene({
  peeledCount,
  peeling,
  onPeelComplete,
}: {
  peeledCount: number
  peeling: boolean
  onPeelComplete: () => void
}) {
  return (
    <SphinxScene
      peeledCount={peeledCount}
      peeling={peeling}
      onPeelComplete={onPeelComplete}
    />
  )
}

/* ── Page ───────────────────────────────────────────────── */
export default function SphinxPage() {
  const [peeledCount, setPeeledCount] = useState(0)
  const [peeling, setPeeling]         = useState(false)

  const handlePeel = useCallback(() => {
    if (peeling || peeledCount >= 5) return
    setPeeling(true)
  }, [peeling, peeledCount])

  const handleReset = useCallback(() => {
    setPeeledCount(0)
    setPeeling(false)
  }, [])

  const handlePeelComplete = useCallback(() => {
    setPeeling(false)
    setPeeledCount(c => c + 1)
  }, [])

  const remaining = 5 - peeledCount
  const currentLayer = LAYERS[peeledCount]
  const ops = LAYER_OPS[peeledCount] ?? []
  const mockKey = MOCK_KEYS[peeledCount] ?? '0x000000…000000'
  const progress = (peeledCount / 5) * 100

  const info = (
    <>
      {/* Current layer status */}
      <InfoSection label="Sphinx V1 · Onion Layer" title="Layer Inspector">
        {/* Progress bar */}
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>Layers peeled</span>
            <span>{peeledCount} / 5</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: currentLayer?.color ?? COLORS.green }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {currentLayer && remaining > 0 ? (
          <>
            <div className="mb-1 text-lg font-semibold" style={{ color: currentLayer.color }}>
              {currentLayer.name}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {currentLayer.description}
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed" style={{ color: COLORS.green }}>
            All 5 Sphinx layers peeled. Inner payload exposed. Forward secrecy: all ephemeral keys destroyed.
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <button
            className="btn btn-ghost text-xs"
            onClick={handlePeel}
            disabled={peeling || remaining === 0}
          >
            ⬡ Peel Layer
          </button>
          <button className="btn btn-ghost text-xs" onClick={handleReset}>
            ↺ Reset
          </button>
        </div>
      </InfoSection>

      <Divider />

      {/* Ephemeral key */}
      {currentLayer && remaining > 0 && (
        <>
          <InfoSection label="Ephemeral Key" title="Per-hop Derived Key">
            <code
              className="block break-all rounded p-2 text-[11px]"
              style={{
                color: COLORS.purple,
                fontFamily: 'var(--font-mono)',
                background: 'rgba(129,140,248,0.08)',
                border: '1px solid rgba(129,140,248,0.2)',
              }}
            >
              {mockKey}
            </code>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Derived via HKDF-SHA256 from ECDH shared secret. Destroyed after use.
            </p>
          </InfoSection>
          <Divider />
        </>
      )}

      {/* Hop operations */}
      {remaining > 0 && (
        <>
          <InfoSection label="Cryptographic Operations" title="This Hop">
            <ul className="space-y-1.5">
              {ops.map((op, i) => (
                <motion.li
                  key={op}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.25 }}
                  className="flex items-start gap-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span style={{ color: COLORS.primary, marginTop: 2 }}>›</span>
                  {op}
                </motion.li>
              ))}
            </ul>
          </InfoSection>
          <Divider />
        </>
      )}

      {/* Sphinx V1 reference */}
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

      {/* Crypto ops key exchange */}
      <InfoSection label="Key Exchange" title="Cryptographic Primitives">
        <StepList
          steps={[
            {
              title: 'ECDH — Curve25519',
              description: 'Ephemeral key α multiplied by each node\'s long-term public key. Shared secret never transmitted.',
            },
            {
              title: 'KDF — HKDF-SHA256',
              description: 'Derives Kenc and Kmac from the ECDH shared secret. Unique keys per hop, zero reuse.',
            },
            {
              title: 'MAC — BLAKE2b-256 / Poly1305',
              description: 'γ tag verified before any decryption. Failed MAC → silent drop, no error signalling.',
            },
            {
              title: 'Stream — ChaCha20',
              description: 'β routing bytes XORed with keystream. Routing info only readable at the intended hop.',
            },
            {
              title: 'SURB — Single-Use Reply Block',
              description: 'Pre-built reply path embedded in the packet. Service can reply without learning the client\'s address.',
            },
          ]}
        />
      </InfoSection>

      <Divider />

      {/* PQ Sphinx V2 */}
      <InfoSection label="Sphinx V2 · Post-Quantum" title="ML-KEM-768 Upgrade">
        <KV
          pairs={[
            { k: 'Version',     v: '0x02' },
            { k: 'Algorithm',   v: 'ML-KEM-768 (Kyber)' },
            { k: 'Header',      v: '4 929 B' },
            { k: 'PQ ciphertexts', v: '4 × 1 088 = 4 352 B' },
            { k: 'Total',       v: '9 281 B per packet' },
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill variant="primary">NIST PQC Level 3</Pill>
          <Pill variant="mix">Hybrid ECDH + KEM</Pill>
        </div>
      </InfoSection>

      <Divider />

      {/* Forward secrecy timeline */}
      <InfoSection title="Forward Secrecy Timeline">
        {[
          { hop: 'Guard',  action: 'Derives Kenc₀, Kmac₀', destroy: 'α destroyed' },
          { hop: 'Mix 1',  action: 'Derives Kenc₁, Kmac₁', destroy: 'β destroyed' },
          { hop: 'Mix 2',  action: 'Derives Kenc₂, Kmac₂', destroy: 'γ destroyed' },
          { hop: 'Exit',   action: 'Derives Kenc₃, Kmac₃', destroy: 'δ destroyed' },
          { hop: 'Dest',   action: 'Payload delivered',     destroy: 'θ destroyed' },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-3 py-1">
            <div
              className="mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px]"
              style={{
                borderColor: 'rgba(110,255,199,0.3)',
                color: 'var(--primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {s.hop}
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-primary)' }}>{s.action}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.destroy}</div>
            </div>
          </div>
        ))}
      </InfoSection>
    </>
  )

  const controls = (
    <>
      <button
        className="btn btn-ghost text-xs"
        onClick={handlePeel}
        disabled={peeling || remaining === 0}
      >
        ⬡ Peel Layer ({remaining} left)
      </button>
      <button className="btn btn-ghost text-xs" onClick={handleReset}>
        ↺ Reset
      </button>
    </>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · Sphinx V1"
      title="Sphinx Packet Routing"
      intro="Interactively peel each onion layer to see the cryptographic operations at every hop — from guard to exit."
      scene={
        <LiveSphinxScene
          peeledCount={peeledCount}
          peeling={peeling}
          onPeelComplete={handlePeelComplete}
        />
      }
      cameraPosition={[0, 1, 7]}
      cameraFov={48}
      info={info}
      controls={controls}
    />
  )
}
