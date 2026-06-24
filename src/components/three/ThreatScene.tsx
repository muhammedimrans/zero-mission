'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { COLORS } from '@/lib/constants'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttackType = 'isp' | 'traffic' | 'relay' | 'exit' | 'nation'

export interface ThreatSceneProps {
  attack: AttackType
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RED = COLORS.red
const ORANGE = '#ff8c00'

// ── Helpers ───────────────────────────────────────────────────────────────────

interface NodeSphereProps {
  position: [number, number, number]
  color: string
  label: string
  size?: number
  pulse?: boolean
  flash?: boolean
}

function NodeSphere({ position, color, label, size = 0.16, pulse = false, flash = false }: NodeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return
    const t = clock.getElapsedTime()
    if (pulse) {
      const s = 1 + Math.sin(t * 2.5) * 0.14
      meshRef.current.scale.setScalar(s)
    }
    if (flash) {
      const intensity = 0.5 + Math.abs(Math.sin(t * 4)) * 0.5
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = intensity
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial
      gMat.opacity = intensity * 0.2
    } else {
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial
      gMat.opacity = 0.12 + Math.sin(t * 1.5) * 0.03
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2.4, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Html distanceFactor={10} center position={[0, size * 2.8, 0]}>
        <div
          style={{
            pointerEvents: 'none',
            background: 'rgba(5,5,8,0.85)',
            border: `1px solid ${color}50`,
            borderRadius: 4,
            padding: '2px 7px',
            color,
            fontSize: 9,
            fontFamily: 'var(--font-jetbrains-mono)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}

interface ConnectionProps {
  from: [number, number, number]
  to: [number, number, number]
  color: string
  animated?: boolean
  speed?: number
  highlighted?: boolean
}

function Connection({ from, to, color, animated = false, speed = 0.5, highlighted = false }: ConnectionProps) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...from, ...to]), 3))
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: highlighted ? 0.8 : 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.Line(geo, mat)
  }, [from, to, color, highlighted])

  const packetRef = useRef<THREE.Mesh>(null)
  const progressRef = useRef(Math.random())

  useFrame((_, delta) => {
    if (!animated || !packetRef.current) return
    progressRef.current = (progressRef.current + delta * speed) % 1
    const t = progressRef.current
    const f = new THREE.Vector3(...from)
    const e = new THREE.Vector3(...to)
    packetRef.current.position.copy(f.lerp(e, t))
  })

  return (
    <>
      <primitive object={lineObj} />
      {animated && (
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  )
}

// ── Network base layout ────────────────────────────────────────────────────────

const CLIENT_POS: [number, number, number] = [-4, 0, 0]
const GUARD_POS: [number, number, number] = [-2, 0, 0]
const MIX1_POS: [number, number, number] = [0, 0.8, 0]
const MIX2_POS: [number, number, number] = [0, -0.8, 0]
const EXIT_POS: [number, number, number] = [2, 0, 0]
const DEST_POS: [number, number, number] = [4, 0, 0]

// Attacker positions
const ISP_ATK_POS: [number, number, number] = [-3, 2, 0]
const TRAFFIC_ATK1: [number, number, number] = [-3.5, -1.8, 0]
const TRAFFIC_ATK2: [number, number, number] = [0, 2, 0]
const TRAFFIC_ATK3: [number, number, number] = [3.5, -1.8, 0]
const NATION_ATKS: Array<[number, number, number]> = [
  [-4.5, 2, 0],
  [-1.5, -2, 0],
  [1.5, 2, 0],
  [4.5, -1.5, 0],
  [0, -2.5, 0],
]

// ── Attack scenes ──────────────────────────────────────────────────────────────

function ISPMonitoringScene() {
  return (
    <group>
      {/* Normal nodes */}
      <NodeSphere position={CLIENT_POS} color={COLORS.white} label="Client" />
      <NodeSphere position={GUARD_POS} color={COLORS.guard} label="Guard" />
      <NodeSphere position={MIX1_POS} color={COLORS.mix} label="Mix-1" />
      <NodeSphere position={MIX2_POS} color={COLORS.mix} label="Mix-2" />
      <NodeSphere position={EXIT_POS} color={COLORS.exit} label="Exit" />
      <NodeSphere position={DEST_POS} color={COLORS.white} label="Destination" />

      {/* Attacker */}
      <NodeSphere position={ISP_ATK_POS} color={RED} label="ISP Attacker" pulse flash />

      {/* Normal connections */}
      <Connection from={GUARD_POS} to={MIX1_POS} color={COLORS.mix} animated speed={0.4} />
      <Connection from={MIX1_POS} to={EXIT_POS} color={COLORS.mix} animated speed={0.45} />
      <Connection from={MIX2_POS} to={EXIT_POS} color={COLORS.mix} animated speed={0.4} />
      <Connection from={EXIT_POS} to={DEST_POS} color={COLORS.exit} animated speed={0.5} />

      {/* ISP watching client→guard */}
      <Connection from={CLIENT_POS} to={GUARD_POS} color={RED} animated speed={0.6} highlighted />
      <Connection from={ISP_ATK_POS} to={CLIENT_POS} color={RED} highlighted />
      <Connection from={ISP_ATK_POS} to={GUARD_POS} color={RED} highlighted />
    </group>
  )
}

function TrafficAnalysisScene() {
  return (
    <group>
      <NodeSphere position={CLIENT_POS} color={COLORS.white} label="Client" />
      <NodeSphere position={GUARD_POS} color={COLORS.guard} label="Guard" />
      <NodeSphere position={MIX1_POS} color={COLORS.mix} label="Mix-1" />
      <NodeSphere position={MIX2_POS} color={COLORS.mix} label="Mix-2" />
      <NodeSphere position={EXIT_POS} color={COLORS.exit} label="Exit" />
      <NodeSphere position={DEST_POS} color={COLORS.white} label="Destination" />

      {/* Multiple attackers observing timing */}
      <NodeSphere position={TRAFFIC_ATK1} color={RED} label="Observer-1" flash />
      <NodeSphere position={TRAFFIC_ATK2} color={RED} label="Observer-2" flash />
      <NodeSphere position={TRAFFIC_ATK3} color={RED} label="Observer-3" flash />

      {/* Connections */}
      <Connection from={CLIENT_POS} to={GUARD_POS} color={COLORS.guard} animated speed={0.5} />
      <Connection from={GUARD_POS} to={MIX1_POS} color={COLORS.mix} animated speed={0.45} />
      <Connection from={GUARD_POS} to={MIX2_POS} color={COLORS.mix} animated speed={0.4} />
      <Connection from={MIX1_POS} to={EXIT_POS} color={COLORS.mix} animated speed={0.5} />
      <Connection from={EXIT_POS} to={DEST_POS} color={COLORS.exit} animated speed={0.45} />

      {/* Observation lines */}
      <Connection from={TRAFFIC_ATK1} to={CLIENT_POS} color={ORANGE} highlighted />
      <Connection from={TRAFFIC_ATK2} to={MIX1_POS} color={ORANGE} highlighted />
      <Connection from={TRAFFIC_ATK3} to={DEST_POS} color={ORANGE} highlighted />
    </group>
  )
}

function MaliciousRelayScene() {
  return (
    <group>
      <NodeSphere position={CLIENT_POS} color={COLORS.white} label="Client" />
      <NodeSphere position={GUARD_POS} color={COLORS.guard} label="Guard" />
      {/* Compromised mix node */}
      <NodeSphere position={MIX1_POS} color={RED} label="Compromised Mix" pulse flash />
      <NodeSphere position={MIX2_POS} color={COLORS.mix} label="Mix-2" />
      <NodeSphere position={EXIT_POS} color={COLORS.exit} label="Exit" />
      <NodeSphere position={DEST_POS} color={COLORS.white} label="Destination" />

      {/* Connections */}
      <Connection from={CLIENT_POS} to={GUARD_POS} color={COLORS.guard} animated speed={0.5} />
      <Connection from={GUARD_POS} to={MIX1_POS} color={RED} animated speed={0.45} highlighted />
      <Connection from={MIX1_POS} to={EXIT_POS} color={RED} animated speed={0.45} highlighted />
      <Connection from={MIX2_POS} to={EXIT_POS} color={COLORS.mix} animated speed={0.4} />
      <Connection from={EXIT_POS} to={DEST_POS} color={COLORS.exit} animated speed={0.5} />
    </group>
  )
}

function ExitSurveillanceScene() {
  return (
    <group>
      <NodeSphere position={CLIENT_POS} color={COLORS.white} label="Client" />
      <NodeSphere position={GUARD_POS} color={COLORS.guard} label="Guard" />
      <NodeSphere position={MIX1_POS} color={COLORS.mix} label="Mix-1" />
      <NodeSphere position={MIX2_POS} color={COLORS.mix} label="Mix-2" />
      {/* Malicious exit */}
      <NodeSphere position={EXIT_POS} color={ORANGE} label="Malicious Exit" pulse flash />
      <NodeSphere position={DEST_POS} color={COLORS.white} label="Destination" />

      {/* Connections */}
      <Connection from={CLIENT_POS} to={GUARD_POS} color={COLORS.guard} animated speed={0.5} />
      <Connection from={GUARD_POS} to={MIX1_POS} color={COLORS.mix} animated speed={0.45} />
      <Connection from={MIX1_POS} to={EXIT_POS} color={COLORS.mix} animated speed={0.4} />
      <Connection from={MIX2_POS} to={EXIT_POS} color={COLORS.mix} animated speed={0.35} />
      <Connection from={EXIT_POS} to={DEST_POS} color={ORANGE} animated speed={0.5} highlighted />
    </group>
  )
}

function NationStateScene() {
  return (
    <group>
      <NodeSphere position={CLIENT_POS} color={COLORS.white} label="Client" />
      <NodeSphere position={GUARD_POS} color={COLORS.guard} label="Guard" />
      <NodeSphere position={MIX1_POS} color={COLORS.mix} label="Mix-1" />
      <NodeSphere position={MIX2_POS} color={COLORS.mix} label="Mix-2" />
      <NodeSphere position={EXIT_POS} color={COLORS.exit} label="Exit" />
      <NodeSphere position={DEST_POS} color={COLORS.white} label="Destination" />

      {/* Nation-state adversary nodes */}
      {NATION_ATKS.map((pos, i) => (
        <NodeSphere
          key={i}
          position={pos}
          color={RED}
          label={`NSA-${i + 1}`}
          flash
          size={0.13}
        />
      ))}

      {/* Connections */}
      <Connection from={CLIENT_POS} to={GUARD_POS} color={COLORS.guard} animated speed={0.5} />
      <Connection from={GUARD_POS} to={MIX1_POS} color={COLORS.mix} animated speed={0.45} />
      <Connection from={GUARD_POS} to={MIX2_POS} color={COLORS.mix} animated speed={0.4} />
      <Connection from={MIX1_POS} to={EXIT_POS} color={COLORS.mix} animated speed={0.5} />
      <Connection from={EXIT_POS} to={DEST_POS} color={COLORS.exit} animated speed={0.45} />

      {/* Attack surveillance lines */}
      {NATION_ATKS.map((pos, i) => {
        const targets: Array<[number, number, number]> = [
          CLIENT_POS, GUARD_POS, MIX1_POS, EXIT_POS, DEST_POS,
        ]
        return (
          <Connection
            key={`atk${i}`}
            from={pos}
            to={targets[i % targets.length]}
            color={RED}
            highlighted
          />
        )
      })}
    </group>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

export default function ThreatScene({ attack }: ThreatSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.12) * 0.18
    }
  })

  return (
    <>
      <ambientLight intensity={0.25} color="#1a1a2e" />
      <pointLight position={[3, 5, 5]} intensity={2} color={COLORS.neonBlue} distance={20} />
      <pointLight position={[-5, -3, -3]} intensity={1.5} color={RED} distance={15} />
      <pointLight position={[0, 6, 2]} intensity={0.8} color="#ffffff" distance={12} />
      <fog attach="fog" args={['#050508', 15, 30]} />

      <group ref={groupRef}>
        {attack === 'isp' && <ISPMonitoringScene />}
        {attack === 'traffic' && <TrafficAnalysisScene />}
        {attack === 'relay' && <MaliciousRelayScene />}
        {attack === 'exit' && <ExitSurveillanceScene />}
        {attack === 'nation' && <NationStateScene />}
      </group>

      <EffectComposer>
        <Bloom
          intensity={1.6}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
