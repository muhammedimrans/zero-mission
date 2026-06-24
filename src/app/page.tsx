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

// ── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Sphinx Routing',
    description:
      'Multi-layer encrypted packet routing with mathematically unlinkable hops. Each relay peels one encryption layer, knowing only the previous and next hop — never the full path.',
    icon: '🔀',
    gradient: 'linear-gradient(135deg, #00d4ff, #0077cc)',
  },
  {
    title: 'Mix Network',
    description:
      'Mathematically proven traffic anonymization via timed packet mixing. Nodes collect, reorder, and batch-release messages to defeat traffic analysis and correlation attacks.',
    icon: '🌊',
    gradient: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
  },
  {
    title: 'Hidden Services',
    description:
      'Publish and discover services without revealing server locations or IP addresses. Rendezvous-point architecture ensures both client and server remain mutually anonymous.',
    icon: '🕵️',
    gradient: 'linear-gradient(135deg, #00ff88, #007744)',
  },
  {
    title: 'Credential System',
    description:
      'Privacy-preserving authentication using zero-knowledge proofs. Prove membership and reputation without revealing identity, linking sessions, or exposing usage patterns.',
    icon: '🔐',
    gradient: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
  },
  {
    title: 'Post-Quantum',
    description:
      'CRYSTALS-Kyber key encapsulation and CRYSTALS-Dilithium digital signatures protect all communications against attacks from both classical and quantum adversaries.',
    icon: '⚛️',
    gradient: 'linear-gradient(135deg, #ff6b6b, #7c3aed)',
  },
  {
    title: 'Distributed Hash Table',
    description:
      'Censorship-resistant service discovery with k-anonymity guarantees. No central directory server — nodes collectively maintain a resilient, replicated routing table.',
    icon: '🗺️',
    gradient: 'linear-gradient(135deg, #00ff88, #00d4ff)',
  },
]

// ── Metrics ───────────────────────────────────────────────────────────────────

const METRICS = [
  { label: 'Active Nodes', value: 2847, suffix: '' },
  { label: 'Circuits', value: 14293, suffix: '' },
  { label: 'Packets / sec', value: 892441, suffix: '' },
  { label: 'Hidden Services', value: 1204, suffix: '' },
]

// ── Hero text variants ────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.3,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  // Populate the global store with network data
  useNetworkData()

  const heroRef = useRef<HTMLDivElement>(null)

  return (
    <main style={{ background: '#050508', color: '#f0f4ff', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}
      >
        {/* R3F Canvas — absolute fill */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Suspense
            fallback={
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#050508',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    color: '#00d4ff',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 12,
                    opacity: 0.5,
                    letterSpacing: '0.2em',
                  }}
                >
                  INITIALIZING...
                </span>
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

        {/* Radial vignette so text is always legible */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(5,5,8,0.55) 70%, rgba(5,5,8,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Hero text overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 64,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 14px',
                  borderRadius: 9999,
                  background: 'rgba(0, 212, 255, 0.08)',
                  border: '1px solid rgba(0, 212, 255, 0.22)',
                  color: '#00d4ff',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00d4ff',
                    boxShadow: '0 0 8px #00d4ff',
                  }}
                />
                Network Online · 2,847 Nodes
              </span>
            </motion.div>

            {/* Main title */}
            <motion.h1
              variants={fadeUp}
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 'clamp(48px, 8vw, 80px)',
                fontWeight: 700,
                color: '#f0f4ff',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: 1,
                textShadow: '0 0 60px rgba(0, 212, 255, 0.15)',
              }}
            >
              ZERO PROTOCOL
            </motion.h1>

            {/* Sub-lines */}
            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 'clamp(16px, 2.5vw, 24px)',
                color: '#00d4ff',
                margin: 0,
                textShadow: '0 0 24px rgba(0,212,255,0.5)',
              }}
            >
              Private Internet Infrastructure
            </motion.p>

            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 'clamp(14px, 2vw, 24px)',
                color: '#4a5568',
                margin: 0,
              }}
            >
              for the Post-Quantum Era
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <Link
                href="/network"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 28px',
                  borderRadius: 8,
                  border: '1px solid #00d4ff',
                  color: '#00d4ff',
                  background: 'rgba(0, 212, 255, 0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  fontFamily: 'var(--font-space-grotesk)',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = '#00d4ff'
                  el.style.color = '#050508'
                  el.style.boxShadow = '0 0 32px rgba(0,212,255,0.4)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'rgba(0, 212, 255, 0.06)'
                  el.style.color = '#00d4ff'
                  el.style.boxShadow = 'none'
                }}
              >
                Explore Network
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              <Link
                href="/architecture"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 28px',
                  borderRadius: 8,
                  border: '1px solid rgba(240,244,255,0.25)',
                  color: '#f0f4ff',
                  background: 'rgba(240, 244, 255, 0.04)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  fontFamily: 'var(--font-space-grotesk)',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'rgba(240,244,255,0.55)'
                  el.style.background = 'rgba(240,244,255,0.08)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'rgba(240,244,255,0.25)'
                  el.style.background = 'rgba(240, 244, 255, 0.04)'
                }}
              >
                Architecture
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              color: '#4a5568',
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, #00d4ff60, transparent)' }}
          />
        </motion.div>
      </section>

      {/* ── METRICS BAR ── */}
      <SectionReveal>
        <div
          style={{
            width: '100%',
            background: 'rgba(10, 10, 20, 0.75)',
            borderTop: '1px solid rgba(0,212,255,0.1)',
            borderBottom: '1px solid rgba(0,212,255,0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
            }}
          >
            {METRICS.map((metric, i) => (
              <div
                key={metric.label}
                style={{
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* Separator */}
                {i > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '25%',
                      height: '50%',
                      width: 1,
                      background: 'rgba(0,212,255,0.12)',
                    }}
                  />
                )}

                {/* Number */}
                <div
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 'clamp(28px, 4vw, 48px)',
                    fontWeight: 700,
                    color: '#00d4ff',
                    textShadow: '0 0 24px rgba(0,212,255,0.4)',
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  <AnimatedCounter
                    value={metric.value}
                    duration={2200}
                    suffix={metric.suffix}
                  />
                </div>

                {/* Label */}
                <div
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    fontSize: 12,
                    color: '#4a5568',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 24px' }}>
        <SectionReveal>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 11,
                color: '#00d4ff',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginBottom: 16,
                opacity: 0.8,
              }}
            >
              Protocol Features
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 700,
                color: '#f0f4ff',
                margin: '0 0 1rem',
                letterSpacing: '-0.01em',
              }}
            >
              Built for Maximum Privacy
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 16,
                color: '#4a5568',
                maxWidth: 540,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Every layer of Zero Protocol is designed with privacy as a first principle,
              not an afterthought.
            </p>
          </div>
        </SectionReveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              gradient={feature.gradient}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <SectionReveal>
        <section
          style={{
            padding: '6rem 24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 600,
              height: 300,
              background: 'radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
            {/* Decorative line */}
            <div
              style={{
                width: 64,
                height: 1,
                background: 'linear-gradient(to right, transparent, #00d4ff, transparent)',
                margin: '0 auto 2rem',
              }}
            />

            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 700,
                color: '#f0f4ff',
                margin: '0 0 1rem',
                letterSpacing: '-0.01em',
              }}
            >
              Ready to Explore the Network?
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 16,
                color: '#4a5568',
                margin: '0 0 2.5rem',
                lineHeight: 1.7,
              }}
            >
              Dive into the live global topology, trace packet routes through the mix
              network, and explore how privacy is preserved end-to-end.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/network"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 36px',
                  borderRadius: 10,
                  border: '1px solid #00d4ff',
                  color: '#00d4ff',
                  background: 'rgba(0, 212, 255, 0.07)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  fontFamily: 'var(--font-space-grotesk)',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 0 24px rgba(0,212,255,0.08)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = '#00d4ff'
                  el.style.color = '#050508'
                  el.style.boxShadow = '0 0 48px rgba(0,212,255,0.5)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.background = 'rgba(0, 212, 255, 0.07)'
                  el.style.color = '#00d4ff'
                  el.style.boxShadow = '0 0 24px rgba(0,212,255,0.08)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 1.5C8 1.5 5 4.5 5 8s3 6.5 3 6.5M8 1.5C8 1.5 11 4.5 11 8s-3 6.5-3 6.5M1.5 8h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Explore the Network
              </Link>

              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 36px',
                  borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.45)',
                  color: '#a78bfa',
                  background: 'rgba(124, 58, 237, 0.07)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  fontFamily: 'var(--font-space-grotesk)',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'rgba(124,58,237,0.8)'
                  el.style.background = 'rgba(124,58,237,0.15)'
                  el.style.boxShadow = '0 0 32px rgba(124,58,237,0.2)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'rgba(124,58,237,0.45)'
                  el.style.background = 'rgba(124, 58, 237, 0.07)'
                  el.style.boxShadow = 'none'
                }}
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(0,212,255,0.07)',
          padding: '2rem 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 11,
            color: '#2d3748',
            letterSpacing: '0.1em',
            margin: 0,
          }}
        >
          ZERO PROTOCOL · Next.js 15 · Three.js · Framer Motion · GSAP · Post-Quantum Ready
        </p>
      </footer>
    </main>
  )
}
