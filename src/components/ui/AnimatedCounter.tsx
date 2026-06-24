'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
  // legacy compat
  target?: number
  decimals?: number
}

export default function AnimatedCounter({
  value,
  target,
  duration = 2000,
  decimals = 0,
  suffix = '',
  prefix = '',
  className = '',
}: AnimatedCounterProps) {
  const finalTarget = value ?? target ?? 0
  const [current, setCurrent] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const hasStarted = useRef(false)

  const isInView = useInView(containerRef, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView || hasStarted.current) return
    hasStarted.current = true

    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(finalTarget * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setCurrent(finalTarget)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [isInView, finalTarget, duration])

  const formatted = current.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={containerRef} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
