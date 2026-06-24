'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, ReactNode } from 'react'
import { OrbitControls } from '@react-three/drei'

interface SceneProps {
  children: ReactNode
  className?: string
  controls?: boolean
  camera?: { position: [number, number, number]; fov: number }
}

export default function Scene({
  children,
  className = '',
  controls = true,
  camera = { position: [0, 0, 3], fov: 60 },
}: SceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={camera}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.15} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#7c3aed" />
          {children}
          {controls && (
            <OrbitControls
              enablePan={false}
              minDistance={1.5}
              maxDistance={6}
              autoRotate
              autoRotateSpeed={0.4}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
