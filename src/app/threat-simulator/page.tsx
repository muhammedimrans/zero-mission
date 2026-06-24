'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '@/components/ui/GlassPanel'
import { COLORS } from '@/lib/constants'
import type { AttackType } from '@/components/three/ThreatScene'

const ThreatScene = dynamic(
  () => import('@/components/three/ThreatScene'),
  { ssr: false }
)

// ── Attack definitions ────────────────────────────────────────────────────────

type Verdict = 'BLOCKED' | 'MITIGATED' | 'CONTAINED' | 'PARTIAL' | 'DIFFICULT'

interface AttackDef {
  id: AttackType
  name: string
  shortName: string
  color: string
  verdictColor: string
  verdict: Verdict
  verdictSymbol: string
  what_sees: string
  description: string
  mitigation: string
  technicalDetail: string[]
}

const ATTACKS: AttackDef[] = [
  {
    id: 'isp',
    name: 'ISP Monitoring',
    shortName: 'ISP',
    color: COLORS.red,
    verdictColor: COLORS.green,
    verdict: 'BLOCKED',
    verdictSymbol: '✓',
    what_sees: 'Encrypted traffic to Guard node only. Destination unknown.',
    description:
      'Your Internet Service Provider sits between you and the network. They can observe every packet you send — including destination IPs, timing, and volume.',
    mitigation:
      'All traffic is Sphinx-encrypted before leaving the client. The ISP sees only encrypted data to a single Guard node. Destination, payload, and routing are completely hidden.',
    technicalDetail: [
      'Client connects only to Guard node',
      'Sphinx encryption applied before TCP',
      'Guard IP may be obfuscated with bridges',
      'No cleartext metadata exposed',
    ],
  },
  {
    id: 'traffic',
    name: 'Traffic Analysis',
    shortName: 'Traffic',
    color: '#ff8c00',
    verdictColor: COLORS.green,
    verdict: 'MITIGATED',
    verdictSymbol: '✓',
    what_sees: 'Correlated timing patterns across multiple observation points.',
    description:
      'A sophisticated adversary deploys multiple passive observers across the internet. By correlating packet timing and volume, they attempt to link sender to receiver.',
    mitigation:
      'Mix nodes add cover traffic, reorder packets, and introduce random delays. This breaks timing correlation across observers. High-latency mode further defeats global passive adversaries.',
    technicalDetail: [
      'Mix nodes pool and reorder packets',
      'Cover traffic maintains constant bandwidth',
      'Random delays at each hop',
      'Loop messages break timing fingerprints',
    ],
  },
  {
    id: 'relay',
    name: 'Malicious Relay',
    shortName: 'Relay',
    color: '#ff6b35',
    verdictColor: COLORS.green,
    verdict: 'CONTAINED',
    verdictSymbol: '✓',
    what_sees: 'Previous hop IP and next hop IP only. Cannot see origin or destination.',
    description:
      'An attacker operates a malicious mix node inside the network. They can fully inspect all packets that pass through their node.',
    mitigation:
      'Sphinx limits each node to seeing only its immediate predecessor and successor. The entire path is hidden. A single compromised node cannot deanonymize either endpoint.',
    technicalDetail: [
      'Each hop decrypts exactly one layer',
      'No node knows full circuit path',
      'Payload encrypted end-to-end above Sphinx',
      'Ephemeral keys prevent retrospective analysis',
    ],
  },
  {
    id: 'exit',
    name: 'Exit Surveillance',
    shortName: 'Exit',
    color: '#ffd700',
    verdictColor: '#ffd700',
    verdict: 'PARTIAL',
    verdictSymbol: '⚠',
    what_sees: 'Payload content (if unencrypted above Sphinx layer). Origin is hidden.',
    description:
      'The exit node sees the final plaintext payload — if no end-to-end encryption is applied above the Sphinx layer. This is similar to the Tor exit node problem.',
    mitigation:
      'The exit node never learns the origin IP. Use TLS or application-level encryption above Sphinx to protect payload content. Hidden services eliminate exit nodes entirely.',
    technicalDetail: [
      'Exit node sees final plaintext (if no E2E)',
      'Origin IP is always hidden from exit',
      'Use HTTPS above Sphinx layer',
      'Hidden services have no exit node',
    ],
  },
  {
    id: 'nation',
    name: 'Nation-State Adversary',
    shortName: 'Nation',
    color: COLORS.red,
    verdictColor: '#ffd700',
    verdict: 'DIFFICULT',
    verdictSymbol: '⚠',
    what_sees: 'Encrypted traffic patterns, timing, and volume across multiple vantage points.',
    description:
      'A nation-state adversary can observe a significant fraction of the internet, deploy nodes inside the network, and perform correlation attacks at scale.',
    mitigation:
      'Forward secrecy limits the damage of future key compromise. Route blinding prevents path discovery. Mix node pooling defeats global correlation. The attack is computationally difficult but not impossible.',
    technicalDetail: [
      'Forward secrecy: past sessions stay private',
      'Route blinding obfuscates path selection',
      'Mix nodes require global adversary to deanonymize',
      'Cover traffic defeats volume analysis',
    ],
  },
]

// ── Attack selector ───────────────────────────────────────────────────────────

interface AttackSelectorProps {
  activeId: AttackType
  onSelect: (id: AttackType) => void
}

function AttackSelector({ activeId, onSelect }: AttackSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {ATTACKS.map((atk) => {
        const active = atk.id === activeId
        return (
          <button
            key={atk.id}
            onClick={() => onSelect(atk.id)}
            className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: active ? `${atk.color}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? atk.color + '60' : 'rgba(255,255,255,0.1)'}`,
              color: active ? atk.color : 'var(--text-muted)',
              fontFamily: 'var(--font-jetbrains-mono)',
              boxShadow: active ? `0 0 20px ${atk.color}20` : 'none',
            }}
          >
            {active && (
              <motion.div
                layoutId="attack-bg"
                className="absolute inset-0 rounded-xl"
                style={{ background: `${atk.color}08` }}
                transition={{ duration: 0.2 }}
              />
            )}
            <span className="relative">{atk.shortName}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Verdict badge ─────────────────────────────────────────────────────────────

function VerdictBadge({ verdict, color, symbol }: { verdict: Verdict; color: string; symbol: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}40`,
        color,
        fontFamily: 'var(--font-jetbrains-mono)',
        boxShadow: `0 0 20px ${color}20`,
      }}
    >
      <span>{symbol}</span>
      <span>{verdict}</span>
    </div>
  )
}

// ── Attack detail panel ────────────────────────────────────────────────────────

interface AttackDetailPanelProps {
  attack: AttackDef
}

function AttackDetailPanel({ attack }: AttackDetailPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <GlassPanel accentColor={attack.color} padding="1.25rem">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-1"
              style={{ color: attack.color, fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              Attack Vector
            </p>
            <h3
              className="font-display text-xl font-semibold text-text-primary"
            >
              {attack.name}
            </h3>
          </div>
          <VerdictBadge verdict={attack.verdict} color={attack.verdictColor} symbol={attack.verdictSymbol} />
        </div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {attack.description}
        </p>
      </GlassPanel>

      {/* What attacker sees */}
      <GlassPanel accentColor={attack.color} padding="1rem">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: attack.color, fontFamily: 'var(--font-jetbrains-mono)' }}>
          What attacker sees
        </p>
        <p
          className="text-sm font-medium"
          style={{
            color: attack.color,
            fontFamily: 'var(--font-jetbrains-mono)',
            background: `${attack.color}08`,
            border: `1px solid ${attack.color}20`,
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          &quot;{attack.what_sees}&quot;
        </p>
      </GlassPanel>

      {/* Mitigation */}
      <GlassPanel accentColor={COLORS.green} padding="1rem">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: COLORS.green, fontFamily: 'var(--font-jetbrains-mono)' }}>
          Zero Protocol Response
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {attack.mitigation}
        </p>
      </GlassPanel>

      {/* Technical details */}
      <GlassPanel accentColor={COLORS.neonBlue} padding="1rem">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: COLORS.neonBlue, fontFamily: 'var(--font-jetbrains-mono)' }}>
          Technical Mitigations
        </p>
        <ul className="space-y-2">
          {attack.technicalDetail.map((detail, i) => (
            <motion.li
              key={detail}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-2 text-xs"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              <span style={{ color: COLORS.neonBlue, flexShrink: 0 }}>&#8594;</span>
              {detail}
            </motion.li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  )
}

// ── Mitigation timeline ────────────────────────────────────────────────────────

function MitigationPanel({ attack }: { attack: AttackDef }) {
  const steps = [
    { label: 'Attack Detected', color: attack.color, icon: '&#9888;' },
    { label: 'Sphinx Layer Active', color: COLORS.neonBlue, icon: '&#128274;' },
    { label: 'Forward Secrecy', color: COLORS.purple, icon: '&#128293;' },
    {
      label: attack.verdict === 'BLOCKED' || attack.verdict === 'MITIGATED' || attack.verdict === 'CONTAINED'
        ? 'Attack Neutralized'
        : 'Attack Partially Mitigated',
      color: attack.verdictColor,
      icon: attack.verdictSymbol === '✓' ? '&#10003;' : '&#9888;',
    },
  ]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(6,15,31,0.7)',
        border: `1px solid rgba(255,255,255,0.06)`,
        backdropFilter: 'blur(20px)',
        padding: '1.25rem',
      }}
    >
      <p
        className="text-xs uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        Response Timeline
      </p>
      <div className="relative">
        <div
          className="absolute left-4 top-0 bottom-0 w-px"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center gap-4 pl-10 relative"
            >
              <div
                className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{
                  background: `${step.color}12`,
                  border: `1px solid ${step.color}40`,
                  color: step.color,
                }}
                dangerouslySetInnerHTML={{ __html: step.icon }}
              />
              <span
                className="text-xs"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ThreatSimulatorPage() {
  const [activeAttack, setActiveAttack] = useState<AttackType>('isp')

  const attack = ATTACKS.find((a) => a.id === activeAttack) ?? ATTACKS[0]

  return (
    <main style={{ minHeight: '100vh' }}>

      {/* ── Header ── */}
      <section className="relative py-20 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${COLORS.red}08, transparent 70%)`,
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 px-6"
        >
          <div className="label-caps text-[10px] text-primary mb-3">Threat Simulator</div>
          <h1
            className="font-display text-[44px] md:text-[72px] font-semibold leading-[1.05] tracking-tight mb-5"
            style={{
              background: `linear-gradient(135deg, ${COLORS.red}, #ff8c00)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 0 40px ${COLORS.red}40)`,
            }}
          >
            THREAT SIMULATOR
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}
          >
            Visualize how Zero Protocol defeats real-world attacks. Select an attack vector
            to see what the adversary observes — and how Sphinx stops them.
          </p>
        </motion.div>
      </section>

      {/* ── Attack Selector ── */}
      <section className="px-6 pb-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p
              className="text-center text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              Select Attack Vector
            </p>
            <AttackSelector activeId={activeAttack} onSelect={setActiveAttack} />
          </motion.div>
        </div>
      </section>

      {/* ── Main visualization ── */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: 3D Network Scene */}
            <div className="lg:col-span-2">
              {/* Canvas is stable — never remounted. ThreatScene's internal FadeOverlay handles scene transitions. */}
              <motion.div
                className="relative rounded-2xl overflow-hidden"
                animate={{
                  borderColor: `${attack.color}20`,
                  boxShadow: `0 0 40px ${attack.color}08`,
                }}
                transition={{ duration: 0.4 }}
                style={{
                  height: 480,
                  background: 'rgba(5,5,8,0.9)',
                  border: `1px solid ${attack.color}20`,
                }}
              >
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                      Loading simulation...
                    </div>
                  }
                >
                  <Canvas
                    camera={{ position: [0, 2.5, 9], fov: 52 }}
                    style={{ background: 'transparent' }}
                    gl={{ antialias: true, alpha: true }}
                  >
                    <ThreatScene attack={activeAttack} />
                    <OrbitControls
                      enablePan={false}
                      enableZoom={false}
                      enableRotate
                      dampingFactor={0.06}
                      enableDamping
                    />
                  </Canvas>
                </Suspense>

                {/* Attack overlay label */}
                <motion.div
                  className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  animate={{
                    backgroundColor: `${attack.color}15`,
                    borderColor: `${attack.color}40`,
                    color: attack.color,
                  }}
                  transition={{ duration: 0.4 }}
                  style={{
                    border: '1px solid',
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full"
                    animate={{ backgroundColor: attack.color, boxShadow: `0 0 6px ${attack.color}` }}
                    transition={{ duration: 0.4 }}
                  />
                  LIVE SIMULATION
                </motion.div>

                {/* Verdict overlay */}
                <div className="absolute bottom-3 right-3">
                  <VerdictBadge
                    verdict={attack.verdict}
                    color={attack.verdictColor}
                    symbol={attack.verdictSymbol}
                  />
                </div>
              </motion.div>

              {/* Mitigation timeline */}
              <div className="mt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeAttack + '-timeline'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MitigationPanel attack={attack} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Attack details */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeAttack + '-detail'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <AttackDetailPanel attack={attack} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Attack overview grid ── */}
      <section
        className="relative py-20 px-6 border-t border-border bg-surface-low/30"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${COLORS.red}06, transparent)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="label-caps text-[10px] text-primary mb-3">Attack Overview</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary">
              Attack Surface Overview
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ATTACKS.map((atk, i) => (
              <motion.button
                key={atk.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setActiveAttack(atk.id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="relative rounded-2xl overflow-hidden text-left transition-all duration-200 cursor-pointer"
                style={{
                  background: 'rgba(6,15,31,0.7)',
                  border: `1px solid ${atk.id === activeAttack ? atk.color + '50' : atk.color + '18'}`,
                  backdropFilter: 'blur(20px)',
                  padding: '1.25rem',
                }}
              >
                <div
                  className="pointer-events-none absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${atk.color}40, transparent)` }}
                />
                <p
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: atk.color, fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {atk.shortName}
                </p>
                <p
                  className="font-display text-lg font-semibold text-text-primary mb-3"
                >
                  {atk.name}
                </p>
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold"
                  style={{
                    background: `${atk.verdictColor}10`,
                    border: `1px solid ${atk.verdictColor}30`,
                    color: atk.verdictColor,
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}
                >
                  {atk.verdictSymbol} {atk.verdict}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
