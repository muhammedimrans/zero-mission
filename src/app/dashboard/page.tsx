'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, type Variants } from 'framer-motion'
import LiveBadge from '@/components/ui/LiveBadge'
import StatusBadge from '@/components/ui/StatusBadge'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SecurityEvent {
  id: number
  type: 'circuit' | 'dht' | 'node' | 'warn' | 'pq' | 'rep' | 'hs'
  message: string
  ts: string
}

interface HiddenService {
  hash: string
  status: 'online' | 'offline'
  circuits: number
  uptime: string
  introPoints: number
  vanguardLayer: string
}

interface Circuit {
  id: string
  hops: ('guard' | 'mix' | 'exit')[]
  status: 'active' | 'building'
  level: 'L2' | 'L3' | 'L4'
}

// ─── Constants from README / Zero Protocol source ────────────────────────────

const MOCK_SERVICES: HiddenService[] = [
  { hash: 'a3f8c2d9e1b47056...', status: 'online',  circuits: 12, uptime: '99.97%', introPoints: 3, vanguardLayer: 'L2+L3' },
  { hash: '7b1e4a6f2c893d05...', status: 'online',  circuits: 8,  uptime: '99.81%', introPoints: 3, vanguardLayer: 'L2+L3' },
  { hash: 'f2a9c5d1e8374b60...', status: 'offline', circuits: 0,  uptime: '98.24%', introPoints: 0, vanguardLayer: '—' },
  { hash: '4d7b0e3a9f261c85...', status: 'online',  circuits: 5,  uptime: '99.99%', introPoints: 3, vanguardLayer: 'L2+L3' },
  { hash: 'c1f6d4a2b87e3509...', status: 'online',  circuits: 19, uptime: '99.43%', introPoints: 3, vanguardLayer: 'L2+L3' },
]

const MOCK_CIRCUITS: Circuit[] = [
  { id: 'a1b2c3d4e5f6...', hops: ['guard', 'mix', 'exit'], status: 'active',   level: 'L3' },
  { id: 'f9e8d7c6b5a4...', hops: ['guard', 'mix', 'exit'], status: 'active',   level: 'L3' },
  { id: '0a1b2c3d4e5f...', hops: ['guard', 'mix', 'exit'], status: 'building', level: 'L3' },
  { id: '6f7e8d9c0a1b...', hops: ['guard', 'mix', 'exit'], status: 'active',   level: 'L2' },
  { id: '3c4d5e6f7a8b...', hops: ['guard', 'mix', 'exit'], status: 'active',   level: 'L4' },
]

const EVENT_POOL = [
  { type: 'circuit' as const, message: 'L3 circuit established via 4-hop Sphinx path (Guard→Mix1→Mix2→Exit)' },
  { type: 'dht'     as const, message: 'DHT lookup successful — 42ms, replication K=16' },
  { type: 'node'    as const, message: 'Guard node joined: 89.167.84.13:9001 (rep=25.0)' },
  { type: 'pq'      as const, message: 'PQ Sphinx V2 handshake: ML-KEM-768 + X25519 hybrid OK' },
  { type: 'circuit' as const, message: 'Hidden service circuit rebuilt (HS_CIRCUIT_ROTATION_SECS=86400)' },
  { type: 'dht'     as const, message: 'Keyspace replication verified: 99.2% coverage' },
  { type: 'warn'    as const, message: 'Suspicious probe detected — replay window rejected packet' },
  { type: 'rep'     as const, message: 'Exit node reputation updated: +1.0 (DELTA_CIRCUIT_OK)' },
  { type: 'circuit' as const, message: 'Circuit teardown after TTL expiry' },
  { type: 'dht'     as const, message: 'Peer discovery: 12 new DHT peers via gossip fanout=3' },
  { type: 'node'    as const, message: 'Mix node bandwidth threshold reached: relay_bytes_out hit' },
  { type: 'pq'      as const, message: 'Trial decapsulation: pq_trial_decap_total +1' },
  { type: 'hs'      as const, message: 'INTRODUCE2 rate-limit: 5/min circuit gate triggered' },
  { type: 'rep'     as const, message: 'Node blacklisted: score fell below SCORE_BLACKLIST=10.0' },
  { type: 'circuit' as const, message: 'Cover traffic burst: RELAY_COVER=0x07, Poisson λ=40ms' },
  { type: 'hs'      as const, message: 'RENDEZVOUS2 cookie matched — circuit splice complete' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string { return n.toLocaleString('en-US') }
function nowTs(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}
function randRange(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min))
}
function generateTrafficPoint(i: number, phase: number): number {
  const base = 50 + 30 * Math.sin((i / 20) * Math.PI + phase)
  return Math.max(5, Math.min(95, base + (Math.random() - 0.5) * 15))
}
function generateTrafficPointSSR(i: number, phase: number): number {
  return Math.max(5, Math.min(95, 50 + 30 * Math.sin((i / 20) * Math.PI + phase)))
}

const CARD_STYLE = {
  background: 'linear-gradient(180deg, rgba(15,18,22,0.92) 0%, rgba(15,18,22,0.5) 100%)',
  border: '1px solid rgba(139,148,158,0.18)',
} as const

// ─── Subcomponents ───────────────────────────────────────────────────────────

function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="label-caps text-[10px] text-text-muted mb-2">{children}</p>
}

function NodeBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setWidth((count / max) * 100), 100); return () => clearTimeout(t) }, [count, max])
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color, fontFamily: 'var(--font-jetbrains-mono)' }}>{fmt(count)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  )
}

function GaugeArc({ percent, color = '#34d399' }: { percent: number; color?: string }) {
  const r = 28, cx = 36, cy = 36, circumference = Math.PI * r
  const filled = (percent / 100) * circumference
  return (
    <svg width="72" height="40" viewBox="0 0 72 40" className="mt-1">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(139,148,158,0.18)" strokeWidth="5" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="9" fontFamily="var(--font-jetbrains-mono)">{percent}%</text>
    </svg>
  )
}

function DonutChart({ percent, color = 'var(--primary)' }: { percent: number; color?: string }) {
  const r = 22, cx = 30, cy = 30, circumference = 2 * Math.PI * r
  const [dash, setDash] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDash((percent / 100) * circumference), 200); return () => clearTimeout(t) }, [percent, circumference])
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(139,148,158,0.18)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`} strokeDashoffset={circumference / 4}
        style={{ transition: 'stroke-dasharray 1.2s ease-out', filter: `drop-shadow(0 0 6px ${color}88)` }} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="8" fontFamily="var(--font-jetbrains-mono)">{percent}%</text>
    </svg>
  )
}

function TrafficChart({ inbound, outbound }: { inbound: number[]; outbound: number[] }) {
  const toPoints = (data: number[]) => data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - v}`).join(' ')
  const toFill = (data: number[]) => {
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - v}`)
    return `${pts[0].split(',')[0]},100 ${pts.join(' ')} 100,100`
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6effc7" stopOpacity="0.25" /><stop offset="100%" stopColor="#6effc7" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" /><stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={toFill(inbound)} fill="url(#inboundGrad)" />
      <polygon points={toFill(outbound)} fill="url(#outboundGrad)" />
      <polyline points={toPoints(inbound)} fill="none" stroke="#6effc7" strokeWidth="0.8" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 2px rgba(110,255,199,0.6))' }} />
      <polyline points={toPoints(outbound)} fill="none" stroke="#a855f7" strokeWidth="0.8" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 2px #a855f7)' }} />
    </svg>
  )
}

function WorldMap() {
  const nodes = [
    { cx: 22, cy: 38, label: 'NA-W' }, { cx: 30, cy: 35, label: 'NA-E' },
    { cx: 47, cy: 32, label: 'EU' },   { cx: 52, cy: 36, label: 'EU-E' },
    { cx: 70, cy: 30, label: 'AS-NE' },{ cx: 75, cy: 40, label: 'AS-SE' },
    { cx: 67, cy: 45, label: 'IN' },   { cx: 35, cy: 55, label: 'SA' },
    { cx: 50, cy: 55, label: 'AF' },   { cx: 82, cy: 58, label: 'AU' },
  ]
  return (
    <svg viewBox="0 0 100 65" className="w-full h-full" style={{ opacity: 0.85 }}>
      <path d="M15,22 L18,18 L25,17 L32,20 L35,28 L33,38 L28,44 L22,42 L18,36 L15,28 Z" fill="rgba(139,148,158,0.04)" stroke="rgba(139,148,158,0.18)" strokeWidth="0.4" />
      <path d="M28,45 L32,44 L36,48 L37,58 L33,62 L28,60 L26,52 Z" fill="rgba(139,148,158,0.04)" stroke="rgba(139,148,158,0.18)" strokeWidth="0.4" />
      <path d="M43,18 L48,16 L55,18 L57,24 L54,28 L48,30 L43,27 L42,22 Z" fill="rgba(139,148,158,0.04)" stroke="rgba(139,148,158,0.18)" strokeWidth="0.4" />
      <path d="M44,30 L52,28 L56,32 L56,46 L52,54 L47,54 L43,46 L42,36 Z" fill="rgba(139,148,158,0.04)" stroke="rgba(139,148,158,0.18)" strokeWidth="0.4" />
      <path d="M57,14 L78,12 L84,18 L82,28 L75,34 L65,36 L57,32 L55,24 Z" fill="rgba(139,148,158,0.04)" stroke="rgba(139,148,158,0.18)" strokeWidth="0.4" />
      <path d="M76,50 L84,48 L88,54 L86,60 L78,62 L74,57 Z" fill="rgba(139,148,158,0.04)" stroke="rgba(139,148,158,0.18)" strokeWidth="0.4" />
      {nodes.map((n, i) => (
        <g key={n.label}>
          <circle cx={n.cx} cy={n.cy} r="2.5" fill="rgba(110,255,199,0.15)" stroke="rgba(110,255,199,0.4)" strokeWidth="0.3">
            <animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite" begin={`${((i * 0.2) % 2).toFixed(1)}s`} />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" begin={`${((i * 0.2) % 2).toFixed(1)}s`} />
          </circle>
          <circle cx={n.cx} cy={n.cy} r="1" fill="#6effc7" style={{ filter: 'drop-shadow(0 0 3px rgba(110,255,199,0.6))' }} />
        </g>
      ))}
    </svg>
  )
}

function EventIcon({ type }: { type: SecurityEvent['type'] }) {
  const glyphs: Record<SecurityEvent['type'], string> = { circuit: '⟳', dht: '◈', node: '◉', warn: '⚠', pq: '⬡', rep: '★', hs: '◐' }
  const colors: Record<SecurityEvent['type'], string> = {
    circuit: 'var(--primary)', dht: '#a855f7', node: '#34d399', warn: '#f59e0b',
    pq: '#38bdf8', rep: '#fbbf24', hs: '#f472b6',
  }
  return <span className="text-sm leading-none" style={{ color: colors[type] }}>{glyphs[type]}</span>
}

// Privacy level pie segments (L1/L2/L3/L4)
function PrivacyPie({ l1, l2, l3, l4 }: { l1: number; l2: number; l3: number; l4: number }) {
  const total = l1 + l2 + l3 + l4
  const toArc = (start: number, end: number, r: number, cx: number, cy: number) => {
    const a0 = (start / total) * Math.PI * 2 - Math.PI / 2
    const a1 = (end / total) * Math.PI * 2 - Math.PI / 2
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const large = (end - start) / total > 0.5 ? 1 : 0
    return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
  }
  const cx = 32, cy = 32, r = 28
  let acc = 0
  const segs = [
    { val: l1, color: '#64748b', label: 'L1' }, { val: l2, color: '#3b82f6', label: 'L2' },
    { val: l3, color: '#6effc7', label: 'L3' }, { val: l4, color: '#a855f7', label: 'L4' },
  ]
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      {segs.map((s) => {
        const start = acc; acc += s.val
        if (s.val === 0) return null
        return (
          <path key={s.label} d={toArc(start, acc, r, cx, cy)} fill={s.color}
            style={{ filter: `drop-shadow(0 0 4px ${s.color}66)` }} />
        )
      })}
      <circle cx={cx} cy={cy} r="14" fill="var(--background)" />
    </svg>
  )
}

// Reputation score histogram
function RepHistogram({ scores }: { scores: number[] }) {
  const buckets = Array(10).fill(0)
  scores.forEach((s) => { const b = Math.min(9, Math.floor(s / 10)); buckets[b]++ })
  const max = Math.max(...buckets, 1)
  const colors = ['#f87171','#f87171','#fbbf24','#fbbf24','#a3a3a3','#a3a3a3','#34d399','#34d399','#6effc7','#6effc7']
  return (
    <svg viewBox={`0 0 ${10 * 9 + 9} 40`} className="w-full" style={{ height: 40 }}>
      {buckets.map((b, i) => {
        const h = Math.max(3, (b / max) * 36)
        return (
          <rect key={i} x={i * 10} y={40 - h} width="8" height={h} rx="1" fill={colors[i]}
            style={{ filter: `drop-shadow(0 0 3px ${colors[i]}66)` }} />
        )
      })}
    </svg>
  )
}

// Sphinx constants strip
const SPHINX_CONSTANTS = [
  { label: 'HEADER_LEN', value: '576 B' },
  { label: 'SPHINX_LEN', value: '1600 B' },
  { label: 'PAYLOAD_LEN', value: '1024 B' },
  { label: 'BETA_LEN',   value: '512 B' },
  { label: 'MAX_HOPS',   value: '4' },
  { label: 'MAC_LEN',    value: '32 B' },
]

// Seed node status
const SEED_NODES = [
  { role: 'Guard', addr: '89.167.84.13:9001',    status: 'online' as const },
  { role: 'Mix 1', addr: '204.168.177.167:9002', status: 'online' as const },
  { role: 'Mix 2', addr: '204.168.174.147:9003', status: 'online' as const },
  { role: 'Exit',  addr: '204.168.195.49:9004',  status: 'online' as const },
]

const ROLE_COLOR: Record<string, string> = { Guard: '#38bdf8', 'Mix 1': '#818cf8', 'Mix 2': '#a855f7', Exit: '#34d399' }

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  // Core metrics
  const [activeCircuits, setActiveCircuits] = useState(14293)
  const [packets, setPackets]               = useState(892441)
  const [hiddenSvcs, setHiddenSvcs]         = useState(1204)
  const [relayCells, setRelayCells]         = useState(3847293)
  const [pqBuilt, setPqBuilt]               = useState(28441)
  const [pqFail, setPqFail]                 = useState(12)
  const [pqTrialDecap, setPqTrialDecap]     = useState(7329)
  const [mixBytes, setMixBytes]             = useState(1240483840)  // ~1.2 GB
  const [exitBytes, setExitBytes]           = useState(834288640)   // ~0.8 GB
  const [earnedUnits, setEarnedUnits]       = useState(14830)
  const [replayHits, setReplayHits]         = useState(47)

  useEffect(() => { const id = setInterval(() => setActiveCircuits((v) => v + randRange(-50, 100)), 3000); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setPackets((v) => Math.max(0, v + randRange(-5000, 10000))), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setHiddenSvcs((v) => v + randRange(-5, 10)), 5000); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setRelayCells((v) => v + randRange(50, 250)), 500); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setPqBuilt((v) => v + randRange(0, 3)), 2000); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setPqTrialDecap((v) => v + randRange(0, 2)), 3000); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setMixBytes((v) => v + randRange(100000, 500000)), 2000); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setExitBytes((v) => v + randRange(50000, 300000)), 2000); return () => clearInterval(id) }, [])
  useEffect(() => { const id = setInterval(() => setEarnedUnits((v) => v + randRange(0, 2)), 5000); return () => clearInterval(id) }, [])

  // Rep scores (mock distribution centered around 50-80)
  const repScores = [12, 18, 25, 34, 41, 52, 58, 64, 71, 76, 80, 85, 87, 91, 93, 95, 97, 99, 100, 100,
    45, 62, 73, 88, 55, 79, 68, 82, 90, 75, 61, 48, 37, 24, 15, 83, 96, 70, 66, 78]

  // Traffic chart
  const phaseRef = useRef(0)
  const [inboundData, setInboundData]   = useState<number[]>(() => Array.from({ length: 60 }, (_, i) => generateTrafficPointSSR(i, 0)))
  const [outboundData, setOutboundData] = useState<number[]>(() => Array.from({ length: 60 }, (_, i) => generateTrafficPointSSR(i, Math.PI)))
  useEffect(() => {
    setInboundData(Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, 0)))
    setOutboundData(Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, Math.PI)))
    const id = setInterval(() => {
      phaseRef.current += 0.1
      const p = phaseRef.current
      setInboundData((prev) => [...prev.slice(1), generateTrafficPoint(prev.length, p)])
      setOutboundData((prev) => [...prev.slice(1), generateTrafficPoint(prev.length, p + Math.PI)])
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Security events
  const evCounter = useRef(100)
  const [events, setEvents] = useState<SecurityEvent[]>(() =>
    EVENT_POOL.slice(0, 8).map((e, i) => ({ id: i, ...e, ts: '' }))
  )
  useEffect(() => {
    setEvents((prev) => prev.map((e) => (e.ts === '' ? { ...e, ts: nowTs() } : e)))
  }, [])
  const addEvent = useCallback(() => {
    const pool = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]
    setEvents((prev) => [{ id: ++evCounter.current, ...pool, ts: nowTs() }, ...prev.slice(0, 7)])
  }, [])
  useEffect(() => { const id = setInterval(addEvent, 2200); return () => clearInterval(id) }, [addEvent])

  const containerVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
  const cardVariants: Variants = {
    hidden:   { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }

  const fmtBytes = (b: number) => b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${(b / 1e6).toFixed(1)} MB`

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,9,10,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(139,148,158,0.18)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-sm sm:text-base font-bold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--primary)', textShadow: '0 0 20px rgba(110,255,199,0.4)' }}>
            Zero Protocol — Operations Center
          </h1>
          <LiveBadge />
          <span className="hidden sm:inline label-caps text-[9px] text-text-muted border border-border px-2 py-0.5 rounded">
            v0.1.0-alpha.1
          </span>
        </div>
        <span className="text-sm tabular-nums" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
          {clock}
        </span>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto">
        <motion.div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
          variants={containerVariants} initial="hidden" animate="visible">

          {/* ── Row 1: Core metrics (6 cards) ── */}

          {/* Network Health */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-xl p-4" style={CARD_STYLE}>
            <CardLabel>Network Health</CardLabel>
            <p className="text-3xl font-bold" style={{ color: '#34d399', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 20px #34d39955' }}>98.7%</p>
            <GaugeArc percent={98.7} />
          </motion.div>

          {/* Active Circuits */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-xl p-4 flex flex-col gap-1" style={CARD_STYLE}>
            <CardLabel>Active Circuits</CardLabel>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--primary)', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 20px rgba(110,255,199,0.3)' }}>
              {fmt(activeCircuits)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>L3: 3 parallel circuits/client</p>
          </motion.div>

          {/* Packets / sec */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-xl p-4 flex flex-col gap-1" style={CARD_STYLE}>
            <CardLabel>Packets / sec</CardLabel>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--primary)', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 20px rgba(110,255,199,0.3)' }}>
              {fmt(packets)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>+cover traffic λ=40ms</p>
          </motion.div>

          {/* Hidden Services */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-xl p-4 flex flex-col gap-1" style={CARD_STYLE}>
            <CardLabel>Hidden Services</CardLabel>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#a855f7', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 20px #a855f755' }}>
              {fmt(hiddenSvcs)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>MAX_INTRO_CIRCUITS=3</p>
          </motion.div>

          {/* Relay Cells Forwarded */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-xl p-4 flex flex-col gap-1" style={CARD_STYLE}>
            <CardLabel>Cells Forwarded</CardLabel>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#38bdf8', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 20px #38bdf855' }}>
              {fmt(relayCells)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>relay_cells_forwarded_total</p>
          </motion.div>

          {/* Replay Window */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-xl p-4 flex flex-col gap-1" style={CARD_STYLE}>
            <CardLabel>Replay Window</CardLabel>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#f59e0b', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 20px #f59e0b55' }}>
              {fmt(replayHits)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>WINDOW_SIZE=65,536</p>
          </motion.div>

          {/* ── Row 2: Node Status + DHT + Traffic Chart ── */}

          {/* Node Status */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-4" style={CARD_STYLE}>
            <CardLabel>Node Status</CardLabel>
            <NodeBar label="Guard" count={847} max={1400} color="#3b82f6" />
            <NodeBar label="Mix 1" count={723} max={1400} color="#818cf8" />
            <NodeBar label="Mix 2" count={570} max={1400} color="#a855f7" />
            <NodeBar label="Exit"  count={707} max={1400} color="#34d399" />
            <div className="mt-1 pt-3 flex justify-between" style={{ borderTop: '1px solid rgba(139,148,158,0.12)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>Total</span>
              <span className="text-xs font-bold" style={{ color: 'var(--primary)', fontFamily: 'var(--font-jetbrains-mono)' }}>2,847 nodes</span>
            </div>
          </motion.div>

          {/* DHT Health */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>DHT Health</CardLabel>
            <div className="flex items-center gap-4">
              <DonutChart percent={99} />
              <div className="flex flex-col gap-1.5 flex-1">
                {[
                  ['Keyspace Coverage', '99.2%'],
                  ['K-bucket size (K)', '8'],
                  ['Parallel α lookups', '3'],
                  ['Lookup Latency',    '42ms'],
                  ['REPLICATION_K',     '16'],
                  ['MIN_NODES',         '3'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 items-center">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)', whiteSpace: 'nowrap' }}>{k}</span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--primary)', fontFamily: 'var(--font-jetbrains-mono)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Traffic Chart */}
          <motion.div variants={cardVariants} className="col-span-12 lg:col-span-6 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <div className="flex items-center justify-between">
              <CardLabel>Traffic Metrics (Sphinx SPHINX_LEN=1600B / cell)</CardLabel>
              <div className="flex items-center gap-4 mb-2">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--primary)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  <span className="inline-block w-6 h-0.5" style={{ background: 'var(--primary)' }} /> Inbound
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#a855f7', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  <span className="inline-block w-6 h-0.5" style={{ background: '#a855f7' }} /> Outbound
                </span>
              </div>
            </div>
            <div className="flex-1" style={{ height: '120px' }}>
              <TrafficChart inbound={inboundData} outbound={outboundData} />
            </div>
          </motion.div>

          {/* ── Row 3: PQ Sphinx + Reputation + Privacy Level + Bandwidth ── */}

          {/* PQ Sphinx Metrics */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>PQ Sphinx V2 Metrics</CardLabel>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>pq_build_success</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: '#38bdf8', fontFamily: 'var(--font-jetbrains-mono)' }}>{fmt(pqBuilt)}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>pq_build_fail</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: '#f87171', fontFamily: 'var(--font-jetbrains-mono)' }}>{pqFail}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>pq_trial_decap_total</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: '#a855f7', fontFamily: 'var(--font-jetbrains-mono)' }}>{fmt(pqTrialDecap)}</span>
              </div>
              <div className="mt-1 pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(139,148,158,0.12)' }}>
                {[['KEM', 'ML-KEM-768'], ['EK size', '1184 B'], ['CT size', '1088 B'], ['SS', '32 B']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{k}</span>
                    <span className="text-[10px] font-bold" style={{ color: '#38bdf8', fontFamily: 'var(--font-jetbrains-mono)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Reputation Distribution */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Reputation Distribution</CardLabel>
            <RepHistogram scores={repScores} />
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                ['SCORE_INITIAL',   '25.0', '#6effc7'],
                ['SCORE_MAX',       '100.0','#6effc7'],
                ['SCORE_BLACKLIST', '10.0', '#f87171'],
                ['DECAY_TARGET',    '50.0', '#fbbf24'],
                ['DECAY_RATE',      '0.02', '#a855f7'],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{k}</span>
                  <span className="text-[10px] font-bold" style={{ color: c as string, fontFamily: 'var(--font-jetbrains-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Privacy Level Distribution */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Privacy Level Distribution</CardLabel>
            <div className="flex items-center gap-4">
              <PrivacyPie l1={820} l2={3240} l3={7890} l4={2343} />
              <div className="flex flex-col gap-2 flex-1">
                {[
                  { label: 'L1 Direct', count: 820,  pct: '6%',  color: '#64748b', hops: '1 hop' },
                  { label: 'L2 VPN',    count: 3240, pct: '22%', color: '#3b82f6', hops: '3 hops' },
                  { label: 'L3 Mix',    count: 7890, pct: '54%', color: '#6effc7', hops: '4 hops' },
                  { label: 'L4 Full',   count: 2343, pct: '18%', color: '#a855f7', hops: '4 hops' },
                ].map((l) => (
                  <div key={l.label} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jetbrains-mono)' }}>{l.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{l.hops}</span>
                      <span className="text-[10px] font-bold" style={{ color: l.color, fontFamily: 'var(--font-jetbrains-mono)' }}>{l.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(139,148,158,0.12)' }}>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>Max mix delay L3</span>
                <span className="text-[10px] font-bold" style={{ color: '#6effc7', fontFamily: 'var(--font-jetbrains-mono)' }}>50 ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>Max mix delay L4</span>
                <span className="text-[10px] font-bold" style={{ color: '#a855f7', fontFamily: 'var(--font-jetbrains-mono)' }}>400 ms</span>
              </div>
            </div>
          </motion.div>

          {/* Bandwidth Accounting */}
          <motion.div variants={cardVariants} className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Bandwidth Accounting</CardLabel>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>mix_bytes_relayed</span>
                <span className="text-sm font-bold" style={{ color: '#818cf8', fontFamily: 'var(--font-jetbrains-mono)' }}>{fmtBytes(mixBytes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>exit_bytes_forwarded</span>
                <span className="text-sm font-bold" style={{ color: '#34d399', fontFamily: 'var(--font-jetbrains-mono)' }}>{fmtBytes(exitBytes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>guard_bytes (excluded)</span>
                <span className="text-sm font-bold" style={{ color: '#64748b', fontFamily: 'var(--font-jetbrains-mono)' }}>—</span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-1.5" style={{ borderTop: '1px solid rgba(139,148,158,0.12)' }}>
              <div className="flex justify-between items-center">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>earned_units</span>
                <span className="text-sm font-bold" style={{ color: 'var(--primary)', fontFamily: 'var(--font-jetbrains-mono)', textShadow: '0 0 12px rgba(110,255,199,0.4)' }}>{fmt(earnedUnits)}</span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {[['1 unit / MB relayed',''],['10 units / circuit',''],['100 units / hr uptime',''],['50 units / HS conn','']].map(([l]) => (
                  <p key={l} className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>· {l}</p>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Row 4: Circuit Builder + World Map + Security Feed ── */}

          {/* Circuit Builder */}
          <motion.div variants={cardVariants} className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Active Circuits (sample)</CardLabel>
            <div className="flex flex-col gap-2">
              {MOCK_CIRCUITS.map((circuit, idx) => (
                <motion.div key={circuit.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.35 }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(139,148,158,0.04)', border: '1px solid rgba(139,148,158,0.1)' }}>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.05em' }}>
                    {circuit.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {circuit.hops.map((hop, hi) => (
                      <span key={hi} className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: hop === 'guard' ? '#3b82f6' : hop === 'mix' ? '#a855f7' : '#34d399', boxShadow: `0 0 5px ${hop === 'guard' ? '#3b82f6' : hop === 'mix' ? '#a855f7' : '#34d399'}` }}
                        title={hop} />
                    ))}
                  </div>
                  <span className="label-caps text-[9px] px-1.5 py-0.5 rounded" style={{
                    color: circuit.level === 'L4' ? '#a855f7' : circuit.level === 'L3' ? 'var(--primary)' : '#3b82f6',
                    border: `1px solid ${circuit.level === 'L4' ? '#a855f744' : circuit.level === 'L3' ? 'rgba(110,255,199,0.3)' : '#3b82f644'}`,
                    background: circuit.level === 'L4' ? 'rgba(168,85,247,0.08)' : circuit.level === 'L3' ? 'rgba(110,255,199,0.06)' : 'rgba(59,130,246,0.08)',
                  }}>{circuit.level}</span>
                  <StatusBadge status={circuit.status} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Geographic Distribution */}
          <motion.div variants={cardVariants} className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Geographic Distribution</CardLabel>
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: '140px' }}>
              <WorldMap />
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              <span>10 regions active</span>
              <span style={{ color: 'var(--primary)' }}>2,847 nodes</span>
            </div>
          </motion.div>

          {/* Security Events Feed */}
          <motion.div variants={cardVariants} className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Security Events</CardLabel>
            <div className="flex flex-col gap-1.5 overflow-hidden" style={{ maxHeight: '220px' }}>
              {events.map((ev, idx) => (
                <motion.div key={ev.id} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className="flex items-start gap-2 px-2.5 py-2 rounded-lg flex-shrink-0"
                  style={{ background: idx === 0 ? 'rgba(110,255,199,0.04)' : 'transparent', border: idx === 0 ? '1px solid rgba(110,255,199,0.12)' : '1px solid transparent' }}>
                  <EventIcon type={ev.type} />
                  <span className="text-xs flex-1 leading-snug" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {ev.message}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{ev.ts}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Row 5: Sphinx Constants + Seed Nodes + Vanguard ── */}

          {/* Sphinx Constants */}
          <motion.div variants={cardVariants} className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Sphinx Wire Constants (sphinx.rs)</CardLabel>
            <div className="grid grid-cols-2 gap-2">
              {SPHINX_CONSTANTS.map((c) => (
                <div key={c.label} className="flex flex-col gap-0.5 p-2 rounded" style={{ background: 'rgba(139,148,158,0.04)', border: '1px solid rgba(139,148,158,0.1)' }}>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{c.label}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--primary)', fontFamily: 'var(--font-jetbrains-mono)' }}>{c.value}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(139,148,158,0.12)' }}>
              <p className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                ALPHA(32) + GAMMA(32) + BETA(512) + PAYLOAD(1024) = 1600 B
              </p>
              <p className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                PQ V2: + pq_cts array (4×1088 B) = 4929 B header
              </p>
            </div>
          </motion.div>

          {/* Seed Node Status */}
          <motion.div variants={cardVariants} className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Seed Nodes (config.rs)</CardLabel>
            <div className="flex flex-col gap-2">
              {SEED_NODES.map((node) => (
                <div key={node.addr} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(139,148,158,0.04)', border: '1px solid rgba(139,148,158,0.1)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[node.role], boxShadow: `0 0 5px ${ROLE_COLOR[node.role]}` }} />
                    <span className="text-xs font-bold" style={{ color: ROLE_COLOR[node.role], fontFamily: 'var(--font-jetbrains-mono)' }}>{node.role}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{node.addr}</span>
                  <StatusBadge status={node.status} />
                </div>
              ))}
            </div>
            <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              All UDP-only · STUN: stun.l.google.com:19302 · keepalive=4s
            </p>
          </motion.div>

          {/* Vanguard Protection */}
          <motion.div variants={cardVariants} className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <CardLabel>Vanguard Protection (hs_vanguard.rs)</CardLabel>
            <div className="flex flex-col gap-3">
              {[
                { layer: 'L2 Vanguards', count: 4, rotation: '1–3 days', minRep: '25.0', color: '#38bdf8' },
                { layer: 'L3 Vanguards', count: 8, rotation: '1–7 days', minRep: '25.0', color: '#818cf8' },
              ].map((v) => (
                <div key={v.layer} className="p-3 rounded-lg flex flex-col gap-2" style={{ background: `${v.color}08`, border: `1px solid ${v.color}22` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ color: v.color, fontFamily: 'var(--font-jetbrains-mono)' }}>{v.layer}</span>
                    <span className="text-lg font-bold" style={{ color: v.color, fontFamily: 'var(--font-jetbrains-mono)', textShadow: `0 0 12px ${v.color}55` }}>{v.count} nodes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>Rotation</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jetbrains-mono)' }}>{v.rotation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>Min rep score</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jetbrains-mono)' }}>{v.minRep}</span>
                  </div>
                </div>
              ))}
              <p className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                Circuit: Service→Guard→L2 Vanguard→L3 Vanguard→Intro/RP
              </p>
            </div>
          </motion.div>

          {/* ── Row 6: Hidden Services Table ── */}
          <motion.div variants={cardVariants} className="col-span-12 rounded-xl p-4 flex flex-col gap-4" style={CARD_STYLE}>
            <CardLabel>Hidden Services Status (zero_dns.rs — Descriptor v3)</CardLabel>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ fontFamily: 'var(--font-jetbrains-mono)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(139,148,158,0.18)' }}>
                    {['Service Hash', 'Status', 'Circuits', 'Uptime', 'Intro Points', 'Vanguard'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 label-caps text-[10px] text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SERVICES.map((svc, idx) => (
                    <motion.tr key={svc.hash} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1, duration: 0.35 }}
                      className="cursor-default transition-colors duration-150"
                      style={{ borderBottom: '1px solid rgba(139,148,158,0.08)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                      <td className="py-3 px-3" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{svc.hash}</td>
                      <td className="py-3 px-3"><StatusBadge status={svc.status} /></td>
                      <td className="py-3 px-3" style={{ color: 'var(--primary)' }}>{svc.circuits}</td>
                      <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>{svc.uptime}</td>
                      <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>{svc.introPoints}</td>
                      <td className="py-3 px-3">
                        <span className="label-caps text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.08)' }}>
                          {svc.vanguardLayer}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              Descriptor v3 · nonce=16B CSPRNG · freshness=7200s · lifetime=14400s · INTRODUCE2 rate-limit=5/min/circuit
            </p>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
