'use client'

import { useRef, useMemo, useState } from 'react'
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

// ── Visibility cone from attacker ────────────────────────────────────────────

interface VisibilityConeProps {
  from:   [number, number, number]
  to:     [number, number, number]
  color?: string
}

function VisibilityCone({ from, to, color = RED }: VisibilityConeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef  = useRef<THREE.MeshBasicMaterial>(null)

  const [pos, quat, height] = useMemo<[[number,number,number], THREE.Quaternion, number]>(() => {
    const start = new THREE.Vector3(...from)
    const end   = new THREE.Vector3(...to)
    const dir   = end.clone().sub(start)
    const h     = dir.length()
    const mid   = start.clone().add(end).multiplyScalar(0.5)
    const q     = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    return [[mid.x, mid.y, mid.z], q, h]
  }, [from, to])

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.06 + Math.abs(Math.sin(clock.getElapsedTime() * 1.8)) * 0.05
    }
  })

  return (
    <mesh position={pos} quaternion={quat} ref={meshRef}>
      <coneGeometry args={[0.28, height, 16, 1, true]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ── Hidden segment indicator (dim + dashed-style) ─────────────────────────────

interface HiddenSegmentProps {
  from: [number, number, number]
  to:   [number, number, number]
}

function HiddenSegment({ from, to }: HiddenSegmentProps) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...from, ...to]), 3))
    const mat = new THREE.LineDashedMaterial({
      color: '#9aa4af',
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      dashSize: 0.18,
      gapSize: 0.12,
    })
    const line = new THREE.Line(geo, mat)
    line.computeLineDistances()
    return line
  }, [from, to])

  return <primitive object={lineObj} />
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
      {/* ISP visibility cone */}
      <VisibilityCone from={ISP_ATK_POS} to={CLIENT_POS} />
      <VisibilityCone from={ISP_ATK_POS} to={GUARD_POS}  />

      {/* Normal nodes */}
      <NodeSphere position={CLIENT_POS} color={COLORS.white}  label="Client"      />
      <NodeSphere position={GUARD_POS}  color={COLORS.guard}  label="Guard"       />
      <NodeSphere position={MIX1_POS}   color={COLORS.mix}    label="Mix-1"       />
      <NodeSphere position={MIX2_POS}   color={COLORS.mix}    label="Mix-2"       />
      <NodeSphere position={EXIT_POS}   color={COLORS.exit}   label="Exit"        />
      <NodeSphere position={DEST_POS}   color={COLORS.white}  label="Destination" />

      {/* Attacker */}
      <NodeSphere position={ISP_ATK_POS} color={RED} label="ISP Attacker" pulse flash />

      {/* Visible to ISP — highlighted */}
      <Connection from={CLIENT_POS} to={GUARD_POS}  color={RED}          animated speed={0.6} highlighted />
      <Connection from={ISP_ATK_POS} to={CLIENT_POS} color={RED}          highlighted />
      <Connection from={ISP_ATK_POS} to={GUARD_POS}  color={RED}          highlighted />

      {/* Hidden from ISP — dim dashed */}
      <HiddenSegment from={GUARD_POS}  to={MIX1_POS} />
      <HiddenSegment from={MIX1_POS}   to={EXIT_POS} />
      <HiddenSegment from={MIX2_POS}   to={EXIT_POS} />
      <HiddenSegment from={EXIT_POS}   to={DEST_POS} />

      {/* Animated packets on hidden path */}
      <Connection from={GUARD_POS} to={MIX1_POS} color={COLORS.mix}  animated speed={0.4} />
      <Connection from={MIX1_POS}  to={EXIT_POS} color={COLORS.mix}  animated speed={0.45}/>
      <Connection from={EXIT_POS}  to={DEST_POS} color={COLORS.exit} animated speed={0.5} />
    </group>
  )
}

function TrafficAnalysisScene() {
  return (
    <group>
      {/* Observation cones */}
      <VisibilityCone from={TRAFFIC_ATK1} to={CLIENT_POS} color={ORANGE} />
      <VisibilityCone from={TRAFFIC_ATK2} to={MIX1_POS}   color={ORANGE} />
      <VisibilityCone from={TRAFFIC_ATK3} to={DEST_POS}   color={ORANGE} />

      <NodeSphere position={CLIENT_POS}   color={COLORS.white}  label="Client"      />
      <NodeSphere position={GUARD_POS}    color={COLORS.guard}  label="Guard"       />
      <NodeSphere position={MIX1_POS}     color={COLORS.mix}    label="Mix-1"       />
      <NodeSphere position={MIX2_POS}     color={COLORS.mix}    label="Mix-2"       />
      <NodeSphere position={EXIT_POS}     color={COLORS.exit}   label="Exit"        />
      <NodeSphere position={DEST_POS}     color={COLORS.white}  label="Destination" />

      <NodeSphere position={TRAFFIC_ATK1} color={RED}    label="Observer-1" flash />
      <NodeSphere position={TRAFFIC_ATK2} color={ORANGE} label="Observer-2" flash />
      <NodeSphere position={TRAFFIC_ATK3} color={RED}    label="Observer-3" flash />

      <Connection from={CLIENT_POS} to={GUARD_POS}  color={COLORS.guard} animated speed={0.5}  />
      <Connection from={GUARD_POS}  to={MIX1_POS}   color={COLORS.mix}   animated speed={0.45} />
      <Connection from={GUARD_POS}  to={MIX2_POS}   color={COLORS.mix}   animated speed={0.4}  />
      <Connection from={MIX1_POS}   to={EXIT_POS}   color={COLORS.mix}   animated speed={0.5}  />
      <Connection from={EXIT_POS}   to={DEST_POS}   color={COLORS.exit}  animated speed={0.45} />

      <Connection from={TRAFFIC_ATK1} to={CLIENT_POS} color={ORANGE} highlighted />
      <Connection from={TRAFFIC_ATK2} to={MIX1_POS}   color={ORANGE} highlighted />
      <Connection from={TRAFFIC_ATK3} to={DEST_POS}   color={ORANGE} highlighted />
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
      {/* Exit watching outbound */}
      <VisibilityCone from={EXIT_POS} to={DEST_POS} color={ORANGE} />

      <NodeSphere position={CLIENT_POS} color={COLORS.white}  label="Client"         />
      <NodeSphere position={GUARD_POS}  color={COLORS.guard}  label="Guard"          />
      <NodeSphere position={MIX1_POS}   color={COLORS.mix}    label="Mix-1"          />
      <NodeSphere position={MIX2_POS}   color={COLORS.mix}    label="Mix-2"          />
      <NodeSphere position={EXIT_POS}   color={ORANGE}        label="Malicious Exit" pulse flash />
      <NodeSphere position={DEST_POS}   color={COLORS.white}  label="Destination"    />

      <Connection from={CLIENT_POS} to={GUARD_POS}  color={COLORS.guard} animated speed={0.5}  />
      <Connection from={GUARD_POS}  to={MIX1_POS}   color={COLORS.mix}   animated speed={0.45} />
      <Connection from={MIX1_POS}   to={EXIT_POS}   color={COLORS.mix}   animated speed={0.4}  />
      <Connection from={MIX2_POS}   to={EXIT_POS}   color={COLORS.mix}   animated speed={0.35} />
      <Connection from={EXIT_POS}   to={DEST_POS}   color={ORANGE}       animated speed={0.5} highlighted />

      {/* Hidden hops — dim */}
      <HiddenSegment from={CLIENT_POS} to={GUARD_POS} />
      <HiddenSegment from={GUARD_POS}  to={MIX1_POS}  />
    </group>
  )
}

function NationStateScene() {
  const targets: Array<[number, number, number]> = [
    CLIENT_POS, GUARD_POS, MIX1_POS, EXIT_POS, DEST_POS,
  ]
  return (
    <group>
      {/* Surveillance cones */}
      {NATION_ATKS.map((pos, i) => (
        <VisibilityCone key={`cone${i}`} from={pos} to={targets[i % targets.length]} />
      ))}

      <NodeSphere position={CLIENT_POS} color={COLORS.white}  label="Client"      />
      <NodeSphere position={GUARD_POS}  color={COLORS.guard}  label="Guard"       />
      <NodeSphere position={MIX1_POS}   color={COLORS.mix}    label="Mix-1"       />
      <NodeSphere position={MIX2_POS}   color={COLORS.mix}    label="Mix-2"       />
      <NodeSphere position={EXIT_POS}   color={COLORS.exit}   label="Exit"        />
      <NodeSphere position={DEST_POS}   color={COLORS.white}  label="Destination" />

      {NATION_ATKS.map((pos, i) => (
        <NodeSphere key={i} position={pos} color={RED} label={`NSA-${i + 1}`} flash size={0.13} />
      ))}

      <Connection from={CLIENT_POS} to={GUARD_POS}  color={COLORS.guard} animated speed={0.5}  />
      <Connection from={GUARD_POS}  to={MIX1_POS}   color={COLORS.mix}   animated speed={0.45} />
      <Connection from={GUARD_POS}  to={MIX2_POS}   color={COLORS.mix}   animated speed={0.4}  />
      <Connection from={MIX1_POS}   to={EXIT_POS}   color={COLORS.mix}   animated speed={0.5}  />
      <Connection from={EXIT_POS}   to={DEST_POS}   color={COLORS.exit}  animated speed={0.45} />

      {NATION_ATKS.map((pos, i) => (
        <Connection key={`atk${i}`} from={pos} to={targets[i % targets.length]} color={RED} highlighted />
      ))}
    </group>
  )
}

// ── Fade overlay for attack transitions ──────────────────────────────────────

function FadeOverlay({ fade }: { fade: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (meshRef.current) {
      // Position overlay just in front of camera
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      meshRef.current.position.copy(camera.position).addScaledVector(dir, 0.5)
      meshRef.current.quaternion.copy(camera.quaternion)
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = fade
    }
  })
  if (fade <= 0) return null
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial
        color="#08090a"
        transparent
        opacity={fade}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

export default function ThreatScene({ attack }: ThreatSceneProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const [fade, setFade]   = useState(0)
  const fadeRef   = useRef(0)
  const prevAttack = useRef(attack)

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.12) * 0.18
    }

    // Trigger fade on attack change
    if (prevAttack.current !== attack) {
      prevAttack.current = attack
      fadeRef.current = 1
    }
    if (fadeRef.current > 0) {
      fadeRef.current = Math.max(0, fadeRef.current - delta * 3)
      setFade(fadeRef.current)
    }
  })

  return (
    <>
      <ambientLight intensity={0.25} color="#1a1a2e" />
      <pointLight position={[3, 5, 5]}   intensity={2.2} color={COLORS.neonBlue} distance={22} />
      <pointLight position={[-5, -3, -3]} intensity={1.8} color={RED}            distance={18} />
      <pointLight position={[0, 6, 2]}   intensity={0.8} color="#ffffff"         distance={14} />
      <fog attach="fog" args={['#08090a', 18, 35]} />

      <group ref={groupRef}>
        {attack === 'isp'     && <ISPMonitoringScene />}
        {attack === 'traffic' && <TrafficAnalysisScene />}
        {attack === 'relay'   && <MaliciousRelayScene />}
        {attack === 'exit'    && <ExitSurveillanceScene />}
        {attack === 'nation'  && <NationStateScene />}
      </group>

      <FadeOverlay fade={fade} />

      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.14}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
