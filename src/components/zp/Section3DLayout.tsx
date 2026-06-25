'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect, type ReactNode } from 'react'

interface Section3DLayoutProps {
  tagline: string
  title: string
  intro: string
  scene: ReactNode
  cameraPosition?: [number, number, number]
  cameraFov?: number
  info: ReactNode
  controls?: ReactNode
}

export default function Section3DLayout({
  tagline,
  title,
  intro,
  scene,
  info,
  controls,
  cameraPosition = [0, 1.5, 7],
  cameraFov = 50,
}: Section3DLayoutProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div
      className="flex w-full flex-col lg:flex-row"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      {/* 3D Canvas Pane */}
      <div className="relative" style={{ flex: '1 1 60%', minHeight: 520 }}>
        {mounted ? (
          <Canvas
            camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: 200 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            style={{ position: 'absolute', inset: 0, background: '#08090a' }}
            dpr={[1, 1.75]}
          >
            <Suspense fallback={null}>{scene}</Suspense>
          </Canvas>
        ) : (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ background: '#08090a' }}
          >
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Initializing 3D scene…
            </span>
          </div>
        )}

        {/* Overlay header */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 pt-6 md:px-10">
          <div
            className="label-caps text-[10px]"
            style={{ color: 'var(--primary)', opacity: 0.8 }}
          >
            {tagline}
          </div>
          <h1
            className="mt-2 text-2xl font-semibold leading-tight md:text-4xl"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, inherit)' }}
          >
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
            {intro}
          </p>
        </div>

        {/* Controls overlay at bottom */}
        {controls && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2">
            {controls}
          </div>
        )}
      </div>

      {/* Info Sidebar */}
      <aside
        className="border-t border-white/10 lg:border-l lg:border-t-0"
        style={{
          flex: '0 0 420px',
          maxWidth: '100%',
          background: 'rgba(8,9,10,0.92)',
          backdropFilter: 'blur(20px)',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        <div className="p-6 md:p-7">{info}</div>
      </aside>
    </div>
  )
}
