'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Section3DLayout from '@/components/zp/Section3DLayout'
import { InfoSection, KV, StepList, Pill, Divider } from '@/components/zp/InfoBlocks'
import { COLORS } from '@/lib/constants'

const ArchitectureScene = dynamic(
  () => import('@/components/three/ArchitectureScene'),
  { ssr: false }
)

/* ── Hop info ───────────────────────────────────────────── */
const HOP_INFO = [
  { label: 'Client',  color: COLORS.client, desc: 'Wraps all 4 Sphinx layers. Knows the full circuit but never reveals it.' },
  { label: 'Guard',   color: COLORS.guard,  desc: 'First node. Sees the origin IP but only knows the next hop (Mix 1).' },
  { label: 'Mix 1',   color: COLORS.mix,    desc: 'Middle relay. Strips one layer, forwards to Mix 2. No metadata retained.' },
  { label: 'Mix 2',   color: COLORS.mix,    desc: 'Second relay. Applies blinding factor, forwards to Exit.' },
  { label: 'Exit',    color: COLORS.exit,   desc: 'Final relay. Decrypts last layer, delivers payload to destination.' },
]

/* ── Live hop-change callback scene wrapper ─────────────── */
function LiveArchScene({
  onHopChange,
}: {
  onHopChange: (hop: number, layers: number) => void
}) {
  return (
    <>
      <ArchitectureScene onHopChange={onHopChange} />
    </>
  )
}

/* ── Route step pills ───────────────────────────────────── */
const ROUTE_STEPS = [
  { label: 'Client',  color: COLORS.client,  role: 'client' as const },
  { label: 'Guard',   color: COLORS.guard,   role: 'guard'  as const },
  { label: 'Mix 1',   color: COLORS.mix,     role: 'mix'    as const },
  { label: 'Mix 2',   color: COLORS.mix,     role: 'mix'    as const },
  { label: 'Exit',    color: COLORS.exit,    role: 'exit'   as const },
]

/* ── Page ───────────────────────────────────────────────── */
export default function ArchitecturePage() {
  const [hop, setHop] = useState(0)
  const [layers, setLayers] = useState(4)

  const handleHopChange = useCallback((h: number, l: number) => {
    setHop(h)
    setLayers(l)
  }, [])

  const hopInfo = HOP_INFO[hop] ?? HOP_INFO[0]

  const info = (
    <>
      {/* Live Hop Status */}
      <InfoSection label="Live — Active Hop" title={hopInfo.label}>
        <div
          className="mb-3 flex h-1 w-full rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: hopInfo.color }}
            animate={{ width: `${((hop + 1) / 5) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {hopInfo.desc}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ROUTE_STEPS.map((s, i) => (
            <span
              key={i}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium border"
              style={{
                borderColor: i === hop ? s.color : 'rgba(255,255,255,0.1)',
                color: i === hop ? s.color : 'var(--text-muted)',
                background: i === hop ? `${s.color}12` : 'transparent',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.3s',
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
        <div className="mt-2">
          <KV pairs={[
            { k: 'Current hop',    v: `${hop + 1} / 5` },
            { k: 'Layers remaining', v: String(layers) },
          ]} />
        </div>
      </InfoSection>

      <Divider />

      {/* How it works */}
      <InfoSection label="Protocol Overview" title="How Routing Works">
        <StepList
          steps={[
            {
              title: 'Circuit Construction',
              description: 'Client performs ECDH with each of 4 relay nodes, deriving per-hop shared secrets — no secrets sent over the wire.',
            },
            {
              title: 'Onion Wrapping',
              description: 'Sphinx packet is layered innermost-first: payload → Exit encryption → Mix₂ → Mix₁ → Guard wrapper.',
            },
            {
              title: 'Layer Stripping',
              description: 'Each relay strips exactly one layer, reads only its next-hop address, and forwards the remainder.',
            },
            {
              title: 'Delivery',
              description: 'Exit node strips the final layer and delivers plaintext to the destination. No single node knows the full path.',
            },
          ]}
        />
      </InfoSection>

      <Divider />

      {/* Sphinx packet specs */}
      <InfoSection label="Sphinx V1" title="Packet Format">
        <KV
          pairs={[
            { k: 'HEADER_LEN', v: '576 B' },
            { k: 'α (DH key)', v: '32 B — Curve25519' },
            { k: 'γ (MAC)',    v: '32 B — BLAKE2b-256' },
            { k: 'β (routing)',v: '512 B — encrypted routing' },
            { k: 'Payload',   v: '1 024 B' },
            { k: 'SPHINX_LEN',v: '1 600 B' },
            { k: 'MAX_HOPS',  v: '4' },
          ]}
        />
      </InfoSection>

      <Divider />

      {/* Properties */}
      <InfoSection title="Security Properties">
        <div className="space-y-3">
          {[
            { title: 'Forward Secrecy',    desc: 'Ephemeral keys per circuit. Past sessions can\'t be decrypted even if long-term keys are compromised.', color: COLORS.neonBlue },
            { title: 'Unlinkability',       desc: 'Guard sees origin but not destination. Exit sees destination but not origin.', color: COLORS.mix },
            { title: 'Traffic Shaping',     desc: 'Constant-rate cover traffic defeats timing analysis and traffic correlation.', color: COLORS.green },
            { title: 'Replay Protection',  desc: '65 536-entry Bloom filter at each relay. Duplicate packets silently dropped.', color: COLORS.primary },
          ].map(p => (
            <div key={p.title}>
              <div
                className="text-xs font-medium"
                style={{ color: p.color }}
              >
                {p.title}
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </InfoSection>

      <Divider />

      <InfoSection title="Privacy Levels">
        <div className="flex flex-wrap gap-2">
          <Pill variant="warn">L1 · Raw</Pill>
          <Pill variant="guard">L2 · Obfs4</Pill>
          <Pill variant="primary">L3 · Default</Pill>
          <Pill variant="mix">L4 · Max Stealth</Pill>
        </div>
      </InfoSection>
    </>
  )

  const controls = (
    <button
      className="btn btn-ghost text-xs"
      onClick={() => {
        if (typeof window !== 'undefined' && window.__archSendPacket) {
          window.__archSendPacket()
        }
      }}
    >
      ▶ Send Packet
    </button>
  )

  return (
    <Section3DLayout
      tagline="Zero Protocol · Routing Layer"
      title="Network Architecture"
      intro="An interactive view of Zero Protocol's 4-hop onion routing. Each node strips one encryption layer before forwarding."
      scene={<LiveArchScene onHopChange={handleHopChange} />}
      cameraPosition={[0, 2, 9]}
      cameraFov={50}
      info={info}
      controls={controls}
    />
  )
}

/* ── Global window type extension ───────────────────────── */
declare global {
  interface Window {
    __archSendPacket?: () => void
  }
}
