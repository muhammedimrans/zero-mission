'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import LogoMark from '@/components/ui/LogoMark'

const NAV = [
  { href: '/network',          label: 'Network' },
  { href: '/architecture',     label: 'Architecture' },
  { href: '/sphinx',           label: 'Sphinx' },
  { href: '/circuit-builder',  label: 'Circuits' },
  { href: '/packet-explorer',  label: 'Packets' },
  { href: '/network-flow',     label: 'Flow' },
  { href: '/node-discovery',   label: 'Nodes' },
  { href: '/daemon-startup',   label: 'Daemon' },
  { href: '/cryptography',     label: 'Crypto' },
  { href: '/crypto-encrypt',   label: 'Encrypt' },
  { href: '/hidden-services',  label: 'Hidden Svc' },
  { href: '/dashboard',        label: 'Dashboard' },
  { href: '/roadmap',          label: 'Roadmap' },
] as const

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href
  return (
    <Link
      href={href}
      className={
        isActive
          ? 'text-[12px] font-medium text-primary'
          : 'text-[12px] font-medium text-text-secondary transition-colors hover:text-primary'
      }
    >
      {label}
    </Link>
  )
}

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all ${
        scrolled
          ? 'border-border bg-background/85 backdrop-blur-xl'
          : 'border-transparent bg-background/40 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-12">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Zero Protocol home">
          <LogoMark />
          <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
            Zero Mission
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-3 xl:flex">
          {NAV.map((n) => (
            <NavItem key={n.href} {...n} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Live status — desktop only */}
          <div className="hidden items-center gap-2 sm:flex">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
            <span className="label-caps text-[10px] text-primary/80">Network Online</span>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary xl:hidden"
          >
            <span aria-hidden>{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          aria-label="Mobile"
          className="border-t border-border bg-background/95 px-6 py-4 xl:hidden"
        >
          <ul className="flex flex-col gap-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
