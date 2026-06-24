'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ScrollAnimationOptions {
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  start?: string
  end?: string
  scrub?: boolean | number
}

export function useScrollAnimation<T extends HTMLElement>(
  options: ScrollAnimationOptions = {}
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const {
      from = { opacity: 0, y: 40 },
      to = { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      start = 'top 85%',
      end = 'bottom 20%',
      scrub = false,
    } = options

    const ctx = gsap.context(() => {
      gsap.fromTo(el, from, {
        ...to,
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub,
        },
      })
    })

    return () => ctx.revert()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return ref
}
