'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { COLORS } from '@/lib/constants'

// ── Types ─────────────────────────────────────────────────────────────────────

export type HiddenServiceStep = 1 | 2 | 3 | 4 | 5

export interface HiddenServiceSceneProps {
  step: HiddenServiceStep
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function NodeSphere({
  position,
  color,
  label,
  size = 0.18,
  pulse = false,
}: {
  position: [number, number, number]
  color: string
  label: string
  size?: number
  pulse?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return
    const t = clock.getElapsedTime()
    if (pulse) {
      const s = 1 + Math.sin(t * 2.5) * 0.12
      meshRef.current.scale.setScalar(s)
      glowRef.current.scale.setScalar(s)
    }
    const gMat = glowRef.current.material as THREE.MeshBasicMaterial
    gMat.opacity = 0.12 + Math.sin(t * 1.2) * 0.04
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2.2, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Html distanceFactor={10} center position={[0, size * 2.5, 0]}>
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
            boxShadow: `0 0 8px ${color}30`,
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}

// ── Animated connection line ──────────────────────────────────────────────────

function AnimatedLine({
  from,
  to,
  color,
  speed = 0.5,
  dashed = false,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
  speed?: number
  dashed?: boolean
}) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pts = new Float32Array([...from, ...to])
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.Line(geo, mat)
  }, [from, to, color])

  const packetRef = useRef<THREE.Mesh>(null)
  const progressRef = useRef(Math.random())

  useFrame((_, delta) => {
    progressRef.current = (progressRef.current + delta * speed) % 1
    const t = progressRef.current
    const f = new THREE.Vector3(...from)
    const e = new THREE.Vector3(...to)
    const pos = f.lerp(e, t)
    if (packetRef.current) packetRef.current.position.copy(pos)
  })

  return (
    <>
      <primitive object={lineObj} />
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// ── DHT ring ──────────────────────────────────────────────────────────────────

function DHTRing({
  center,
  radius,
  count,
  color,
}: {
  center: [number, number, number]
  radius: number
  count: number
  color: string
}) {
  const nodes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      return {
        pos: [
          center[0] + Math.cos(angle) * radius,
          center[1],
          center[2] + Math.sin(angle) * radius,
        ] as [number, number, number],
        label: `DHT-${i + 1}`,
      }
    })
  }, [center, radius, count])

  const ringLine = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= count; i++) {
      const angle = (i / count) * Math.PI * 2
      pts.push(
        center[0] + Math.cos(angle) * radius,
        center[1],
        center[2] + Math.sin(angle) * radius
      )
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3))
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.Line(geo, mat)
  }, [center, radius, count, color])

  return (
    <group>
      <primitive object={ringLine} />
      {nodes.map((n, i) => (
        <NodeSphere key={i} position={n.pos} color={color} label={n.label} size={0.1} />
      ))}
    </group>
  )
}

// ── Step scenes ───────────────────────────────────────────────────────────────

function Step1Scene() {
  const servicePos: [number, number, number] = [-2.5, 0, 0]
  const dhtCenter: [number, number, number] = [1.5, 0, 0]

  return (
    <group>
      <NodeSphere position={servicePos} color={COLORS.purple} label="Hidden Service" size={0.22} pulse />
      <DHTRing center={dhtCenter} radius={1.4} count={7} color={COLORS.neonBlue} />
      <AnimatedLine from={servicePos} to={[dhtCenter[0] - 1.4, dhtCenter[1], dhtCenter[2]]} color={COLORS.purple} speed={0.4} />
      <AnimatedLine from={servicePos} to={[dhtCenter[0] + 0.7, dhtCenter[1], dhtCenter[2] + 1.2]} color={COLORS.purple} speed={0.6} />
    </group>
  )
}

function Step2Scene() {
  const servicePos: [number, number, number] = [0, 0, 0]
  const introPoints: [number, number, number][] = [
    [-2.5, 1.2, 0],
    [-2.5, -1.2, 0],
    [-2.5, 0, 1.5],
  ]

  return (
    <group>
      <NodeSphere position={servicePos} color={COLORS.purple} label="Hidden Service" size={0.22} pulse />
      {introPoints.map((pos, i) => (
        <group key={i}>
          <NodeSphere position={pos} color={COLORS.neonBlue} label={`Intro Point ${i + 1}`} size={0.15} />
          <AnimatedLine from={servicePos} to={pos} color={COLORS.neonBlue} speed={0.5 + i * 0.1} />
        </group>
      ))}
    </group>
  )
}

function Step3Scene() {
  const clientPos: [number, number, number] = [-2.8, 0, 0]
  const dhtCenter: [number, number, number] = [0, 0, 0]
  const servicePos: [number, number, number] = [2.8, 0, 0]

  return (
    <group>
      <NodeSphere position={clientPos} color={COLORS.white} label="Client" size={0.18} />
      <DHTRing center={dhtCenter} radius={1.0} count={5} color={COLORS.neonBlue} />
      <NodeSphere position={servicePos} color={COLORS.purple} label="Hidden Service" size={0.18} />
      <AnimatedLine from={clientPos} to={[-1, 0, 0]} color={COLORS.neonBlue} speed={0.45} />
      <AnimatedLine from={[1, 0, 0]} to={clientPos} color={COLORS.green} speed={0.45} />
    </group>
  )
}

function Step4Scene() {
  const clientPos: [number, number, number] = [-3, 0.8, 0]
  const rendezPos: [number, number, number] = [0, 0, 0]
  const introPos: [number, number, number] = [-3, -0.8, 0]
  const servicePos: [number, number, number] = [3, 0, 0]

  return (
    <group>
      <NodeSphere position={clientPos} color={COLORS.white} label="Client" size={0.16} />
      <NodeSphere position={rendezPos} color={COLORS.neonBlue} label="Rendezvous" size={0.2} pulse />
      <NodeSphere position={introPos} color={COLORS.muted} label="Intro Point" size={0.14} />
      <NodeSphere position={servicePos} color={COLORS.purple} label="Hidden Service" size={0.18} />
      <AnimatedLine from={clientPos} to={rendezPos} color={COLORS.neonBlue} speed={0.5} />
      <AnimatedLine from={introPos} to={servicePos} color={COLORS.purple} speed={0.4} />
      <AnimatedLine from={servicePos} to={rendezPos} color={COLORS.green} speed={0.45} />
    </group>
  )
}

function Step5Scene() {
  const clientPos: [number, number, number] = [-3.5, 0, 0]
  const guard: [number, number, number] = [-2, 0.8, 0]
  const mix1: [number, number, number] = [-0.8, -0.5, 0]
  const rendezvous: [number, number, number] = [0.5, 0.5, 0]
  const mix2: [number, number, number] = [1.8, -0.3, 0]
  const exitN: [number, number, number] = [2.8, 0.6, 0]
  const servicePos: [number, number, number] = [3.5, 0, 0]

  const hops: Array<{ from: [number, number, number]; to: [number, number, number]; color: string }> = [
    { from: clientPos, to: guard, color: COLORS.guard },
    { from: guard, to: mix1, color: COLORS.mix },
    { from: mix1, to: rendezvous, color: COLORS.neonBlue },
    { from: rendezvous, to: mix2, color: COLORS.mix },
    { from: mix2, to: exitN, color: COLORS.exit },
    { from: exitN, to: servicePos, color: COLORS.purple },
  ]

  return (
    <group>
      <NodeSphere position={clientPos} color={COLORS.white} label="Client" size={0.15} />
      <NodeSphere position={guard} color={COLORS.guard} label="Guard" size={0.12} />
      <NodeSphere position={mix1} color={COLORS.mix} label="Mix" size={0.12} />
      <NodeSphere position={rendezvous} color={COLORS.neonBlue} label="Rendezvous" size={0.16} pulse />
      <NodeSphere position={mix2} color={COLORS.mix} label="Mix" size={0.12} />
      <NodeSphere position={exitN} color={COLORS.exit} label="Exit" size={0.12} />
      <NodeSphere position={servicePos} color={COLORS.purple} label="Service" size={0.15} />
      {hops.map((h, i) => (
        <AnimatedLine key={i} from={h.from} to={h.to} color={h.color} speed={0.4 + i * 0.05} />
      ))}
      {/* Return path - reversed */}
      {hops.slice().reverse().map((h, i) => (
        <AnimatedLine key={`r${i}`} from={h.to} to={h.from} color={h.color} speed={0.3 + i * 0.04} />
      ))}
    </group>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

export default function HiddenServiceScene({ step }: HiddenServiceSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.2
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} color="#1a1a2e" />
      <pointLight position={[5, 5, 5]} intensity={2.5} color={COLORS.neonBlue} distance={20} />
      <pointLight position={[-5, -3, -3]} intensity={1.5} color={COLORS.purple} distance={15} />
      <pointLight position={[0, 6, 2]} intensity={0.8} color="#ffffff" distance={12} />

      <group ref={groupRef}>
        {step === 1 && <Step1Scene />}
        {step === 2 && <Step2Scene />}
        {step === 3 && <Step3Scene />}
        {step === 4 && <Step4Scene />}
        {step === 5 && <Step5Scene />}
      </group>

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
