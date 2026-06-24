'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 500
const SPHERE_RADIUS = 3

export default function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const velocitiesRef = useRef<Float32Array | null>(null)

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    const sz = new Float32Array(PARTICLE_COUNT)
    const vel = new Float32Array(PARTICLE_COUNT * 3)

    const neonBlue = new THREE.Color('#38bdf8')
    const purple = new THREE.Color('#818cf8')

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random point in sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.cbrt(Math.random()) * SPHERE_RADIUS

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Drift velocity (outward direction, slow)
      const speed = 0.002 + Math.random() * 0.003
      vel[i * 3] = (pos[i * 3] / r) * speed
      vel[i * 3 + 1] = (pos[i * 3 + 1] / r) * speed
      vel[i * 3 + 2] = (pos[i * 3 + 2] / r) * speed

      // Color: mix neon blue and purple
      const t = Math.random()
      const c = neonBlue.clone().lerp(purple, t)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b

      sz[i] = 0.01 + Math.random() * 0.02
    }

    velocitiesRef.current = vel
    return { positions: pos, colors: col, sizes: sz }
  }, [])

  const posRef = useRef(positions.slice())

  useFrame(() => {
    const pts = pointsRef.current
    const vel = velocitiesRef.current
    if (!pts || !vel) return

    const attr = pts.geometry.attributes.position as THREE.BufferAttribute
    const arr = attr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] += vel[i * 3]
      arr[i * 3 + 1] += vel[i * 3 + 1]
      arr[i * 3 + 2] += vel[i * 3 + 2]

      // Distance from origin
      const dx = arr[i * 3]
      const dy = arr[i * 3 + 1]
      const dz = arr[i * 3 + 2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // Reset when particle drifts past boundary
      if (dist > SPHERE_RADIUS) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = 0.2 + Math.random() * 0.5
        arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        arr[i * 3 + 2] = r * Math.cos(phi)

        const speed = 0.002 + Math.random() * 0.003
        vel[i * 3] = (arr[i * 3] / r) * speed
        vel[i * 3 + 1] = (arr[i * 3 + 1] / r) * speed
        vel[i * 3 + 2] = (arr[i * 3 + 2] / r) * speed
      }
    }

    attr.needsUpdate = true
    void posRef
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.55}
        fog={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
