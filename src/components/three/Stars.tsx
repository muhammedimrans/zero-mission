'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarsProps {
  count?: number
  radius?: number
  depth?: number
  factor?: number
  speed?: number
}

export default function Stars({
  count = 3000,
  radius = 100,
  depth = 50,
  factor = 4,
  speed = 0.0003,
}: StarsProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius + Math.random() * depth
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      sz[i] = Math.random() * factor
    }
    return [pos, sz]
  }, [count, radius, depth, factor])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += speed
      pointsRef.current.rotation.x += speed * 0.3
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        sizeAttenuation
        color="#a0c4ff"
        transparent
        opacity={0.6}
        fog={false}
      />
    </points>
  )
}
