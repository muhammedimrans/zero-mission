'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import AtmosphericGlow from './AtmosphericGlow'

interface GlobeProps {
  radius?: number
  wireframe?: boolean
}

export default function Globe({ radius = 1, wireframe = false }: GlobeProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05
    }
  })

  return (
    <group>
      {/* Core globe */}
      <Sphere ref={meshRef} args={[radius, 64, 64]} receiveShadow>
        <meshStandardMaterial
          color="#050510"
          emissive="#0a1a3a"
          emissiveIntensity={0.3}
          roughness={0.8}
          metalness={0.2}
          wireframe={wireframe}
        />
      </Sphere>

      {/* Grid overlay */}
      <Sphere args={[radius + 0.001, 36, 36]}>
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </Sphere>

      {/* Atmospheric glow */}
      <AtmosphericGlow radius={radius * 1.08} color="#00d4ff" opacity={0.1} />
      <AtmosphericGlow radius={radius * 1.15} color="#7c3aed" opacity={0.05} />
    </group>
  )
}
