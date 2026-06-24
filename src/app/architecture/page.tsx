'use client'

import { Suspense, useState, useCallback, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { COLORS } from '@/lib/constants'
import GlassPanel from '@/components/ui/GlassPanel'

const ArchitectureScene = dynamic(
  () => import('@/components/three/ArchitectureScene'),
  { ssr: false }
)

// ── Hero animated chain diagram (pure CSS/HTML) ───────────────────────────────

interface HeroChainNode {
  label: string
  color: string
  delay: number
}

const HERO_NODES: HeroChainNode[] = [
  { label: 'Client',  color: COLORS.client, delay: 0 },
  { label: 'Guard',   color: COLORS.guard,  delay: 0.15 },
  { label: 'Mix 1',   color: COLORS.mix,    delay: 0.3 },
  { label: 'Mix 2',   color: COLORS.mix,    delay: 0.45 },
  { label: 'Exit',    color: COLORS.exit,   delay: 0.6 },
  { label: 'Dest',    color: '#f0f4ff',     delay: 0.75 },
]

function HeroChain() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {HERO_NODES.map((node, i) => (
        <div key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: node.delay, duration: 0.5, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            {/* Node circle */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 8px ${node.color}60`,
                  `0 0 20px ${node.color}`,
                  `0 0 8px ${node.color}60`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: node.delay }}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `${node.color}22`,
                border: `2px solid ${node.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: node.color,
                }}
              />
            </motion.div>
            <span
              style={{
                color: node.color,
                fontSize: 9,
                fontFamily: 'var(--font-jetbrains-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.85,
              }}
            >
              {node.label}
            </span>
          </motion.div>

          {/* Arrow connector */}
          {i < HERO_NODES.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: node.delay + 0.1, duration: 0.3 }}
              style={{
                width: 32,
                height: 2,
                background: `linear-gradient(90deg, ${node.color}60, ${HERO_NODES[i + 1].color}60)`,
                position: 'relative',
                marginBottom: 20,
                transformOrigin: 'left center',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Moving packet across hero chain ──────────────────────────────────────────

function HeroPacket() {
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#ffffff',
        boxShadow: '0 0 12px #ffffff, 0 0 24px #00d4ff',
        top: '38px',
        left: 0,
      }}
      animate={{ left: ['0%', '95%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
  )
}

// ── Section 2: How it works cards ─────────────────────────────────────────────

interface HowItWorksCard {
  number: string
  title: string
  description: string
  color: string
  items: string[]
}

const HOW_IT_WORKS: HowItWorksCard[] = [
  {
    number: '01',
    title: 'Build a Circuit',
    description: 'Client selects 3+ nodes and establishes shared keys.',
    color: COLORS.guard,
    items: [
      'Client discovers available nodes',
      'Selects Guard → Mix → Exit path',
      'Performs Diffie–Hellman with each',
      'Circuit ID established per hop',
    ],
  },
  {
    number: '02',
    title: 'Wrap the Packet',
    description: 'Sphinx format: nested encryption layers — outermost first.',
    color: COLORS.mix,
    items: [
      'Encrypt for Exit (innermost)',
      'Encrypt for Mix node',
      'Encrypt for Guard (outermost)',
      'Each layer hides the next hop',
    ],
  },
  {
    number: '03',
    title: 'Route & Strip',
    description: 'Each hop decrypts one layer, then forwards the remainder.',
    color: COLORS.exit,
    items: [
      'Guard strips outer layer → Guard sees Mix',
      'Mix strips next layer → Mix sees Exit',
      'Exit strips last layer → delivers payload',
      'No single node knows full path',
    ],
  },
]

// ── Section 4: Properties cards ───────────────────────────────────────────────

interface PropertyCard {
  title: string
  subtitle: string
  description: string
  color: string
  icon: string
}

const PROPERTIES: PropertyCard[] = [
  {
    title: 'Forward Secrecy',
    subtitle: 'Ephemeral keys per circuit',
    description:
      'Each circuit uses fresh Diffie–Hellman keys. Compromise of long-term keys cannot decrypt past sessions.',
    color: COLORS.neonBlue,
    icon: '🔑',
  },
  {
    title: 'Unlinkability',
    subtitle: 'Guard ≠ Destination',
    description:
      'Guard nodes see origin but not destination. Exit nodes see destination but not origin. No single node links sender to receiver.',
    color: COLORS.mix,
    icon: '⛓️',
  },
  {
    title: 'Traffic Shaping',
    subtitle: 'Constant-rate emission',
    description:
      'Nodes emit cover traffic at a constant rate. Timing analysis and traffic correlation attacks are defeated.',
    color: COLORS.exit,
    icon: '〜',
  },
  {
    title: 'Route Blinding',
    subtitle: 'SURB mechanism',
    description:
      'Single-Use Reply Blocks allow replies without the responder knowing the requester\'s address or route.',
    color: COLORS.purple,
    icon: '◎',
  },
]

// ── Route visualizer panel (right side) ──────────────────────────────────────

const HOP_LABELS = ['Client', 'Guard', 'Mix 1', 'Mix 2', 'Exit']
const HOP_COLORS = [COLORS.client, COLORS.guard, COLORS.mix, COLORS.mix, COLORS.exit]

function VisualizerPanel({
  currentHop,
  layersRemaining,
  onSend,
  isSending,
}: {
  currentHop: number
  layersRemaining: number
  onSend: () => void
  isSending: boolean
}) {
  const remainingNodes = currentHop >= 0
    ? HOP_LABELS.slice(currentHop)
    : HOP_LABELS

  return (
    <div
      style={{
        width: 240,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Send button */}
      <button
        onClick={onSend}
        disabled={isSending}
        style={{
          background: isSending
            ? 'rgba(0,212,255,0.05)'
            : 'rgba(0,212,255,0.12)',
          border: `1px solid ${isSending ? 'rgba(0,212,255,0.15)' : COLORS.neonBlue}`,
          color: isSending ? '#4b5563' : COLORS.neonBlue,
          padding: '10px 20px',
          borderRadius: 6,
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 12,
          fontWeight: 600,
          cursor: isSending ? 'not-allowed' : 'pointer',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
          textShadow: isSending ? 'none' : `0 0 12px ${COLORS.neonBlue}80`,
        }}
      >
        {isSending ? 'Routing...' : 'Send Packet'}
      </button>

      {/* Current layer */}
      <GlassPanel padding="14px" accentColor={COLORS.neonBlue}>
        <div
          style={{
            color: '#4b5563',
            fontSize: 9,
            fontFamily: 'var(--font-jetbrains-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 8,
          }}
        >
          Encryption Layers
        </div>
        <div
          style={{
            color: COLORS.neonBlue,
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'var(--font-space-grotesk)',
            lineHeight: 1,
            textShadow: `0 0 16px ${COLORS.neonBlue}60`,
            marginBottom: 4,
          }}
        >
          {layersRemaining}
        </div>
        <div style={{ color: '#374151', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}>
          layers remaining
        </div>
      </GlassPanel>

      {/* Current hop */}
      <GlassPanel padding="14px" accentColor={COLORS.guard}>
        <div
          style={{
            color: '#4b5563',
            fontSize: 9,
            fontFamily: 'var(--font-jetbrains-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 8,
          }}
        >
          Current Hop
        </div>
        <div
          style={{
            color: currentHop >= 0 ? HOP_COLORS[currentHop] : '#374151',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-jetbrains-mono)',
            marginBottom: 2,
          }}
        >
          {currentHop >= 0 ? HOP_LABELS[currentHop] : '—'}
        </div>
        <div style={{ color: '#374151', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}>
          {currentHop < 0 ? 'awaiting packet' : `hop ${currentHop + 1} of ${HOP_LABELS.length}`}
        </div>
      </GlassPanel>

      {/* Remaining path */}
      <GlassPanel padding="14px" accentColor={COLORS.exit}>
        <div
          style={{
            color: '#4b5563',
            fontSize: 9,
            fontFamily: 'var(--font-jetbrains-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 10,
          }}
        >
          Remaining Path
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {remainingNodes.map((label, i) => {
            const idx = HOP_LABELS.indexOf(label)
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: i === 0 ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: HOP_COLORS[idx] ?? '#ffffff',
                    boxShadow: i === 0 ? `0 0 8px ${HOP_COLORS[idx]}` : 'none',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: i === 0 ? HOP_COLORS[idx] : '#4b5563',
                    fontSize: 11,
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </GlassPanel>
    </div>
  )
}

// ── Main architecture page ────────────────────────────────────────────────────

export default function ArchitecturePage() {
  const [currentHop, setCurrentHop] = useState(-1)
  const [layersRemaining, setLayersRemaining] = useState(4)
  const [isSending, setIsSending] = useState(false)

  const handleHopChange = useCallback((hop: number, layers: number) => {
    setCurrentHop(hop)
    setLayersRemaining(layers)
    if (hop === -1) setIsSending(false)
  }, [])

  const handleSendPacket = useCallback(() => {
    if (isSending) return
    setIsSending(true)
    ;(window as Window & { __archSendPacket?: () => void }).__archSendPacket?.()
  }, [isSending])

  return (
    <main style={{ background: COLORS.bg, color: COLORS.white, overflowX: 'hidden' }}>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — HERO                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 50% at 50% 50%, ${COLORS.neonBlue}08 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Module label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            color: '#374151',
            fontSize: 10,
            fontFamily: 'var(--font-jetbrains-mono)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          Module · 02
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontSize: 'clamp(42px, 8vw, 80px)',
            fontWeight: 700,
            fontFamily: 'var(--font-space-grotesk)',
            color: COLORS.neonBlue,
            textShadow: `0 0 60px ${COLORS.neonBlue}50`,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            margin: 0,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Architecture
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            color: '#6b7280',
            fontSize: 16,
            fontFamily: 'var(--font-space-grotesk)',
            marginBottom: 60,
            textAlign: 'center',
          }}
        >
          Multi-Layer Encrypted Routing
        </motion.p>

        {/* Animated diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{ position: 'relative', width: '100%', maxWidth: 680 }}
        >
          <HeroChain />
          <HeroPacket />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{
              color: '#1f2937',
              fontSize: 10,
              fontFamily: 'var(--font-jetbrains-mono)',
              letterSpacing: '0.15em',
              textAlign: 'center',
            }}
          >
            SCROLL ↓
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — HOW IT WORKS                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          background: COLORS.bgSecondary,
          padding: 'clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          {/* Heading */}
          <div style={{ marginBottom: 60, textAlign: 'center' }}>
            <p
              style={{
                color: '#374151',
                fontSize: 10,
                fontFamily: 'var(--font-jetbrains-mono)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Protocol Mechanics
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 46px)',
                fontWeight: 700,
                fontFamily: 'var(--font-space-grotesk)',
                color: COLORS.white,
                margin: 0,
              }}
            >
              How it Works
            </h2>
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {HOW_IT_WORKS.map((card) => (
              <motion.div
                key={card.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6 }}
              >
                <GlassPanel padding="28px" accentColor={card.color}>
                  {/* Number */}
                  <div
                    style={{
                      color: card.color,
                      fontSize: 32,
                      fontWeight: 700,
                      fontFamily: 'var(--font-space-grotesk)',
                      lineHeight: 1,
                      marginBottom: 16,
                      opacity: 0.7,
                    }}
                  >
                    {card.number}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      color: COLORS.white,
                      fontSize: 18,
                      fontWeight: 600,
                      fontFamily: 'var(--font-space-grotesk)',
                      marginBottom: 8,
                      margin: 0,
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      color: '#6b7280',
                      fontSize: 13,
                      fontFamily: 'var(--font-space-grotesk)',
                      marginBottom: 20,
                      lineHeight: 1.6,
                      marginTop: 8,
                    }}
                  >
                    {card.description}
                  </p>

                  {/* Items */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {card.items.map((item) => (
                      <li
                        key={item}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          fontSize: 12,
                          fontFamily: 'var(--font-jetbrains-mono)',
                          color: '#9ca3af',
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: card.color, flexShrink: 0, marginTop: 2 }}>›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — INTERACTIVE ROUTE VISUALIZER                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          background: COLORS.bg,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 60px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {/* Section heading */}
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <p
              style={{
                color: '#374151',
                fontSize: 10,
                fontFamily: 'var(--font-jetbrains-mono)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Interactive Demo
            </p>
            <h2
              style={{
                fontSize: 'clamp(26px, 4vw, 42px)',
                fontWeight: 700,
                fontFamily: 'var(--font-space-grotesk)',
                color: COLORS.white,
                margin: 0,
              }}
            >
              Route Visualizer
            </h2>
            <p
              style={{
                color: '#4b5563',
                fontSize: 13,
                fontFamily: 'var(--font-space-grotesk)',
                marginTop: 8,
              }}
            >
              Watch Sphinx packet routing in real-time
            </p>
          </div>

          {/* Canvas + side panel */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            {/* 3D canvas */}
            <div
              style={{
                flex: 1,
                minWidth: 300,
                height: 420,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(0,212,255,0.1)',
                background: COLORS.bg,
              }}
            >
              <Canvas
                camera={{ position: [0, 2, 9], fov: 55, near: 0.1, far: 60 }}
                gl={{ antialias: true, alpha: false }}
                dpr={[1, 2]}
              >
                <Suspense fallback={null}>
                  <ArchitectureScene onHopChange={handleHopChange} />
                </Suspense>
              </Canvas>
            </div>

            {/* Side panel */}
            <VisualizerPanel
              currentHop={currentHop}
              layersRemaining={layersRemaining}
              onSend={handleSendPacket}
              isSending={isSending}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — PROPERTIES                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: COLORS.bgSecondary,
          padding: 'clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          {/* Heading */}
          <div style={{ marginBottom: 60, textAlign: 'center' }}>
            <p
              style={{
                color: '#374151',
                fontSize: 10,
                fontFamily: 'var(--font-jetbrains-mono)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Security Properties
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 46px)',
                fontWeight: 700,
                fontFamily: 'var(--font-space-grotesk)',
                color: COLORS.white,
                margin: 0,
              }}
            >
              What Zero Protocol Guarantees
            </h2>
          </div>

          {/* 2×2 grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {PROPERTIES.map((prop) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55 }}
                whileHover={{ scale: 1.02 }}
              >
                <GlassPanel padding="28px" accentColor={prop.color} style={{ height: '100%' }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: `${prop.color}18`,
                      border: `1px solid ${prop.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      marginBottom: 16,
                    }}
                  >
                    {prop.icon}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      color: prop.color,
                      fontSize: 17,
                      fontWeight: 700,
                      fontFamily: 'var(--font-space-grotesk)',
                      margin: '0 0 4px 0',
                    }}
                  >
                    {prop.title}
                  </h3>

                  {/* Subtitle */}
                  <p
                    style={{
                      color: '#4b5563',
                      fontSize: 11,
                      fontFamily: 'var(--font-jetbrains-mono)',
                      margin: '0 0 14px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {prop.subtitle}
                  </p>

                  {/* Description */}
                  <p
                    style={{
                      color: '#9ca3af',
                      fontSize: 13,
                      fontFamily: 'var(--font-space-grotesk)',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {prop.description}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <div
        style={{
          padding: '20px 40px',
          borderTop: '1px solid rgba(0,212,255,0.06)',
          color: '#1f2937',
          fontSize: 9,
          fontFamily: 'var(--font-jetbrains-mono)',
          letterSpacing: '0.1em',
          textAlign: 'center',
        }}
      >
        ZERO PROTOCOL · ARCHITECTURE MODULE
      </div>
    </main>
  )
}
