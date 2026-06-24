'use client'

import { EffectComposer, DepthOfField as DepthOfFieldEffect } from '@react-three/postprocessing'

interface DepthOfFieldProps {
  focusDistance?: number
  focalLength?: number
  bokehScale?: number
}

export default function DepthOfField({
  focusDistance = 0,
  focalLength = 0.02,
  bokehScale = 2,
}: DepthOfFieldProps) {
  return (
    <EffectComposer>
      <DepthOfFieldEffect
        focusDistance={focusDistance}
        focalLength={focalLength}
        bokehScale={bokehScale}
      />
    </EffectComposer>
  )
}
