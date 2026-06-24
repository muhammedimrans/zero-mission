'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { COLORS } from '@/lib/constants'

// ── Layer definitions ─────────────────────────────────────────────────────────

export interface SphinxLayer {
  index: number
  name: string
  color: string
  description: string
  radius: number
  opacity: number
}

const LAYERS: SphinxLayer[] = [
  {
    index: 0,
    name: 'Header Encryption',
    color: COLORS.neonBlue,
    description: 'Outermost layer — AES-256-GCM encrypted routing header.',
    radius: 2.0,
    opacity: 0.35,
  },
  {
    index: 1,
    name: 'Routing Information',
    color: COLORS.purple,
    description: 'Encrypted next-hop address and HMAC for integrity.',
    radius: 1.6,
    opacity: 0.38,
  },
  {
    index: 2,
    name: 'Payload Wrapper',
    color: '#00e5ff',
    description: 'ChaCha20 stream-ciphered payload wrapping.',
    radius: 1.25,
    opacity: 0.40,
  },
  {
    index: 3,
    name: 'Inner Header',
    color: '#a855f7',
    description: 'Per-hop blinding factor and ephemeral key material.',
    radius: 0.92,
    opacity: 0.45,
  },
  {
    index: 4,
    name: 'Payload',
    color: COLORS.green,
    description: 'Application payload — visible only at the final destination.',
    radius: 0.6,
    opacity: 0.6,
  },
]

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SphinxSceneProps {
  peeledCount: number
  onPeelComplete?: () => void
  peeling: boolean
}

// ── Burst particles ────────────────────────────────────────────────────────────

interface BurstParticlesProps {
  color: string
  active: boolean
}

function BurstParticles({ color, active }: BurstParticlesProps) {
  const groupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)

  const COUNT = 60
  const [velocities, origins] = useMemo(() => {
    const vels: THREE.Vector3[] = []
    const orgs: THREE.Vector3[] = []
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 0.04 + Math.random() * 0.06
      vels.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        )
      )
      orgs.push(new THREE.Vector3(0, 0, 0))
    }
    return [vels, orgs]
  }, [])

  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((_, delta) => {
    if (!active) {
      progressRef.current = 0
      meshRefs.current.forEach((m) => {
        if (m) {
          m.position.set(0, 0, 0)
          m.visible = false
        }
      })
      return
    }
    progressRef.current = Math.min(progressRef.current + delta * 1.5, 1)
    const t = progressRef.current
    meshRefs.current.forEach((m, i) => {
      if (!m) return
      m.visible = t > 0 && t < 1
      m.position.copy(origins[i]).addScaledVector(velocities[i], t * 40)
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * 0.9
    })
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      {Array.from({ length: COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el }}
        >
          <sphereGeometry args={[0.025, 4, 4]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Route blinding scan plane ─────────────────────────────────────────────────

function BlindingScanPlane() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    // Sweep up and down through the cylinder height range (-1.6 to 1.6)
    meshRef.current.position.y = Math.sin(t * 0.55) * 1.6
    ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.04 + Math.abs(Math.sin(t * 0.55)) * 0.06
  })

  return (
    <mesh ref={meshRef} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[2.2, 2.2, 0.015, 64, 1, true]} />
      <meshBasicMaterial
        color={COLORS.primary ?? '#6effc7'}
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ── Single cylinder layer ─────────────────────────────────────────────────────

interface CylinderLayerProps {
  layer:        SphinxLayer
  peeled:       boolean
  isTop:        boolean
  animProgress: number
  revealT:      number
}

function CylinderLayer({ layer, peeled, isTop, animProgress }: CylinderLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current || !glowRef.current) return

    // Read live reveal value from module-level array (updated by SphinxScene.useFrame)
    const revealT = _revealTs[layer.index] ?? 0
    // Staggered reveal on mount (revealT: 0→1)
    const revealScale = 0.6 + revealT * 0.4
    const revealOpacity = revealT

    if (isTop && animProgress > 0) {
      // Peel: expand + rotate + fade
      const peelScale = revealScale * (1 + animProgress * 1.8)
      meshRef.current.scale.setScalar(peelScale)
      glowRef.current.scale.setScalar(peelScale)
      meshRef.current.rotation.y = animProgress * Math.PI * 0.8
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = (1 - animProgress) * layer.opacity * revealOpacity
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial
      glowMat.opacity = (1 - animProgress) * 0.14 * revealOpacity
    } else if (peeled) {
      meshRef.current.visible = false
      glowRef.current.visible = false
    } else {
      meshRef.current.visible = true
      glowRef.current.visible = true
      meshRef.current.scale.setScalar(revealScale)
      glowRef.current.scale.setScalar(revealScale)
      meshRef.current.rotation.y = 0
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = layer.opacity * revealOpacity
      // Briefly intensify when layer above was just peeled
    }
  })

  const height = 3.2
  const segments = 64

  return (
    <group>
      {/* Main cylinder */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[layer.radius, layer.radius, height, segments, 1, true]} />
        <meshStandardMaterial
          color={layer.color}
          emissive={layer.color}
          emissiveIntensity={0.4}
          transparent
          opacity={layer.opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe ring top */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[layer.radius + 0.02, layer.radius + 0.02, height + 0.04, segments, 1, true]} />
        <meshBasicMaterial
          color={layer.color}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          wireframe
        />
      </mesh>

      {/* Top cap glow ring */}
      {!peeled && (
        <mesh position={[0, height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[layer.radius - 0.05, layer.radius + 0.05, 64]} />
          <meshBasicMaterial
            color={layer.color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  )
}

// ── Main Sphinx Scene ─────────────────────────────────────────────────────────

const REVEAL_STAGGER = 0.22  // seconds between layer reveals

// Module-level mutable array so CylinderLayer.useFrame can read live values
// without requiring a React re-render per frame.
const _revealTs: number[] = LAYERS.map(() => 0)

export default function SphinxScene({ peeledCount, peeling, onPeelComplete }: SphinxSceneProps) {
  const groupRef      = useRef<THREE.Group>(null)
  const animProgressRef = useRef(0)
  const peelingRef    = useRef(false)
  const lastPeelRef   = useRef(-1)

  // Per-layer reveal progress (0→1), driven by mount time — writes to _revealTs (module-level)
  // to avoid re-renders per frame while keeping CylinderLayer.useFrame reading live values.
  const revealStartRef = useRef<number | null>(null)

  peelingRef.current = peeling

  useFrame(({ clock }, delta) => {
    // Slow rotate
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22
    }

    // Animate peel
    if (peelingRef.current && lastPeelRef.current !== peeledCount) {
      animProgressRef.current = Math.min(animProgressRef.current + delta * 1.8, 1)
      if (animProgressRef.current >= 1) {
        lastPeelRef.current = peeledCount
        animProgressRef.current = 0
        onPeelComplete?.()
      }
    }

    // Layer reveal animation on mount — mutate module-level array, no React re-render
    if (revealStartRef.current === null) {
      revealStartRef.current = clock.getElapsedTime()
    }
    const elapsed = clock.getElapsedTime() - revealStartRef.current
    LAYERS.forEach((l) => {
      _revealTs[l.index] = Math.min(1, Math.max(0, (elapsed - l.index * REVEAL_STAGGER) / 0.45))
    })
  })

  const visibleLayers = LAYERS.slice(peeledCount)
  const topLayer      = visibleLayers[0]

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.28} color="#1a1a2e" />
      <pointLight position={[4, 4, 4]}   intensity={3.2} color={COLORS.neonBlue} distance={22} />
      <pointLight position={[-4, -2, -4]} intensity={2.2} color={COLORS.purple}  distance={18} />
      <pointLight position={[0, 6, 2]}   intensity={1.2} color="#ffffff"         distance={14} />

      <group ref={groupRef}>
        {/* Route blinding scan plane */}
        <BlindingScanPlane />

        {LAYERS.map((layer) => {
          const isPeeled = layer.index < peeledCount
          const isTop    = topLayer ? layer.index === topLayer.index : false
          const animProg = isTop && peeling ? animProgressRef.current : 0
          return (
            <CylinderLayer
              key={layer.index}
              layer={layer}
              peeled={isPeeled}
              isTop={isTop}
              animProgress={animProg}
              revealT={0}
            />
          )
        })}

        {/* Burst particles on peel */}
        {topLayer && (
          <BurstParticles color={topLayer.color} active={peeling} />
        )}

        {/* Labels for visible layers */}
        {visibleLayers.slice(0, 3).map((layer) => (
          <Html
            key={layer.index}
            position={[layer.radius + 0.3, 0.5 - layer.index * 0.4, 0]}
            distanceFactor={8}
            occlude={false}
          >
            <div
              style={{
                pointerEvents: 'none',
                background: 'rgba(5,5,8,0.88)',
                border: `1px solid ${layer.color}55`,
                borderRadius: 4,
                padding: '2px 9px',
                color: layer.color,
                fontSize: 9,
                fontFamily: 'var(--font-jetbrains-mono)',
                whiteSpace: 'nowrap',
                boxShadow: `0 0 10px ${layer.color}35`,
                opacity: _revealTs[layer.index] ?? 0,
              }}
            >
              {layer.name}
            </div>
          </Html>
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={13}
        dampingFactor={0.08}
        enableDamping
      />

      <EffectComposer>
        <Bloom
          intensity={1.65}
          luminanceThreshold={0.13}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

export { LAYERS }
