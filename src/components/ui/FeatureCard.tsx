'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface FeatureCardProps {
  title: string
  description: string
  icon?: string
  gradient?: string
  index?: number
  tag?: string
  iconNode?: React.ReactNode
}

export default function FeatureCard({
  title,
  description,
  tag,
  iconNode,
  index = 0,
}: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      className="bento-card overflow-hidden p-6 transition-all hover:border-primary/30"
    >
      {iconNode && (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            {iconNode}
          </div>
          {tag && (
            <span className="label-caps ml-auto rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[9px] text-primary">
              {tag}
            </span>
          )}
        </div>
      )}

      {!iconNode && tag && (
        <div className="label-caps mb-3 text-[9px] text-primary">{tag}</div>
      )}

      <h3 className="mt-5 font-display text-lg font-medium text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </motion.div>
  )
}
