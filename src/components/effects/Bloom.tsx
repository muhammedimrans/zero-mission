'use client'

import { EffectComposer, Bloom as BloomEffect } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'

interface BloomProps {
  intensity?: number
  luminanceThreshold?: number
  luminanceSmoothing?: number
}

export default function Bloom({
  intensity = 1.5,
  luminanceThreshold = 0.2,
  luminanceSmoothing = 0.9,
}: BloomProps) {
  return (
    <EffectComposer>
      <BloomEffect
        blendFunction={BlendFunction.ADD}
        intensity={intensity}
        luminanceThreshold={luminanceThreshold}
        luminanceSmoothing={luminanceSmoothing}
        kernelSize={KernelSize.LARGE}
      />
    </EffectComposer>
  )
}
