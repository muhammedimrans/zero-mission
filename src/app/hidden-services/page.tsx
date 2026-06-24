'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { motion, useInView } from 'framer-motion'
import GlassPanel from '@/components/ui/GlassPanel'
import { COLORS } from '@/lib/constants'
import type { HiddenServiceStep } from '@/components/three/HiddenServiceScene'

const HiddenServiceScene = dynamic(
  () => import('@/components/three/HiddenServiceScene'),
  { ssr: false }
)

// ── Walkthrough data ──────────────────────────────────────────────────────────

interface WalkthroughStep {
  step: HiddenServiceStep
  title: string
  subtitle: string
  description: string
  color: string
  tags: string[]
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    step: 1,
    title: 'Service Registration',
    subtitle: 'Publishing to the DHT',
    description:
      'The service generates an Ed25519 key pair. The public key becomes the service address. It signs an encrypted descriptor — containing the introduction point list — and publishes it to the distributed hash table.',
    color: COLORS.purple,
    tags: ['Ed25519', 'DHT', 'Descriptor'],
  },
  {
    step: 2,
    title: 'Introduction Points',
    subtitle: 'Establishing contact addresses',
    description:
      'The service builds long-lived Sphinx circuits to three introduction points. These nodes agree to relay introduction messages to the service, but they never learn the final service location.',
    color: COLORS.neonBlue,
    tags: ['Sphinx Circuits', 'Long-lived', 'Introduction'],
  },
  {
    step: 3,
    title: 'Client Lookup',
    subtitle: 'Discovering the service',
    description:
      'The client queries the DHT for the service descriptor using the service address as a key. The DHT returns the encrypted descriptor, which the client verifies and decrypts to find the introduction points.',
    color: '#00e5ff',
    tags: ['DHT Query', 'Descriptor', 'Verification'],
  },
  {
    step: 4,
    title: 'Rendezvous Setup',
    subtitle: 'Meeting in the dark',
    description:
      "The client picks a random relay node as a rendezvous point and sends a cookie to it. The client then sends an introduction message through the service's introduction point — which forwards it to the service. The service connects back to the rendezvous point.",
    color: COLORS.green,
    tags: ['Rendezvous Cookie', 'Introduction Msg', 'Handshake'],
  },
  {
    step: 5,
    title: 'Traffic Exchange',
    subtitle: 'End-to-end privacy',
    description:
      'Bidirectional traffic flows through overlapping circuits. The rendezvous point sees only encrypted, unlinkable Sphinx packets. Neither side knows the other\'s real IP address or routing path.',
    color: '#a855f7',
    tags: ['Bidirectional', 'Sphinx', 'Zero Knowledge'],
  },
]

// ── Privacy properties ────────────────────────────────────────────────────────

interface Property {
  title: string
  description: string
  color: string
  icon: React.ReactNode
}

const PROPERTIES: Property[] = [
  {
    title: 'Server Anonymity',
    description: 'The service IP address is never revealed to any client, relay, or observer.',
    color: COLORS.purple,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  {
    title: 'Client Anonymity',
    description: 'The client IP address is never revealed to the service or any introduction point.',
    color: COLORS.neonBlue,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M17 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'End-to-End Encryption',
    description: 'Traffic is double-wrapped in Sphinx: once for the hidden service circuit, once for the client circuit.',
    color: COLORS.green,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Censorship Resistance',
    description: 'Service discovery is distributed across thousands of DHT nodes — no single point of failure.',
    color: '#a855f7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
      </svg>
    ),
  },
]

// ── Connection web background ──────────────────────────────────────────────────

function ConnectionWebBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const NODES = 40
    const nodes = Array.from({ length: NODES }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }))

    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      nodes.forEach((n) => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
      })
      for (let i = 0; i < NODES; i++) {
        for (let j = i + 1; j < NODES; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.08
            ctx.strokeStyle = `rgba(129,140,248,${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }
      nodes.forEach((n) => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(129,140,248,0.25)'
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  )
}

// ── Step section ──────────────────────────────────────────────────────────────

interface StepSectionProps {
  stepData: WalkthroughStep
  index: number
  activeStep: HiddenServiceStep
  onBecomeActive: (s: HiddenServiceStep) => void
}

function StepSection({ stepData, index, activeStep, onBecomeActive }: StepSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-40% 0px -40% 0px' })
  const isRight = index % 2 === 0

  useEffect(() => {
    if (inView) onBecomeActive(stepData.step)
  }, [inView, stepData.step, onBecomeActive])

  return (
    <div ref={ref} className="min-h-screen flex items-center" style={{ padding: '60px 0' }}>
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text side */}
        <motion.div
          className={isRight ? 'lg:order-1' : 'lg:order-2'}
          initial={{ opacity: 0, x: isRight ? -40 : 40 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0.3, x: isRight ? -20 : 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: `${stepData.color}18`,
                border: `1px solid ${stepData.color}50`,
                color: stepData.color,
                fontFamily: 'var(--font-jetbrains-mono)',
              }}
            >
              {stepData.step}
            </div>
            <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${stepData.color}40, transparent)` }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: stepData.color, fontFamily: 'var(--font-jetbrains-mono)' }}>
              Step {stepData.step} / 5
            </span>
          </div>

          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: stepData.color, fontFamily: 'var(--font-jetbrains-mono)' }}>
            {stepData.subtitle}
          </p>
          <h2
            className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-4"
          >
            {stepData.title}
          </h2>
          <p className="text-sm leading-loose mb-6" style={{ color: 'var(--text-muted)' }}>
            {stepData.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {stepData.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: `${stepData.color}10`,
                  border: `1px solid ${stepData.color}30`,
                  color: stepData.color,
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 3D scene side — only shown on the active step */}
        <motion.div
          className={isRight ? 'lg:order-2' : 'lg:order-1'}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0.15, scale: 0.92 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              height: 420,
              background: 'rgba(5,5,8,0.8)',
              border: `1px solid ${stepData.color}18`,
              boxShadow: inView ? `0 0 40px ${stepData.color}10` : 'none',
              transition: 'box-shadow 0.5s',
            }}
          >
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                  Loading scene...
                </div>
              }
            >
              <Canvas
                camera={{ position: [0, 2, 7], fov: 52 }}
                style={{ background: 'transparent' }}
                gl={{ antialias: true, alpha: true }}
              >
                <HiddenServiceScene step={activeStep} />
                <OrbitControls
                  enablePan={false}
                  enableZoom={false}
                  enableRotate
                  dampingFactor={0.06}
                  enableDamping
                />
              </Canvas>
            </Suspense>

            {/* Step badge overlay */}
            <div
              className="absolute top-3 right-3 text-xs px-2 py-1 rounded-md"
              style={{
                background: `${stepData.color}15`,
                border: `1px solid ${stepData.color}40`,
                color: stepData.color,
                fontFamily: 'var(--font-jetbrains-mono)',
              }}
            >
              Step {stepData.step}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ── Progress indicator ─────────────────────────────────────────────────────────

function StepProgress({ activeStep }: { activeStep: HiddenServiceStep }) {
  return (
    <div
      className="fixed right-6 top-1/2 z-50 flex flex-col gap-2"
      style={{ transform: 'translateY(-50%)' }}
    >
      {WALKTHROUGH_STEPS.map((s) => (
        <div
          key={s.step}
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: activeStep === s.step ? s.color : 'rgba(107,114,128,0.3)',
            boxShadow: activeStep === s.step ? `0 0 8px ${s.color}` : 'none',
            transform: activeStep === s.step ? 'scale(1.5)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function HiddenServicesPage() {
  const [activeStep, setActiveStep] = useState<HiddenServiceStep>(1)

  return (
    <main>

      {/* Progress indicator */}
      <StepProgress activeStep={activeStep} />

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        <ConnectionWebBg />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${COLORS.green}08, transparent 70%)`,
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 px-6"
        >
          <div className="label-caps text-[10px] text-primary mb-3">Hidden Services</div>
          <h1
            className="font-display text-[44px] md:text-[72px] font-semibold leading-[1.05] tracking-tight mb-6"
            style={{
              background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.neonBlue})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 0 40px ${COLORS.green}40)`,
            }}
          >
            HIDDEN SERVICES
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto mb-8"
            style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}
          >
            Onion-routed service endpoints where both client and server remain
            anonymous. No IP addresses are exchanged — ever.
          </p>

          {/* Stat badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              { label: '6 Hops', desc: 'Total circuit length' },
              { label: '2 Circuits', desc: 'Overlapping paths' },
              { label: '0 IPs', desc: 'Exposed to adversary' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center px-5 py-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-xl font-bold" style={{ color: COLORS.green }}>
                  {stat.label}
                </span>
                <span className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  {stat.desc}
                </span>
              </div>
            ))}
          </div>

          <motion.div
            className="mt-12 flex flex-col items-center gap-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              scroll to walk through
            </span>
            <div className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${COLORS.green}60, transparent)` }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Walkthrough Steps ── */}
      {WALKTHROUGH_STEPS.map((stepData, i) => (
        <StepSection
          key={stepData.step}
          stepData={stepData}
          index={i}
          activeStep={activeStep}
          onBecomeActive={setActiveStep}
        />
      ))}

      {/* ── Properties Grid ── */}
      <section
        className="relative py-24 border-t border-border bg-surface-low/30"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${COLORS.purple}07, transparent)`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="label-caps text-[10px] text-primary mb-3">Security Guarantees</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary">
              Privacy Properties
            </h2>
            <p className="mt-4 text-sm max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Zero Protocol hidden services provide mathematically provable privacy guarantees for both parties.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROPERTIES.map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <GlassPanel accentColor={prop.color} padding="1.5rem" className="h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `${prop.color}12`,
                      border: `1px solid ${prop.color}30`,
                      color: prop.color,
                    }}
                  >
                    {prop.icon}
                  </div>
                  <h3
                    className="text-base font-semibold mb-2 text-text-primary"
                  >
                    {prop.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {prop.description}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
