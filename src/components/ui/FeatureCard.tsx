'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface FeatureCardProps {
  title: string
  description: string
  icon: string
  gradient: string
  index?: number
}

export default function FeatureCard({
  title,
  description,
  icon,
  gradient,
  index = 0,
}: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.025, y: -4 }}
      className="group relative rounded-2xl overflow-hidden cursor-default"
      style={{
        background: 'rgba(10, 10, 20, 0.65)',
        border: '1px solid rgba(0, 212, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '1.75rem',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0, 212, 255, 0.28)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 0 32px rgba(0, 212, 255, 0.08), 0 8px 32px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0, 212, 255, 0.08)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Top edge gradient glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${gradient.split(',')[0].replace('linear-gradient(135deg,', '').trim()} 50%, transparent 100%)`,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Corner accent */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-16 h-16 opacity-10 group-hover:opacity-20"
        style={{
          background: gradient,
          borderRadius: '0 1rem 0 100%',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
        style={{
          background: 'rgba(0, 212, 255, 0.08)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="text-base font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          color: '#f0f4ff',
          letterSpacing: '0.01em',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{
          color: '#718096',
          fontFamily: 'var(--font-space-grotesk)',
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>
    </motion.div>
  )
}
