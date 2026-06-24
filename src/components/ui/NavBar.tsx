'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/network', label: 'Network' },
  { href: '/architecture', label: 'Architecture' },
  { href: '/sphinx', label: 'Sphinx' },
  { href: '/hidden-services', label: 'Hidden Services' },
  { href: '/threat-simulator', label: 'Threat Simulator' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height: '64px',
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
        boxShadow: 'inset 0 1px 0 0 rgba(0, 212, 255, 0.08)',
      }}
    >
      {/* Top neon border — gradient from transparent to #00d4ff to transparent */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #00d4ff 50%, transparent 100%)',
          opacity: 0.6,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="Zero Protocol home"
          >
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover:shadow-[0_0_16px_rgba(0,212,255,0.7)]"
              style={{
                background: 'rgba(0, 212, 255, 0.15)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                color: '#00d4ff',
                fontFamily: 'var(--font-space-grotesk)',
              }}
            >
              0P
            </div>
            <span className="flex items-center gap-0 text-base font-bold tracking-widest uppercase transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(0,212,255,0.9)]">
              <span
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: '#00d4ff',
                  letterSpacing: '0.15em',
                }}
              >
                ZERO
              </span>
              <span
                className="ml-1.5"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: '#ffffff',
                  letterSpacing: '0.15em',
                }}
              >
                PROTOCOL
              </span>
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="relative px-3 py-2 text-sm font-medium rounded-md overflow-hidden group/link transition-colors duration-200"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      color: isActive ? '#00d4ff' : '#a0aec0',
                      background: isActive ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                      textShadow: isActive ? '0 0 12px rgba(0, 212, 255, 0.5)' : 'none',
                      display: 'inline-block',
                    }}
                  >
                    <span className="relative z-10 transition-colors duration-200 group-hover/link:text-[#e2e8f0]">
                      {label}
                    </span>
                    {/* Animated underline — slides in from left on hover */}
                    <span
                      className="absolute bottom-0 left-0 h-px transition-all duration-300 ease-out"
                      style={{
                        width: isActive ? 'calc(100% - 24px)' : '0%',
                        left: '12px',
                        background: '#00d4ff',
                        boxShadow: '0 0 6px #00d4ff',
                      }}
                      aria-hidden="true"
                    />
                    <span
                      className="absolute bottom-0 left-3 right-3 h-px scale-x-0 origin-left transition-transform duration-300 ease-out group-hover/link:scale-x-100"
                      style={{
                        background: isActive ? 'transparent' : 'rgba(0, 212, 255, 0.7)',
                      }}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5 p-2 rounded-md transition-colors duration-200"
            style={{ color: '#a0aec0' }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span
              className="block w-5 h-0.5 transition-all duration-300 origin-center"
              style={{
                background: menuOpen ? '#00d4ff' : '#a0aec0',
                transform: menuOpen ? 'translateY(8px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all duration-300"
              style={{
                background: '#a0aec0',
                opacity: menuOpen ? 0 : 1,
                transform: menuOpen ? 'scaleX(0)' : 'scaleX(1)',
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all duration-300 origin-center"
              style={{
                background: menuOpen ? '#00d4ff' : '#a0aec0',
                transform: menuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: menuOpen ? '400px' : '0px',
          background: 'rgba(5, 5, 8, 0.97)',
          borderTop: menuOpen ? '1px solid rgba(0, 212, 255, 0.1)' : 'none',
        }}
      >
        <ul className="px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    color: isActive ? '#00d4ff' : '#a0aec0',
                    background: isActive ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                    textShadow: isActive ? '0 0 10px rgba(0,212,255,0.4)' : 'none',
                  }}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
