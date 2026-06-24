'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import dynamic from 'next/dynamic'
import { useNetworkData } from '@/hooks/useNetworkData'
import { useAppStore } from '@/lib/store'
import { NodeType } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import { formatLatency, formatReputation } from '@/lib/utils'
import PacketBadge from '@/components/ui/PacketBadge'
import GlassPanel from '@/components/ui/GlassPanel'

const NetworkScene = dynamic(
  () => import('@/components/three/NetworkScene'),
  { ssr: false }
)

// ── Filter button ─────────────────────────────────────────────────────────────

type FilterType = NodeType | 'all'

interface FilterBtnProps {
  label: string
  value: FilterType
  active: boolean
  color: string
  onClick: () => void
}

function FilterBtn({ label, value, active, color, onClick }: FilterBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}22` : 'rgba(5,5,8,0.7)',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        color: active ? color : '#6b7280',
        fontFamily: 'var(--font-jetbrains-mono)',
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.2s',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  )
}

// ── Reputation bar ────────────────────────────────────────────────────────────

function ReputationBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
          fontSize: 11,
          fontFamily: 'var(--font-jetbrains-mono)',
          color: '#6b7280',
        }}
      >
        <span>Reputation</span>
        <span style={{ color: COLORS.green }}>{formatReputation(value)}</span>
      </div>
      <div
        style={{
          height: 4,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${COLORS.green}80, ${COLORS.green})`,
            borderRadius: 2,
            transition: 'width 0.4s ease',
            boxShadow: `0 0 8px ${COLORS.green}60`,
          }}
        />
      </div>
    </div>
  )
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div
      style={{
        background: `${color}0d`,
        border: `1px solid ${color}25`,
        borderRadius: 8,
        padding: '8px 12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color,
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'var(--font-space-grotesk)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: '#6b7280',
          fontSize: 9,
          fontFamily: 'var(--font-jetbrains-mono)',
          marginTop: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </div>
    </div>
  )
}

// ── Legend dot ────────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: '#9ca3af',
          fontSize: 12,
          fontFamily: 'var(--font-jetbrains-mono)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  useNetworkData()

  const nodes = useAppStore((s) => s.nodes)
  const selectedNode = useAppStore((s) => s.selectedNode)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)

  const [filter, setFilter] = useState<FilterType>('all')

  const guardCount = nodes.filter((n) => n.type === 'guard').length
  const mixCount = nodes.filter((n) => n.type === 'mix').length
  const exitCount = nodes.filter((n) => n.type === 'exit').length

  const filterOptions: { label: string; value: FilterType; color: string }[] = [
    { label: 'All', value: 'all', color: COLORS.neonBlue },
    { label: 'Guard', value: 'guard', color: COLORS.guard },
    { label: 'Mix', value: 'mix', color: COLORS.mix },
    { label: 'Exit', value: 'exit', color: COLORS.exit },
  ]

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        background: COLORS.bg,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Left: 3D Canvas (75%) ─────────────────────────────────────────── */}
      <div style={{ width: '75%', height: '100%', position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 100 }}
          style={{ background: COLORS.bg }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <NetworkScene filter={filter} />
          </Suspense>
        </Canvas>

        {/* Filter overlay */}
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 20,
            display: 'flex',
            gap: 6,
            zIndex: 10,
          }}
        >
          {filterOptions.map((opt) => (
            <FilterBtn
              key={opt.value}
              label={opt.label}
              value={opt.value}
              active={filter === opt.value}
              color={opt.color}
              onClick={() => setFilter(opt.value)}
            />
          ))}
        </div>

        {/* Corner hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            color: '#374151',
            fontSize: 10,
            fontFamily: 'var(--font-jetbrains-mono)',
            letterSpacing: '0.05em',
          }}
        >
          DRAG · SCROLL · CLICK
        </div>
      </div>

      {/* ── Right: Info Panel (25%) ──────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: '25%',
          background: 'rgba(5,5,8,0.92)',
          borderLeft: '1px solid rgba(0,212,255,0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          zIndex: 20,
          paddingTop: 64,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 20px 16px',
            borderBottom: '1px solid rgba(0,212,255,0.08)',
          }}
        >
          <p
            style={{
              color: '#374151',
              fontSize: 9,
              fontFamily: 'var(--font-jetbrains-mono)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Module · 01
          </p>
          <h1
            style={{
              color: COLORS.neonBlue,
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'var(--font-space-grotesk)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${COLORS.neonBlue}60`,
              margin: 0,
            }}
          >
            Network Nodes
          </h1>
        </div>

        {/* Live stats */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p
            style={{
              color: '#4b5563',
              fontSize: 9,
              fontFamily: 'var(--font-jetbrains-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 10,
            }}
          >
            Live Stats
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <StatChip label="Total" value={nodes.length} color={COLORS.neonBlue} />
            <StatChip label="Guard" value={guardCount} color={COLORS.guard} />
            <StatChip label="Mix" value={mixCount} color={COLORS.mix} />
            <StatChip label="Exit" value={exitCount} color={COLORS.exit} />
          </div>
        </div>

        {/* Selected node details OR legend */}
        <div style={{ padding: '16px 20px', flex: 1 }}>
          {selectedNode ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <p
                  style={{
                    color: '#4b5563',
                    fontSize: 9,
                    fontFamily: 'var(--font-jetbrains-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    margin: 0,
                  }}
                >
                  Selected Node
                </p>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#6b7280',
                    fontSize: 10,
                    fontFamily: 'var(--font-jetbrains-mono)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Deselect
                </button>
              </div>

              <GlassPanel padding="14px" accentColor={COLORS.neonBlue}>
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      color: COLORS.white,
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {selectedNode.label}
                  </div>
                  <PacketBadge type={selectedNode.type} size="sm" />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    fontSize: 12,
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}
                >
                  {/* Country */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Country</span>
                    <span style={{ color: COLORS.white }}>{selectedNode.country}</span>
                  </div>

                  {/* Latency */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Latency</span>
                    <span style={{ color: COLORS.green }}>
                      {formatLatency(selectedNode.latency)}
                    </span>
                  </div>

                  {/* Connections */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Connections</span>
                    <span style={{ color: COLORS.neonBlue }}>
                      {selectedNode.connections.length}
                    </span>
                  </div>

                  {/* Reputation bar */}
                  <div style={{ marginTop: 4 }}>
                    <ReputationBar value={selectedNode.reputation} />
                  </div>
                </div>
              </GlassPanel>
            </>
          ) : (
            <>
              {/* Legend */}
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    color: '#4b5563',
                    fontSize: 9,
                    fontFamily: 'var(--font-jetbrains-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    marginBottom: 12,
                  }}
                >
                  Node Types
                </p>
                <GlassPanel padding="14px" accentColor={COLORS.neonBlue}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <LegendDot color={COLORS.guard} label="Guard Node — Entry point" />
                    <LegendDot color={COLORS.mix} label="Mix Node — Packet mixing" />
                    <LegendDot color={COLORS.exit} label="Exit Node — Route exit" />
                  </div>
                </GlassPanel>
              </div>

              {/* Network health */}
              <div>
                <p
                  style={{
                    color: '#4b5563',
                    fontSize: 9,
                    fontFamily: 'var(--font-jetbrains-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    marginBottom: 12,
                  }}
                >
                  Network Health
                </p>
                <GlassPanel padding="14px" accentColor={COLORS.green}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: COLORS.green,
                        boxShadow: `0 0 10px ${COLORS.green}`,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        color: COLORS.green,
                        fontSize: 12,
                        fontFamily: 'var(--font-jetbrains-mono)',
                        fontWeight: 600,
                      }}
                    >
                      OPERATIONAL
                    </span>
                  </div>
                  <div
                    style={{
                      color: '#4b5563',
                      fontSize: 11,
                      fontFamily: 'var(--font-jetbrains-mono)',
                      lineHeight: 1.6,
                    }}
                  >
                    All {nodes.length} nodes online.
                    <br />
                    Click a node to inspect.
                  </div>
                </GlassPanel>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(0,212,255,0.06)',
            color: '#1f2937',
            fontSize: 9,
            fontFamily: 'var(--font-jetbrains-mono)',
            letterSpacing: '0.08em',
          }}
        >
          ZERO PROTOCOL · NETWORK MODULE
        </div>
      </div>
    </main>
  )
}
