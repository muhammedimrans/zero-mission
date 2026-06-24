'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { COLORS } from '@/lib/constants'
import RouteChain, { RouteNode } from './RouteChain'

// ── Route definition ──────────────────────────────────────────────────────────

const ROUTE_NODES: RouteNode[] = [
  { label: 'Client',  color: COLORS.client, position: [-4.5, 0, 0] },
  { label: 'Guard',   color: COLORS.guard,  position: [-2.25, 0, 0] },
  { label: 'Mix 1',   color: COLORS.mix,    position: [0, 0, 0] },
  { label: 'Mix 2',   color: COLORS.mix,    position: [2.25, 0, 0] },
  { label: 'Exit',    color: COLORS.exit,   position: [4.5, 0, 0] },
]

const TOTAL_HOPS = ROUTE_NODES.length // 5

// ── Layer info panel (HTML overlay) ─────────────────────────────────────────
// This is the side-panel data; actual rendering happens in architecture/page.tsx
// We export the state via callback props so the page can show it.

export interface ArchitectureSceneProps {
  onHopChange?: (hop: number, layersRemaining: number) => void
}

// ── Scene internals ───────────────────────────────────────────────────────────

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.2} color="#0f172a" />
      <pointLight position={[0, 4, 4]}  intensity={2.5} color="#38bdf8" distance={20} />
      <pointLight position={[-6, -2, 2]} intensity={1.2} color="#818cf8" distance={15} />
      <pointLight position={[6, 2, -2]}  intensity={1.0} color="#34d399" distance={15} />
    </>
  )
}

// ── Exported scene ────────────────────────────────────────────────────────────

export default function ArchitectureScene({ onHopChange }: ArchitectureSceneProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeHop, setActiveHop] = useState(-1)
  const progressRef = useRef(0)
  const animatingRef = useRef(false)
  const hopRef = useRef(-1)
  const clockRef = useRef(0)

  // Expose sendPacket via window for the button outside the canvas
  const sendPacket = useCallback(() => {
    if (animatingRef.current) return
    animatingRef.current = true
    progressRef.current = 0
    hopRef.current = -1
    setIsAnimating(true)
    setActiveHop(-1)
  }, [])

  // Attach to window so the page-level button can call it
  useEffect(() => {
    (window as Window & { __archSendPacket?: () => void }).__archSendPacket = sendPacket
    return () => {
      delete (window as Window & { __archSendPacket?: () => void }).__archSendPacket
    }
  }, [sendPacket])

  useFrame((_, delta) => {
    if (!animatingRef.current) return

    clockRef.current += delta * 0.8 // speed
    progressRef.current = clockRef.current

    // Determine current hop
    const hop = Math.min(Math.floor(progressRef.current), TOTAL_HOPS - 1)
    if (hop !== hopRef.current) {
      hopRef.current = hop
      setActiveHop(hop)
      const layersRemaining = Math.max(0, TOTAL_HOPS - 1 - hop)
      onHopChange?.(hop, layersRemaining)
    }

    // Stop when done
    if (progressRef.current >= TOTAL_HOPS - 0.05) {
      animatingRef.current = false
      clockRef.current = 0
      progressRef.current = 0
      setTimeout(() => {
        setIsAnimating(false)
        setActiveHop(-1)
        hopRef.current = -1
        onHopChange?.(-1, TOTAL_HOPS - 1)
      }, 600)
    }
  })

  return (
    <>
      <SceneLights />
      <fog attach="fog" args={['#020b18', 15, 30]} />

      <RouteChain
        nodes={ROUTE_NODES}
        packetProgress={progressRef.current}
        activeHop={activeHop}
        showLabels
      />

      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={14}
        dampingFactor={0.08}
        enableDamping
        autoRotate={!isAnimating}
        autoRotateSpeed={0.4}
      />

      <EffectComposer>
        <Bloom
          intensity={1.4}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

// Export route nodes so page can reference them
export { ROUTE_NODES, TOTAL_HOPS }
