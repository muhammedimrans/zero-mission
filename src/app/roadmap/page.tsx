'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import SectionReveal from '@/components/layout/SectionReveal'

// ── Animation ─────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }

const CARD = {
  background: 'linear-gradient(180deg, rgba(15,18,22,0.92) 0%, rgba(15,18,22,0.5) 100%)',
  border: '1px solid rgba(139,148,158,0.18)',
} as const

// ── Release history ───────────────────────────────────────────────

const RELEASES = [
  { tag: 'PC6F',       date: '2026-06-23', label: 'HS E2E validation attempt; ISP CGNAT blocked live circuit; code verified',              tests: 2294, status: 'done' as const },
  { tag: 'PC6E',       date: '2026-06-23', label: 'relay_cells_forwarded_total wired to Sphinx hot path; DHT re-bootstrap fix',             tests: 2294, status: 'done' as const },
  { tag: 'PC2',        date: '2026-06-21', label: 'clippy -D warnings enforced; cargo audit 0 CVEs; SBOM 249 packages; CI gate',           tests: 2294, status: 'done' as const },
  { tag: 'PC1',        date: '2026-06-20', label: 'node_monitor.rs Prometheus; 7 runbooks; systemd hardening network-online.target',        tests: 2282, status: 'done' as const },
  { tag: 'Beta Final', date: '2026-06-20', label: 'ReleaseDeploymentConfig activated; wintun version check wired in create_tun()',          tests: 2277, status: 'done' as const },
  { tag: 'Beta Ph2',   date: '2026-06-20', label: '79 clippy warnings → 0; CRYPTO-09/11/12 closed; ReleaseDeploymentConfig',               tests: 2277, status: 'done' as const },
  { tag: 'Release 20B',date: '2026-06-20', label: 'WAN bring-up: 4/4 VPS nodes live, gossip active, replay windows non-zero',              tests: 2236, status: 'done' as const },
  { tag: 'Release 18', date: '2026-06-20', label: 'Public alpha ops: OpsAssessment, R18 CLI — CONTROLLED ALPHA READY',                     tests: 2217, status: 'done' as const },
  { tag: 'Release 16', date: '2026-06-20', label: 'BootstrapRegistry, network validation CLI, doctor extended to 17 checks',               tests: 2163, status: 'done' as const },
  { tag: 'Release 13', date: '2026-06-20', label: 'PQ Sphinx V2: ML-KEM-768 per-hop, version=0x02, pq_cts array 4352B, NodeAd V2',         tests: 1986, status: 'done' as const },
  { tag: 'Release 12', date: '2026-06-20', label: 'Vanguard protection: L2=4 nodes 1–3d, L3=8 nodes 1–7d, persistence',                   tests: 1873, status: 'done' as const },
  { tag: 'Release 11', date: '2026-06-19', label: 'ZERO_PROXY removed; HsSphinxCircuit wired; circuit splice in node.rs',                  tests: 1825, status: 'done' as const },
  { tag: 'Release 10B',date: '2026-06-19', label: 'IntroCircuitManager + RendezvousCircuitPool; INTRODUCE1/2, RENDEZVOUS1/2',               tests: 1611, status: 'done' as const },
  { tag: 'Release 9',  date: '2026-06-18', label: 'sodiumoxide removed; SOCKS5 RFC 1929 auth; CRYPTO-08 closed; AUTH-07 closed',           tests: 1408, status: 'done' as const },
  { tag: 'Release 6',  date: '2026-06-16', label: 'Node reputation: scoring, decay, path selection, persistence',                          tests: 1172, status: 'done' as const },
  { tag: 'Release 5',  date: '2026-06-16', label: 'Decentralized directory: 3-tier bootstrap, BootstrapCache, DirectoryMetrics',           tests: 1103, status: 'done' as const },
  { tag: 'CRYPTO-03/04',date: '2026-06-11',label: 'ChaCha20 keystream; deterministic nonce; BLAKE2b keyed MAC',                            tests: 659,  status: 'done' as const },
  { tag: 'W2-01/02',   date: '2026-06-10', label: 'CRYPTO-01: reply MAC; CRYPTO-02: strict session lookup',                                tests: 341,  status: 'done' as const },
  { tag: 'Audit',      date: '2026-06-03', label: '30 security findings at HEAD ea9f1bf — all CRITICAL/HIGH now closed',                   tests: 0,    status: 'done' as const },
]

// ── Current open items ────────────────────────────────────────────

const OPEN_ITEMS = [
  { id: 'AUTH-04', severity: 'LOW',  desc: 'IPC has no replay counter. DPAPI+PEERCRED+expiry accepted as sufficient mitigation at LOW severity.' },
  { id: 'AUTH-08', severity: 'LOW',  desc: 'DoH proxy is open resolver to local processes. loopback-only bind + MAX_INFLIGHT=20 is correct mitigation.' },
  { id: 'API-08',  severity: 'LOW',  desc: 'Malformed-packet log flood possible.' },
]

const KNOWN_LIMITATIONS = [
  { label: 'ISP CGNAT', desc: 'Jio and similar CGNAT networks block UDP responses on ephemeral high-numbered ports. Live WAN circuit tests require non-CGNAT connectivity.' },
  { label: 'L3+ TLS requirement', desc: 'At L3+, daemon forces TLS for Circuit[0]. VPS nodes without a TLS listener on port 8443 cause Circuit[0] timeout at L3. Workaround: --connect 2.' },
  { label: 'Guard DHT replication', desc: 'Guard node consistently shows 0/1 peers acked on DHT announce. Root cause: ISP ephemeral port blocking. Fallback-to-seeds active.' },
  { label: 'HS live WAN test', desc: 'End-to-end hidden service test on WAN not yet completed. 2294 unit tests pass; network test blocked by ISP CGNAT.' },
  { label: 'daemon.rs size', desc: '~2.5k LoC single file. Should be split into circuit.rs, tunnel.rs, health.rs, ipc_server.rs, state.rs.' },
  { label: 'Release signing', desc: 'ZERO_RELEASE_PUBKEY_HEX is the all-zeros placeholder. Release signing not yet deployed to https://releases.zero.network.' },
]

// ── Roadmap ───────────────────────────────────────────────────────

const ROADMAP_NEAR = [
  { item: 'Fix L3+ Circuit[0] TLS', desc: 'Configure TLS listener on VPS nodes or adjust use_tls logic for production.' },
  { item: 'Live WAN hidden service E2E', desc: 'Complete end-to-end HS test from non-CGNAT network.' },
  { item: 'Repository hygiene', desc: 'Remove scratchpads (*.log, *.diff, patch_dns.ps1), fix .gitignore, add tracing crate.' },
  { item: 'SECURITY.md + CHANGELOG.md + LICENSE', desc: 'Standard project hygiene files.' },
  { item: 'wintun.dll SHA-256 pin', desc: 'Move to build.rs download + verify instead of committed binary.' },
  { item: 'Fix guard DHT replication', desc: 'Resolve ephemeral port blocking on guard node ISP.' },
]

const ROADMAP_MID = [
  { item: 'Refactor daemon.rs', desc: 'Split ~2.5k LoC into circuit.rs, tunnel.rs, health.rs, ipc_server.rs, state.rs.' },
  { item: 'Refactor node.rs', desc: 'Move ~1200-line main loop to a typed message dispatcher.' },
  { item: 'Multi-signer directory consensus', desc: 'Signed key bundle shipped in binary.' },
  { item: 'Containerize relay', desc: 'Dockerfile + systemd unit + Helm chart.' },
  { item: 'Deploy release server', desc: 'ZERO_RELEASE_URL + ZERO_RELEASE_PUBKEY for enforced upgrade verification.' },
  { item: 'Loopix-style cell batching', desc: 'Replace static Poisson cover traffic.' },
]

const ROADMAP_LONG = [
  { item: 'Full PQ envelope', desc: 'Per-hop hybrid PQ Sphinx on every hop, client to exit.' },
  { item: 'Real TLS fronting', desc: 'Full TLS handshake fronting instead of cosmetic mimic.' },
  { item: 'Pluggable transports', desc: 'meek, Snowflake, V2Ray plugins via pluggable-transport trait.' },
  { item: 'Reputation gossip', desc: 'Cross-client trust and ban gossip.' },
  { item: 'Formal verification', desc: 'Formal verification of the cell-state machine.' },
  { item: 'External security audit', desc: 'Cure53, NCC Group, or Trail of Bits.' },
]

// ── Page ──────────────────────────────────────────────────────────

export default function RoadmapPage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="border-b border-border bg-surface-low/20">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Project Status</div>
            <h1 className="mt-3 font-display text-4xl font-semibold text-text-primary md:text-5xl">
              Roadmap & Release History
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/[0.08] px-3 py-1 label-caps text-[10px] text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                v0.1.0-alpha.1 — pre-alpha
              </span>
              <span className="label-caps text-[10px] px-3 py-1 rounded-full" style={{ color: 'var(--primary)', border: '1px solid rgba(110,255,199,0.3)', background: 'rgba(110,255,199,0.06)' }}>
                2294 tests passing
              </span>
              <span className="label-caps text-[10px] px-3 py-1 rounded-full" style={{ color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.06)' }}>
                0 CVEs (cargo audit)
              </span>
              <span className="label-caps text-[10px] px-3 py-1 rounded-full" style={{ color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)' }}>
                NOT production ready
              </span>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Open Security Items ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Security Audit Status</div>
            <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">All CRITICAL and HIGH findings closed.</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Original audit: 30 findings. CRYPTO-01/02/03/04/05/06/07/08/09/11/12/13, AUTH-02/03/05/06/07, API-01/02/03/07, INFRA — all closed.
            </p>
          </SectionReveal>
          <div className="mt-8 space-y-3">
            {OPEN_ITEMS.map((item) => (
              <div key={item.id} className="flex flex-wrap items-start gap-4 px-4 py-3 rounded-lg"
                style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-sm font-bold" style={{ color: '#fbbf24' }}>{item.id}</span>
                  <span className="label-caps text-[8px] px-1.5 py-0.5 rounded" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                    {item.severity}
                  </span>
                  <span className="label-caps text-[8px] px-1.5 py-0.5 rounded" style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)' }}>
                    ACCEPTED RISK
                  </span>
                </div>
                <p className="text-sm text-text-secondary flex-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Known Limitations ── */}
      <section className="border-b border-border bg-surface-low/20">
        <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Known Limitations</div>
            <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">Current technical gaps.</h2>
          </SectionReveal>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {KNOWN_LIMITATIONS.map((l) => (
              <div key={l.label} className="rounded-xl p-4 flex flex-col gap-2" style={CARD}>
                <span className="text-sm font-semibold" style={{ color: '#f87171' }}>{l.label}</span>
                <p className="text-xs text-text-secondary">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Roadmap</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">What&apos;s next.</h2>
          </SectionReveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {[
              { title: 'Short-Term (6 weeks)', color: 'var(--primary)', badge: 'NEXT', items: ROADMAP_NEAR },
              { title: 'Mid-Term (3 months)',  color: '#818cf8',        badge: 'SOON', items: ROADMAP_MID },
              { title: 'Long-Term (6+ months)',color: '#94a3b8',        badge: 'LATER', items: ROADMAP_LONG },
            ].map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="font-display text-lg font-semibold text-text-primary">{section.title}</h3>
                  <span className="label-caps text-[9px] px-2 py-0.5 rounded" style={{ color: section.color, border: `1px solid ${section.color}33`, background: `${section.color}0d` }}>
                    {section.badge}
                  </span>
                </div>
                <motion.div className="space-y-3" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {section.items.map((item) => (
                    <motion.div key={item.item} variants={fadeUp} className="rounded-xl p-4" style={CARD}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full" style={{ background: section.color }} />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{item.item}</p>
                          <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Release History ── */}
      <section className="bg-surface-low/20">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Release History</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">
              {RELEASES.length} releases since audit baseline.
            </h2>
          </SectionReveal>

          <div className="mt-10 space-y-2">
            {RELEASES.map((r, i) => (
              <motion.div key={r.tag + r.date} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.3 }}
                className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: '1px solid rgba(139,148,158,0.08)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" style={{ opacity: i < 3 ? 1 : 0.5 }} />
                  <span className="font-mono text-xs font-bold min-w-[100px]" style={{ color: i < 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {r.tag}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', minWidth: 80 }}>{r.date}</span>
                <span className="text-xs text-text-secondary flex-1">{r.label}</span>
                {r.tests > 0 && (
                  <span className="label-caps text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ color: '#34d399', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    {r.tests.toLocaleString()} tests
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Test count progression note */}
          <div className="mt-8 rounded-xl p-4" style={{ background: 'rgba(110,255,199,0.04)', border: '1px solid rgba(110,255,199,0.12)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              <span style={{ color: 'var(--primary)' }}>Test progression:</span>
              {' '}341 (W2) → 659 (CRYPTO-03/04) → 1103 (Rel 5) → 1408 (Rel 9) → 1825 (Rel 11) → 2163 (Rel 16) → 2294 (PC2/PC6E/PC6F).
              All 2294 tests currently passing. Run: <code>cargo test</code>
            </p>
          </div>
        </div>
      </section>

      {/* ── Nav ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 flex flex-wrap gap-4">
          <Link href="/"            className="btn btn-ghost text-sm" style={{ textDecoration: 'none' }}>← Home</Link>
          <Link href="/architecture" className="btn btn-ghost text-sm" style={{ textDecoration: 'none' }}>Architecture →</Link>
          <Link href="/cryptography" className="btn btn-ghost text-sm" style={{ textDecoration: 'none' }}>Cryptography →</Link>
        </div>
      </section>
    </div>
  )
}
