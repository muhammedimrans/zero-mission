import Link from 'next/link'
import LogoMark from '@/components/ui/LogoMark'

const cols: { title: string; links: [string, string][] }[] = [
  {
    title: 'Protocol',
    links: [
      ['/architecture', 'Architecture'],
      ['/sphinx', 'Sphinx Routing'],
      ['/network', 'Network'],
      ['/hidden-services', 'Hidden Services'],
    ],
  },
  {
    title: 'Tools',
    links: [
      ['/dashboard', 'Dashboard'],
      ['/threat-simulator', 'Threat Simulator'],
    ],
  },
  {
    title: 'Zero Protocol',
    links: [
      ['https://0protocol.net', '0protocol.net'],
      ['https://github.com/muhammedimrans/Zero_VPN', 'GitHub'],
      ['https://x.com/0protocolnet', 'X (Twitter)'],
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-low/40">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:grid-cols-5 md:px-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-lg font-semibold text-text-primary">
              Zero Mission
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-text-muted">
            Live visualization of the Zero Protocol anonymous routing network. Sphinx packet
            encryption, selective mixnet, and hidden services — rendered in real time.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
            <span className="label-caps text-[10px] text-primary">Network Online</span>
          </div>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <div className="label-caps mb-4 text-[10px] text-text-muted">{col.title}</div>
            <ul className="space-y-2.5">
              {col.links.map(([href, label]) => (
                <li key={label}>
                  {href.startsWith('http') ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-6 py-5 text-xs text-text-muted md:flex-row md:items-center md:px-12">
          <div>© 2026 Zero Protocol. Project in testing — not production software.</div>
          <div className="font-mono">mission.0protocol.com</div>
        </div>
      </div>
    </footer>
  )
}
