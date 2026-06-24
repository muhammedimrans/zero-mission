import type { Metadata } from 'next'
import { Geist, Inter, JetBrains_Mono } from 'next/font/google'
import NavBar from '@/components/ui/NavBar'
import SiteFooter from '@/components/layout/SiteFooter'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Zero Mission | Zero Protocol Network Dashboard',
  description:
    'Live visualization of the Zero Protocol anonymous routing network — Sphinx packet encryption, mix networks, and hidden services.',
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
      className={`h-full antialiased dark ${geist.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {/* Status banner — matches 0protocol.net */}
        <div className="relative z-[60] w-full border-b border-primary/20 bg-primary/[0.06] py-2 text-center">
          <p className="label-caps text-[10px] text-primary/90">
            <span aria-hidden className="text-primary">●</span>{' '}
            Zero Mission — Live network visualization · Project in testing
          </p>
        </div>
        <NavBar />
        <main id="main" className="flex-grow">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
