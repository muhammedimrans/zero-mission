'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AtmosphericGlowProps {
  radius?: number
  color?: string
  opacity?: number
}

export default function AtmosphericGlow({
  radius = 1.05,
  color = '#38bdf8',
  opacity = 0.12,
}: AtmosphericGlowProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = opacity + Math.sin(clock.getElapsedTime() * 0.8) * 0.03
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
