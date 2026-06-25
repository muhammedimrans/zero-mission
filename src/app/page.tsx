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

// ── Feature data — from Zero Protocol source ──────────────────────

const FEATURES = [
  {
    title: 'Sphinx Routing',
    description:
      'Multi-layer encrypted packet routing with per-hop re-randomized headers. Each relay peels one layer using X25519 ECDH + ChaCha20 keystream — knowing only the previous and next hop.',
    tag: 'L2+',
  },
  {
    title: 'Selective Mixnet',
    description:
      'At L3/L4, packets are Poisson-delayed (λ=40ms) and shuffled across two mix hops. Up to 3 parallel circuits per client; cover traffic fills idle gaps with RELAY_COVER=0x07 cells.',
    tag: 'L3+',
  },
  {
    title: 'Hidden Services',
    description:
      'Publish services without revealing IP addresses via a 10-step INTRODUCE1→RENDEZVOUS2 protocol. Vanguard nodes (L2=4, L3=8) prevent circuit-correlation attacks.',
    tag: 'HS',
  },
  {
    title: 'Post-Quantum Crypto',
    description:
      'PQ Sphinx V2: ML-KEM-768 (FIPS 203) hybrid with X25519. Attacker must break both simultaneously. 1184 B encapsulation key, 1088 B ciphertext, per-hop trial decapsulation.',
    tag: 'PQ',
  },
  {
    title: 'Cover Traffic',
    description:
      'Continuous RELAY_COVER cells at L3/L4 keep volume constant. Loop cells (RELAY_LOOP=0x06) create realistic bidirectional patterns. Replay window: 65,536 entries, ~4 MB.',
    tag: 'L3+',
  },
  {
    title: 'Decentralised DNS',
    description:
      'The .zero TLD is backed by Kademlia DHT (K=8, α=3, REPLICATION_K=16). Records are Ed25519 self-certified — DHT storage nodes cannot forge them. No central directory.',
    tag: '.zero',
  },
]

// ── Privacy levels (from privacy.rs) ─────────────────────────────

const LEVELS = [
  {
    level: 'L1',
    name: 'Direct Encrypted',
    route: 'Client → Exit',
    hops: 1,
    cover: '—',
    transport: 'Raw',
    color: '#64748b',
    use: 'Max speed',
  },
  {
    level: 'L2',
    name: 'Multi-hop VPN',
    route: 'Client → Guard → Relay → Exit',
    hops: 3,
    cover: '—',
    transport: 'Obfs4-Lite XOR',
    color: '#3b82f6',
    use: 'ISP-resistant',
  },
  {
    level: 'L3',
    name: 'Selective Mixnet',
    route: 'Client → Guard → Mix → Mix → Exit',
    hops: 4,
    cover: 'Poisson 40 ms',
    transport: 'TLS 1.3 morph',
    color: '#6effc7',
    use: 'High privacy (default)',
  },
  {
    level: 'L4',
    name: 'Full Mixnet',
    route: 'Client → Mix → Mix → Mix → Exit',
    hops: 4,
    cover: 'Poisson 40 ms',
    transport: 'TLS 1.3 morph',
    color: '#a855f7',
    use: 'Maximum anonymity',
  },
]

// ── Metrics ───────────────────────────────────────────────────────

const METRICS = [
  { label: 'Active Nodes',    value: 2847,   suffix: '' },
  { label: 'Circuits',        value: 14293,  suffix: '' },
  { label: 'Packets / sec',   value: 892441, suffix: '' },
  { label: 'Hidden Services', value: 1204,   suffix: '' },
]

// ── Animation variants ────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

// ── Page ──────────────────────────────────────────────────────────

export default function Home() {
  useNetworkData()
  const heroRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* ── HERO ── */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ height: '100vh' }}>
        <div className="absolute inset-0">
          <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center bg-background">
              <span className="label-caps text-[10px] text-text-muted">Initializing...</span>
            </div>
          }>
            <Canvas camera={{ position: [0, 0, 3.5], fov: 60 }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
              style={{ position: 'absolute', inset: 0 }} dpr={[1, 1.5]}>
              <HeroScene />
            </Canvas>
          </Suspense>
        </div>

        <div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(8,9,10,0.55) 70%, rgba(8,9,10,0.92) 100%)' }} />
        <div aria-hidden className="radial-mint absolute inset-0 pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-16 md:px-12">
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center text-center">

            {/* Version badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/[0.08] px-3 py-1 label-caps text-[10px] text-secondary">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-secondary" />
                v0.1.0-alpha.1 — 2294 tests · network live · pre-alpha
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp}
              className="mt-8 max-w-4xl font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-text-primary md:text-[72px]">
              The protocol that hides{' '}
              <span className="bg-gradient-to-r from-primary via-primary-dim to-secondary bg-clip-text text-transparent">
                the metadata
              </span>.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base text-text-secondary md:text-lg">
              Zero Protocol is a hybrid VPN and selective Sphinx mixnet. A VPN encrypts what you send —
              Zero Protocol also erases the timing, size, and routing patterns that identify you.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/network" className="btn btn-primary" style={{ textDecoration: 'none' }}>Explore Network</Link>
              <Link href="/architecture" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Architecture</Link>
            </motion.div>

            <motion.dl variants={fadeUp}
              className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }}
          aria-hidden className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
          <span className="label-caps text-[9px] text-text-muted">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-7" style={{ background: 'linear-gradient(to bottom, rgba(110,255,199,0.4), transparent)' }} />
        </motion.div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="border-y border-border bg-white/[0.015]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-10 opacity-80 md:justify-between md:px-12">
          <span className="label-caps text-[10px] text-text-muted">Zero Protocol v0.1.0-alpha.1</span>
          {['ML-KEM-768 + X25519 hybrid', 'Sphinx 1600 B cells', 'Selective mixnet L3/L4', 'PQ Sphinx V2', '.zero DHT DNS'].map((t) => (
            <span key={t} className="label-caps text-[11px] text-text-secondary">{t}</span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-12">
        <SectionReveal>
          <div className="label-caps text-[10px] text-primary">Core Technologies</div>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary md:text-4xl">
            Six defenses, layered.
          </h2>
        </SectionReveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} title={feature.title} description={feature.description} tag={feature.tag} index={i} />
          ))}
        </div>
      </section>

      {/* ── PRIVACY LEVELS TABLE ── */}
      <section className="border-t border-border bg-surface-low/30">
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">privacy.rs</div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary md:text-4xl">
              Four privacy levels.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-text-secondary">
              Choose the right tradeoff between speed and anonymity. L3 is the default — 4 hops, cover traffic, and TLS morphing.
            </p>
          </SectionReveal>

          <div className="mt-12 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-border" style={{ background: 'rgba(15,18,22,0.8)' }}>
                  {['Level', 'Name', 'Route', 'Hops', 'Cover Traffic', 'Transport', 'Use Case'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left label-caps text-[10px] text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((l, i) => (
                  <motion.tr key={l.level}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                    className="border-b border-border/60 transition-colors hover:bg-white/[0.025]">
                    <td className="px-4 py-4">
                      <span className="label-caps text-xs font-bold px-2 py-1 rounded"
                        style={{ color: l.color, background: `${l.color}14`, border: `1px solid ${l.color}33` }}>
                        {l.level}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-text-primary font-medium">{l.name}</td>
                    <td className="px-4 py-4 text-text-muted font-mono text-xs">{l.route}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-display font-semibold" style={{ color: l.color }}>{l.hops}</span>
                    </td>
                    <td className="px-4 py-4 text-text-secondary text-xs">{l.cover}</td>
                    <td className="px-4 py-4 text-text-secondary text-xs">{l.transport}</td>
                    <td className="px-4 py-4 text-text-muted text-xs">{l.use}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            L3/L4 build 3 parallel circuits (multipath) and assign flows round-robin. Max mix delay: L3=50ms, L4=400ms.
          </p>
        </div>
      </section>

      {/* ── CRYPTO STRIP ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Cryptographic Stack</div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary md:text-4xl">
              Every primitive chosen for a reason.
            </h2>
          </SectionReveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { prim: 'ML-KEM-768', use: 'Post-quantum KEM per hop (PQ Sphinx V2)', color: '#38bdf8', badge: 'FIPS 203' },
              { prim: 'X25519',     use: 'Sphinx ECDH, HS circuit sessions',         color: '#6effc7', badge: 'RFC 7748' },
              { prim: 'ChaCha20',   use: 'Beta routing layer keystream (sphinx.rs)',  color: '#818cf8', badge: 'C03-1 fix' },
              { prim: 'XChaCha20-Poly1305', use: 'Payload AEAD, key-at-rest, HS sessions', color: '#a855f7', badge: 'AEAD' },
              { prim: 'BLAKE2b',    use: 'KDF tree: 5 labels, keyed header MAC',     color: '#34d399', badge: 'KDF' },
              { prim: 'Ed25519',    use: 'Node ads, DHT, HS identity, release signing', color: '#fbbf24', badge: 'Dalek v2' },
              { prim: 'Argon2id',   use: 'Node key wrapping at rest (m=64MiB, t=3)', color: '#f59e0b', badge: 'UNIX only' },
              { prim: 'DPAPI',      use: 'IPC token + key wrapping on Windows',       color: '#94a3b8', badge: 'WIN only' },
            ].map((c, i) => (
              <motion.div key={c.prim}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: 'rgba(15,18,22,0.8)', border: '1px solid rgba(139,148,158,0.18)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold" style={{ color: c.color }}>{c.prim}</span>
                  <span className="label-caps text-[8px] px-1.5 py-0.5 rounded" style={{ color: c.color, border: `1px solid ${c.color}33`, background: `${c.color}0d` }}>{c.badge}</span>
                </div>
                <p className="text-xs text-text-muted">{c.use}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link href="/cryptography" className="btn btn-ghost text-sm" style={{ textDecoration: 'none' }}>
              Full Cryptography Reference →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
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
              <Link href="/network"    className="btn btn-primary" style={{ textDecoration: 'none' }}>Explore Network</Link>
              <Link href="/dashboard"  className="btn btn-ghost"   style={{ textDecoration: 'none' }}>View Dashboard</Link>
              <Link href="/roadmap"    className="btn btn-ghost"   style={{ textDecoration: 'none' }}>Roadmap</Link>
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  )
}
