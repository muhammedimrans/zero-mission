'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, type Variants } from 'framer-motion'
import LiveBadge from '@/components/ui/LiveBadge'
import StatusBadge from '@/components/ui/StatusBadge'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SecurityEvent {
  id: number
  type: 'circuit' | 'dht' | 'node' | 'warn'
  message: string
  ts: string
}

interface HiddenService {
  hash: string
  status: 'online' | 'offline'
  circuits: number
  uptime: string
  introPoints: number
}

interface Circuit {
  id: string
  hops: ('guard' | 'mix' | 'exit')[]
  status: 'active' | 'building'
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MOCK_SERVICES: HiddenService[] = [
  { hash: 'a3f8c2d9e1b47056...', status: 'online', circuits: 12, uptime: '99.97%', introPoints: 3 },
  { hash: '7b1e4a6f2c893d05...', status: 'online', circuits: 8, uptime: '99.81%', introPoints: 6 },
  { hash: 'f2a9c5d1e8374b60...', status: 'offline', circuits: 0, uptime: '98.24%', introPoints: 0 },
  { hash: '4d7b0e3a9f261c85...', status: 'online', circuits: 5, uptime: '99.99%', introPoints: 3 },
  { hash: 'c1f6d4a2b87e3509...', status: 'online', circuits: 19, uptime: '99.43%', introPoints: 6 },
]

const MOCK_CIRCUITS: Circuit[] = [
  { id: 'a1b2c3d4e5f6...', hops: ['guard', 'mix', 'exit'], status: 'active' },
  { id: 'f9e8d7c6b5a4...', hops: ['guard', 'mix', 'exit'], status: 'active' },
  { id: '0a1b2c3d4e5f...', hops: ['guard', 'mix', 'exit'], status: 'building' },
  { id: '6f7e8d9c0a1b...', hops: ['guard', 'mix', 'exit'], status: 'active' },
  { id: '3c4d5e6f7a8b...', hops: ['guard', 'mix', 'exit'], status: 'active' },
]

const EVENT_POOL = [
  { type: 'circuit' as const, message: 'Circuit established via 3-hop path' },
  { type: 'dht' as const, message: 'DHT lookup successful (42ms)' },
  { type: 'node' as const, message: 'New guard node joined network' },
  { type: 'circuit' as const, message: 'Hidden service circuit rebuilt' },
  { type: 'dht' as const, message: 'Keyspace replication verified' },
  { type: 'warn' as const, message: 'Suspicious probe detected — dropped' },
  { type: 'node' as const, message: 'Exit node reputation updated: 0.97' },
  { type: 'circuit' as const, message: 'Circuit teardown after 10min TTL' },
  { type: 'dht' as const, message: 'Peer discovery: 12 new DHT peers' },
  { type: 'node' as const, message: 'Mix node bandwidth threshold reached' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return n.toLocaleString('en-US')
}

function nowTs(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function generateTrafficPoint(i: number, phase: number): number {
  const base = 50 + 30 * Math.sin((i / 20) * Math.PI + phase)
  const noise = (Math.random() - 0.5) * 15
  return Math.max(5, Math.min(95, base + noise))
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-2"
      style={{ color: 'rgba(0, 212, 255, 0.6)', fontFamily: 'var(--font-jetbrains-mono)' }}
    >
      {children}
    </p>
  )
}

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  color?: string
  children?: React.ReactNode
}

function MetricCard({ label, value, suffix = '', color = '#00d4ff', children }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: 'rgba(10, 10, 20, 0.9)',
        border: '1px solid rgba(0, 212, 255, 0.1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <CardLabel>{label}</CardLabel>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color, fontFamily: 'var(--font-jetbrains-mono)', textShadow: `0 0 20px ${color}55` }}
      >
        {formatNum(value)}{suffix}
      </p>
      {children}
    </div>
  )
}

// Gauge arc for network health
function GaugeArc({ percent }: { percent: number }) {
  const r = 28
  const cx = 36
  const cy = 36
  const circumference = Math.PI * r // half circle
  const filled = (percent / 100) * circumference
  return (
    <svg width="72" height="40" viewBox="0 0 72 40" className="mt-1">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="rgba(0,212,255,0.12)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#00ff88"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        style={{ filter: 'drop-shadow(0 0 6px #00ff88)' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#00ff88" fontSize="9" fontFamily="var(--font-jetbrains-mono)">
        {percent}%
      </text>
    </svg>
  )
}

// Animated bar for node status
function NodeBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth((count / max) * 100), 100)
    return () => clearTimeout(t)
  }, [count, max])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-jetbrains-mono)' }}>
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color, fontFamily: 'var(--font-jetbrains-mono)' }}>
          {formatNum(count)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  )
}

// Donut chart for DHT health
function DonutChart({ percent }: { percent: number }) {
  const r = 22
  const cx = 30
  const cy = 30
  const circumference = 2 * Math.PI * r
  const [dash, setDash] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDash((percent / 100) * circumference), 200)
    return () => clearTimeout(t)
  }, [percent, circumference])

  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="6" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={circumference / 4}
        style={{ transition: 'stroke-dasharray 1.2s ease-out', filter: 'drop-shadow(0 0 6px #00d4ff)' }}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#00d4ff" fontSize="8" fontFamily="var(--font-jetbrains-mono)">
        {percent}%
      </text>
    </svg>
  )
}

// Traffic line chart with two lines
function TrafficChart({
  inbound,
  outbound,
}: {
  inbound: number[]
  outbound: number[]
}) {
  const toPoints = (data: number[]) =>
    data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - v
        return `${x},${y}`
      })
      .join(' ')

  const toFill = (data: number[], color: string) => {
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - v
      return `${x},${y}`
    })
    return `${pts[0].split(',')[0]},100 ${pts.join(' ')} 100,100`
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill areas */}
      <polygon
        points={toFill(inbound, '#00d4ff')}
        fill="url(#inboundGrad)"
        style={{ transition: 'd 0.5s ease' }}
      />
      <polygon
        points={toFill(outbound, '#a855f7')}
        fill="url(#outboundGrad)"
        style={{ transition: 'd 0.5s ease' }}
      />
      {/* Lines */}
      <polyline
        points={toPoints(inbound)}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="0.8"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 2px #00d4ff)', transition: 'points 0.5s ease' }}
      />
      <polyline
        points={toPoints(outbound)}
        fill="none"
        stroke="#a855f7"
        strokeWidth="0.8"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 2px #a855f7)', transition: 'points 0.5s ease' }}
      />
    </svg>
  )
}

// World map dots — simplified SVG with major regions
function WorldMap() {
  const nodes = [
    { cx: 22, cy: 38, label: 'NA-W' },
    { cx: 30, cy: 35, label: 'NA-E' },
    { cx: 47, cy: 32, label: 'EU' },
    { cx: 52, cy: 36, label: 'EU-E' },
    { cx: 70, cy: 30, label: 'AS-NE' },
    { cx: 75, cy: 40, label: 'AS-SE' },
    { cx: 67, cy: 45, label: 'IN' },
    { cx: 35, cy: 55, label: 'SA' },
    { cx: 50, cy: 55, label: 'AF' },
    { cx: 82, cy: 58, label: 'AU' },
  ]

  return (
    <svg viewBox="0 0 100 65" className="w-full h-full" style={{ opacity: 0.85 }}>
      {/* Simplified continental outlines */}
      {/* North America */}
      <path
        d="M15,22 L18,18 L25,17 L32,20 L35,28 L33,38 L28,44 L22,42 L18,36 L15,28 Z"
        fill="rgba(0,212,255,0.04)"
        stroke="rgba(0,212,255,0.18)"
        strokeWidth="0.4"
      />
      {/* South America */}
      <path
        d="M28,45 L32,44 L36,48 L37,58 L33,62 L28,60 L26,52 Z"
        fill="rgba(0,212,255,0.04)"
        stroke="rgba(0,212,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Europe */}
      <path
        d="M43,18 L48,16 L55,18 L57,24 L54,28 L48,30 L43,27 L42,22 Z"
        fill="rgba(0,212,255,0.04)"
        stroke="rgba(0,212,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Africa */}
      <path
        d="M44,30 L52,28 L56,32 L56,46 L52,54 L47,54 L43,46 L42,36 Z"
        fill="rgba(0,212,255,0.04)"
        stroke="rgba(0,212,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Asia */}
      <path
        d="M57,14 L78,12 L84,18 L82,28 L75,34 L65,36 L57,32 L55,24 Z"
        fill="rgba(0,212,255,0.04)"
        stroke="rgba(0,212,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Australia */}
      <path
        d="M76,50 L84,48 L88,54 L86,60 L78,62 L74,57 Z"
        fill="rgba(0,212,255,0.04)"
        stroke="rgba(0,212,255,0.18)"
        strokeWidth="0.4"
      />

      {/* Node dots with pulse */}
      {nodes.map((n) => (
        <g key={n.label}>
          <circle
            cx={n.cx}
            cy={n.cy}
            r="2.5"
            fill="rgba(0,212,255,0.15)"
            stroke="rgba(0,212,255,0.4)"
            strokeWidth="0.3"
          >
            <animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite" begin={`${Math.random() * 2}s`} />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" begin={`${Math.random() * 2}s`} />
          </circle>
          <circle cx={n.cx} cy={n.cy} r="1" fill="#00d4ff" style={{ filter: 'drop-shadow(0 0 3px #00d4ff)' }} />
        </g>
      ))}
    </svg>
  )
}

// Event type icon
function EventIcon({ type }: { type: SecurityEvent['type'] }) {
  const glyphs: Record<SecurityEvent['type'], string> = {
    circuit: '⟳',
    dht: '◈',
    node: '◉',
    warn: '⚠',
  }
  const colors: Record<SecurityEvent['type'], string> = {
    circuit: '#00d4ff',
    dht: '#a855f7',
    node: '#00ff88',
    warn: '#f59e0b',
  }
  return (
    <span className="text-sm leading-none" style={{ color: colors[type] }}>
      {glyphs[type]}
    </span>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  // Clock
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Metric counters
  const [activeCircuits, setActiveCircuits] = useState(14293)
  const [packets, setPackets] = useState(892441)
  const [hiddenSvcs, setHiddenSvcs] = useState(1204)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveCircuits((v) => v + Math.floor((Math.random() - 0.5) * 100))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setPackets((v) => v + Math.floor((Math.random() - 0.5) * 10000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setHiddenSvcs((v) => v + Math.floor((Math.random() - 0.5) * 20))
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // Traffic chart data
  const phaseRef = useRef(0)
  const [inboundData, setInboundData] = useState<number[]>(() =>
    Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, 0))
  )
  const [outboundData, setOutboundData] = useState<number[]>(() =>
    Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, Math.PI))
  )

  useEffect(() => {
    const id = setInterval(() => {
      phaseRef.current += 0.1
      const p = phaseRef.current
      setInboundData((prev) => {
        const next = [...prev.slice(1), generateTrafficPoint(prev.length, p)]
        return next
      })
      setOutboundData((prev) => {
        const next = [...prev.slice(1), generateTrafficPoint(prev.length, p + Math.PI)]
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Security events feed
  const eventCounterRef = useRef(100)
  const [events, setEvents] = useState<SecurityEvent[]>(() => {
    const initial: SecurityEvent[] = []
    for (let i = 0; i < 8; i++) {
      const pool = EVENT_POOL[i % EVENT_POOL.length]
      initial.push({ id: i, type: pool.type, message: pool.message, ts: nowTs() })
    }
    return initial
  })

  const addEvent = useCallback(() => {
    const pool = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]
    const newEvent: SecurityEvent = {
      id: ++eventCounterRef.current,
      type: pool.type,
      message: pool.message,
      ts: nowTs(),
    }
    setEvents((prev) => [newEvent, ...prev.slice(0, 7)])
  }, [])

  useEffect(() => {
    const id = setInterval(addEvent, 2500)
    return () => clearInterval(id)
  }, [addEvent])

  // Stagger animation variants
  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  }
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
  }

  return (
    <div
      className="min-h-screen pt-16"
      style={{ background: '#050508' }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-16 z-40 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(5, 5, 8, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-sm sm:text-base font-bold uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              color: '#00d4ff',
              textShadow: '0 0 20px rgba(0,212,255,0.4)',
            }}
          >
            ZERO PROTOCOL OPERATIONS CENTER
          </h1>
          <LiveBadge />
        </div>
        <span
          className="text-sm tabular-nums"
          style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'rgba(0,212,255,0.7)' }}
        >
          {clock}
        </span>
      </div>

      {/* ── Grid ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto">
        <motion.div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Row 1: 4 metric cards ── */}

          {/* Network Health */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <CardLabel>Network Health</CardLabel>
            <p className="text-3xl font-bold" style={{ color: '#00ff88', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 20px #00ff8855' }}>
              98.7%
            </p>
            <GaugeArc percent={98.7} />
          </motion.div>

          {/* Active Circuits */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <MetricCard label="Active Circuits" value={activeCircuits} />
          </motion.div>

          {/* Packets/sec */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <MetricCard label="Packets / sec" value={packets} />
          </motion.div>

          {/* Hidden Services */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <MetricCard label="Hidden Services" value={hiddenSvcs} color="#a855f7" />
          </motion.div>

          {/* ── Row 2: Node Status + DHT Health + Traffic Chart ── */}

          {/* Node Status */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-4"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <CardLabel>Node Status</CardLabel>
            <NodeBar label="Guard" count={847} max={1400} color="#3b82f6" />
            <NodeBar label="Mix" count={1293} max={1400} color="#a855f7" />
            <NodeBar label="Exit" count={707} max={1400} color="#00ff88" />
            <div className="mt-1 pt-3 flex justify-between" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                Total
              </span>
              <span className="text-xs font-bold" style={{ color: '#00d4ff', fontFamily: 'var(--font-jetbrains-mono)' }}>
                2,847 nodes
              </span>
            </div>
          </motion.div>

          {/* DHT Health */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <CardLabel>DHT Health</CardLabel>
            <div className="flex items-center gap-4">
              <DonutChart percent={99} />
              <div className="flex flex-col gap-1.5">
                {[
                  ['Keyspace Coverage', '99.2%'],
                  ['Replication Factor', '8'],
                  ['Lookup Latency', '42ms'],
                  ['Peers', '2,847'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 items-center">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-jetbrains-mono)', whiteSpace: 'nowrap' }}>
                      {k}
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#00d4ff', fontFamily: 'var(--font-jetbrains-mono)' }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Traffic Chart */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 lg:col-span-6 rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center justify-between">
              <CardLabel>Traffic Metrics</CardLabel>
              <div className="flex items-center gap-4 mb-2">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#00d4ff', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  <span className="inline-block w-6 h-0.5" style={{ background: '#00d4ff' }} />
                  Inbound
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#a855f7', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  <span className="inline-block w-6 h-0.5" style={{ background: '#a855f7' }} />
                  Outbound
                </span>
              </div>
            </div>
            <div className="flex-1" style={{ height: '120px' }}>
              <TrafficChart inbound={inboundData} outbound={outboundData} />
            </div>
          </motion.div>

          {/* ── Row 3: Circuit Builder + World Map + Security Feed ── */}

          {/* Circuit Builder */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <CardLabel>Circuit Builder</CardLabel>
            <div className="flex flex-col gap-2">
              {MOCK_CIRCUITS.map((circuit, idx) => (
                <motion.div
                  key={circuit.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.35 }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.07)' }}
                >
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.05em' }}
                  >
                    {circuit.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {circuit.hops.map((hop, hi) => (
                      <span
                        key={hi}
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{
                          background: hop === 'guard' ? '#3b82f6' : hop === 'mix' ? '#a855f7' : '#00ff88',
                          boxShadow: `0 0 5px ${hop === 'guard' ? '#3b82f6' : hop === 'mix' ? '#a855f7' : '#00ff88'}`,
                        }}
                        title={hop}
                      />
                    ))}
                  </div>
                  <StatusBadge status={circuit.status} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Geographic Distribution */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <CardLabel>Geographic Distribution</CardLabel>
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: '140px' }}>
              <WorldMap />
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              <span>10 regions</span>
              <span style={{ color: '#00d4ff' }}>2,847 nodes active</span>
            </div>
          </motion.div>

          {/* Security Events Feed */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <CardLabel>Security Events</CardLabel>
            <div
              className="flex flex-col gap-1.5 overflow-hidden"
              style={{ maxHeight: '210px' }}
            >
              {events.map((ev, idx) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-2 px-2.5 py-2 rounded-lg flex-shrink-0"
                  style={{
                    background: idx === 0 ? 'rgba(0,212,255,0.04)' : 'transparent',
                    border: idx === 0 ? '1px solid rgba(0,212,255,0.08)' : '1px solid transparent',
                  }}
                >
                  <EventIcon type={ev.type} />
                  <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-jetbrains-mono)', lineHeight: '1.4' }}>
                    {ev.message}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(0,212,255,0.4)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {ev.ts}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Row 4: Hidden Services Table ── */}
          <motion.div
            variants={cardVariants}
            className="col-span-12 rounded-xl p-4 flex flex-col gap-4"
            style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <CardLabel>Hidden Services Status</CardLabel>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ fontFamily: 'var(--font-jetbrains-mono)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                    {['Service Hash', 'Status', 'Circuits', 'Uptime', 'Intro Points'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 font-semibold uppercase tracking-widest"
                        style={{ color: 'rgba(0,212,255,0.5)', fontSize: '10px' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SERVICES.map((svc, idx) => (
                    <motion.tr
                      key={svc.hash}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1, duration: 0.35 }}
                      className="group cursor-default transition-colors duration-150"
                      style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,212,255,0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <td className="py-3 px-3" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                        {svc.hash}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={svc.status} />
                      </td>
                      <td className="py-3 px-3" style={{ color: '#00d4ff' }}>
                        {svc.circuits}
                      </td>
                      <td className="py-3 px-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {svc.uptime}
                      </td>
                      <td className="py-3 px-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {svc.introPoints}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
