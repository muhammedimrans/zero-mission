'use client'

import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useNetworkData } from '@/hooks/useNetworkData'
import HeroScene from '@/components/three/HeroScene'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import FeatureCard from '@/components/ui/FeatureCard'
import SectionReveal from '@/components/layout/SectionReveal'

// ── Feature data — from Zero Protocol whitepaper ─────────────────

const FEATURES = [
  {
    title: 'Sphinx Routing',
    description:
      'Multi-layer encrypted packet routing with mathematically unlinkable hops. Each relay peels one encryption layer, knowing only the previous and next hop — never the full path.',
    tag: 'L2+',
  },
  {
    title: 'Selective Mixnet',
    description:
      'At L3/L4, packets are padded, Poisson-delayed and shuffled across two mix hops. Ingress and egress timing cannot be correlated.',
    tag: 'L3+',
  },
  {
    title: 'Hidden Services',
    description:
      'Publish and discover services without revealing server locations or IP addresses. Rendezvous-point architecture ensures both client and server remain mutually anonymous.',
    tag: 'Design',
  },
  {
    title: 'Post-Quantum Crypto',
    description:
      'Hybrid ML-KEM-768 + X25519 handshakes. An attacker must break both the classical and post-quantum parts simultaneously.',
    tag: 'PQ',
  },
  {
    title: 'Cover Traffic',
    description:
      'Continuous decoy cells at L3/L4 keep traffic volume constant. Idle periods vanish into statistical noise.',
    tag: 'L3+',
  },
  {
    title: 'Distributed Hash Table',
    description:
      'Censorship-resistant service discovery with k-anonymity guarantees. No central directory — nodes collectively maintain a resilient, replicated routing table.',
    tag: 'Design',
  },
]

// ── Metrics ───────────────────────────────────────────────────────

const METRICS = [
  { label: 'Active Nodes',    value: 2847,   suffix: '' },
  { label: 'Circuits',        value: 14293,  suffix: '' },
  { label: 'Packets / sec',   value: 892441, suffix: '' },
  { label: 'Hidden Services', value: 1204,   suffix: '' },
]

// ── Animation variants — from Zero Website ────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
}

// ── Page ──────────────────────────────────────────────────────────

export default function Home() {
  useNetworkData()
  const heroRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ height: '100vh' }}
      >
        {/* Three.js canvas — absolute fill */}
        <div className="absolute inset-0">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-background">
                <span className="label-caps text-[10px] text-text-muted">Initializing...</span>
              </div>
            }
          >
            <Canvas
              camera={{ position: [0, 0, 3.5], fov: 60 }}
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
              style={{ position: 'absolute', inset: 0 }}
              dpr={[1, 1.5]}
            >
              <HeroScene />
            </Canvas>
          </Suspense>
        </div>

        {/* Vignette — updated to near-black (#08090a) matching --background */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(8,9,10,0.55) 70%, rgba(8,9,10,0.92) 100%)',
          }}
        />

        {/* radial-mint glow overlay */}
        <div aria-hidden className="radial-mint absolute inset-0 pointer-events-none" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-16 md:px-12">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center text-center"
          >
            {/* Status chip — exact StatusChip primary pattern */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/[0.08] px-3 py-1 label-caps text-[10px] text-secondary">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Project in testing — network live
              </span>
            </motion.div>

            {/* Title — exact Zero Website h1 pattern */}
            <motion.h1
              variants={fadeUp}
              className="mt-8 max-w-4xl font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-text-primary md:text-[72px]"
            >
              The protocol that hides{' '}
              <span className="bg-gradient-to-r from-primary via-primary-dim to-secondary bg-clip-text text-transparent">
                the metadata
              </span>
              .
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-2xl text-base text-text-secondary md:text-lg"
            >
              Zero Protocol is a hybrid VPN and selective mixnet. A VPN encrypts what you send —
              Zero Protocol also erases the timing, size, and routing patterns that identify you.
            </motion.p>

            {/* CTA buttons — exact ButtonPrimary / ButtonGhost pattern */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/network" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Explore Network
              </Link>
              <Link href="/architecture" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                Architecture
              </Link>
            </motion.div>

            {/* Stats bar — exact gap-px pattern from Zero Website */}
            <motion.dl
              variants={fadeUp}
              className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4"
            >
              {METRICS.map((m) => (
                <div key={m.label} className="bg-surface px-6 py-6 text-left">
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums text-text-primary md:text-3xl">
                    <AnimatedCounter value={m.value} duration={2200} suffix={m.suffix} />
                  </dd>
                  <div className="label-caps mt-1 text-[10px] text-text-muted">{m.label}</div>
                </div>
              ))}
            </motion.dl>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          aria-hidden
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        >
          <span className="label-caps text-[9px] text-text-muted">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-7"
            style={{ background: 'linear-gradient(to bottom, rgba(110,255,199,0.4), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ── TRUST BAR — exact pattern from Zero Website ── */}
      <section className="border-y border-border bg-white/[0.015]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-10 opacity-80 md:justify-between md:px-12">
          <span className="label-caps text-[10px] text-text-muted">Live network visualization</span>
          {[
            'ML-KEM-768 hybrid KEM',
            'Sphinx packet format',
            'Selective mixnet',
            'Post-quantum ready',
          ].map((t) => (
            <span key={t} className="label-caps text-[11px] text-text-secondary">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURES — exact Core Tech pattern from Zero Website ── */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-12">
        <SectionReveal>
          <div className="label-caps text-[10px] text-primary">Core Technologies</div>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary md:text-4xl">
            Six defenses, layered.
          </h2>
        </SectionReveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              tag={feature.tag}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* ── CTA — exact pattern from Zero Website ── */}
      <section className="relative overflow-hidden border-t border-border bg-surface-low/30">
        <div aria-hidden className="radial-mint absolute inset-0" />
        <div className="relative mx-auto max-w-[1440px] px-6 py-24 text-center md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Explore the Network</div>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-semibold text-text-primary md:text-5xl">
              Anonymity is a network effect.
              <br />
              <span className="text-text-muted">Be part of the noise.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm text-text-secondary">
              Explore the live global topology, trace packet routes through the mix network,
              and see how privacy is preserved end-to-end across every hop.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/network" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Explore Network
              </Link>
              <Link href="/dashboard" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                View Dashboard
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  )
}
