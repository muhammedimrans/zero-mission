import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import NavBar from '@/components/ui/NavBar'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Zero Protocol | Private Internet Infrastructure',
  description:
    'A production-grade visualization of anonymous routing, mix networks, and Sphinx packet encryption — built with Next.js 15 and Three.js.',
  keywords: ['zero protocol', 'privacy', 'mix network', 'anonymous routing', 'sphinx'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={{ background: '#050508' }}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: '#050508', color: '#f0f4ff' }}
      >
        <NavBar />
        {children}
      </body>
    </html>
  )
}
