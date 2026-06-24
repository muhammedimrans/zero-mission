'use client'

import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ThreeSceneOptions {
  autoRotate?: boolean
  rotationSpeed?: number
}

export function useThreeScene(options: ThreeSceneOptions = {}) {
  const { autoRotate = true, rotationSpeed = 0.0005 } = options
  const groupRef = useRef<THREE.Group>(null)
  const clockRef = useRef(new THREE.Clock())

  useFrame(() => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed
    }
  })

  const getElapsed = useCallback(() => clockRef.current.getElapsedTime(), [])

  return { groupRef, getElapsed }
}
