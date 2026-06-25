'use client'

import { motion } from 'framer-motion'
import SectionReveal from '@/components/layout/SectionReveal'
import Link from 'next/link'

// ── Animation helpers ─────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }

// ── Design tokens ─────────────────────────────────────────────────

const CARD = {
  background: 'linear-gradient(180deg, rgba(15,18,22,0.92) 0%, rgba(15,18,22,0.5) 100%)',
  border: '1px solid rgba(139,148,158,0.18)',
} as const

// ── Data ──────────────────────────────────────────────────────────

const PRIMITIVES = [
  {
    prim:    'ML-KEM-768',
    badge:   'NIST FIPS 203',
    crate:   'ml-kem = "=0.3.0-pre"',
    color:   '#38bdf8',
    where:   'PQ Sphinx V2 per-hop handshake (pq_sphinx.rs), HS circuit (hs_circuit.rs), client-guard 0x30/0x31 handshake',
    details: [
      ['Encapsulation key (EK)', '1184 B'],
      ['Ciphertext (CT)',        '1088 B'],
      ['Shared secret (SS)',     '32 B'],
      ['CT array (pq_cts)',      '4 × 1088 = 4352 B'],
      ['PQ V2 header total',     '4929 B'],
    ],
    note: 'Hybrid with X25519: attacker must break both simultaneously. Trial decapsulation fills unused slots with random CTs.',
  },
  {
    prim:    'X25519',
    badge:   'RFC 7748',
    crate:   'x25519-dalek = "2"',
    color:   '#6effc7',
    where:   'Sphinx per-hop ECDH (sphinx.rs build_sphinx_packet()), HS circuit sessions (hs_circuit.rs), client-node session establishment',
    details: [
      ['Key size',        '32 B'],
      ['ALPHA field',     '32 B (ephemeral key in header)'],
      ['Usage',           'build_sphinx_packet() + HsSphinxCircuit'],
      ['HsIdentity',      'dh_secret (hidden_service.rs)'],
    ],
    note: 'Alpha re-randomization: multiply by blinding scalar derived from k_blind after each hop.',
  },
  {
    prim:    'ChaCha20',
    badge:   'C03-1 fix',
    crate:   'chacha20 = "0.9"',
    color:   '#818cf8',
    where:   'Sphinx BETA routing layer keystream — xor_stream() in sphinx.rs. Replaces earlier BLAKE2b-CTR (security fix C03-1).',
    details: [
      ['Key',   'Per-packet unique ECDH output (k_enc)'],
      ['Nonce', 'All-zeros (safe: key is unique per packet)'],
      ['Usage', 'xor_stream(beta, k_enc) to peel routing layer'],
    ],
    note: 'Key is derived per packet from ECDH shared secret, so nonce reuse is safe — each key is cryptographically unique.',
  },
  {
    prim:    'XChaCha20-Poly1305',
    badge:   'AEAD',
    crate:   'chacha20poly1305 = "0.10"',
    color:   '#a855f7',
    where:   'Node private key encryption at rest (key_protect.rs), encrypted backup archives (node_ops.rs), HS client sessions (hs_client.rs)',
    details: [
      ['Nonce',          '24 B (XChaCha20 extended nonce)'],
      ['Tag',            '16 B Poly1305 MAC'],
      ['Key derivation', 'Argon2id → XChaCha20-Poly1305 (Unix)'],
      ['Payload AEAD',   'key k_pay, deterministic nonce sphinx_payload_nonce(k_pay)'],
    ],
    note: 'C04-1 fix: payload nonce is deterministic, domain-separated — prevents nonce reuse across hops.',
  },
  {
    prim:    'BLAKE2b',
    badge:   'KDF / MAC',
    crate:   'blake2 = "0.10"',
    color:   '#34d399',
    where:   'Sphinx KDF tree (derive_hop_keys()), Sphinx MAC (compute_mac()), DHT node IDs, circuit key derivation (pq_kdf.rs)',
    details: [
      ['k_enc label',   '"zero-sphinx-v1-enc"'],
      ['k_mac label',   '"zero-sphinx-v1-mac"'],
      ['k_blind label', '"zero-sphinx-v1-blind"'],
      ['k_pay label',   '"zero-sphinx-v1-pay"'],
      ['k_reply label', '"zero-sphinx-v1-reply"'],
      ['DHT node ID',   'BLAKE2b-256(Ed25519 signing pubkey)'],
      ['PQ routing',    '"zero-pq-sphinx-v2-routing"'],
      ['Circuit key',   '"zero-pq-v1-ck:" prefix (pq_kdf.rs)'],
    ],
    note: 'C04-4 fix: each label is unique and unambiguous — prevents cross-context key confusion. Native keyed mode for MAC.',
  },
  {
    prim:    'Ed25519',
    badge:   'RFC 8032',
    crate:   'ed25519-dalek = "2"',
    color:   '#fbbf24',
    where:   'Node advertisements (node_ads.rs), DHT node descriptors, hidden service identity (hidden_service.rs), release manifest signing',
    details: [
      ['NodeAd prefix',    'b"zero-node-ad-v2"'],
      ['Release domain',   '"zero-release-v1"'],
      ['DNS signing',      'ZeroDnsRecord canonical bytes'],
      ['HsIdentity',       'signing_key in hidden_service.rs'],
      ['Persistence',      '64 B raw: 32B seed + 32B X25519 sk'],
    ],
    note: 'All node advertisements are self-certified. DHT storage nodes cannot forge records.',
  },
  {
    prim:    'Argon2id',
    badge:   'UNIX',
    crate:   'argon2 = "0.5"',
    color:   '#f59e0b',
    where:   'Unix node private key wrapping (key_protect.rs), encrypted backup archives — same derivation path',
    details: [
      ['Memory (m)',  '64 MiB'],
      ['Iterations (t)', '3'],
      ['Parallelism (p)', '1'],
      ['Salt',       '16 B random'],
      ['Output',     '32 B key → XChaCha20-Poly1305'],
      ['File magic', 'ZKP\\x01 (4B) + method 0x01 + salt + nonce + ciphertext'],
    ],
    note: 'Plaintext legacy keys are auto-migrated on first load when ZERO_KEY_PASSPHRASE env var is set.',
  },
  {
    prim:    'DPAPI',
    badge:   'WINDOWS',
    crate:   'windows-sys = "0.52"',
    color:   '#94a3b8',
    where:   'IPC auth token (ipc.rs CryptProtectData/CryptUnprotectData), node private key wrapping on Windows (key_protect.rs METHOD_DPAPI=0x02)',
    details: [
      ['Method byte',  '0x02'],
      ['Bound to',     'Windows user logon key'],
      ['IPC token',    'TOKEN_EXPIRY_SECS=28800 (8h)'],
      ['File magic',   'ZKP\\x01 (4B) + method 0x02 + opaque DPAPI blob'],
    ],
    note: 'DPAPI binds the encrypted key to the Windows user account — cannot be decrypted on another machine or as another user.',
  },
  {
    prim:    'subtle (constant-time)',
    badge:   'CT ops',
    crate:   'subtle = "2"',
    color:   '#e2e8f0',
    where:   'IPC token comparison, reply MAC verification (sphinx.rs verify_reply_mac()), binary hash comparison in release_manager.rs',
    details: [
      ['verify_reply_mac()', 'Constant-time BLAKE2b comparison'],
      ['IPC token',          'ct_eq() comparison to prevent timing attacks'],
      ['Release hash',       'Binary SHA-256 comparison'],
    ],
    note: 'All security-sensitive comparisons use subtle to prevent timing side-channel attacks.',
  },
]

const KDF_LABELS = [
  { label: 'zero-sphinx-v1-enc',   key: 'k_enc',   use: 'ChaCha20 BETA routing layer keystream' },
  { label: 'zero-sphinx-v1-mac',   key: 'k_mac',   use: 'BLAKE2b keyed header MAC (gamma field)' },
  { label: 'zero-sphinx-v1-blind', key: 'k_blind', use: 'Alpha re-randomization scalar' },
  { label: 'zero-sphinx-v1-pay',   key: 'k_pay',   use: 'Payload XChaCha20-Poly1305 AEAD key' },
  { label: 'zero-sphinx-v1-reply', key: 'k_reply', use: 'MSG_SPHINX_REPLY authentication key' },
]

const PQ_LABELS = [
  { label: 'zero-pq-sphinx-v2-routing', use: 'PQ hybrid routing secret (pq_sphinx.rs)' },
  { label: 'zero-pq-v1-ck:',            use: 'Circuit key derivation (pq_kdf.rs) — prefix || ss_x || ss_pq' },
  { label: 'zero-pq-sphinx-v2-*',       use: 'Per-hop keys in PQ Sphinx V2 (same structure as V1)' },
]

const KEY_PROTECT_METHODS = [
  { method: '0x01', name: 'Argon2id + XChaCha20-Poly1305', platform: 'Unix', color: '#f59e0b',
    format: '[4B magic "ZKP\\x01"][1B method=0x01][16B salt][24B nonce][ciphertext+16B tag]' },
  { method: '0x02', name: 'DPAPI', platform: 'Windows', color: '#94a3b8',
    format: '[4B magic "ZKP\\x01"][1B method=0x02][opaque DPAPI blob]' },
]

const SPHINX_V1_WIRE = [
  { offset: '0',    size: '32',   field: 'alpha',   desc: 'Ephemeral X25519 public key' },
  { offset: '32',   size: '32',   field: 'gamma',   desc: 'Header MAC — BLAKE2b keyed with k_mac over alpha‖beta' },
  { offset: '64',   size: '512',  field: 'beta',    desc: 'Routing layers — 4 hops × 64 B/slot (32B addr + 32B MAC)' },
  { offset: '576',  size: '1024', field: 'payload', desc: 'Encrypted payload — XChaCha20-Poly1305 per hop' },
]

const SPHINX_V2_WIRE = [
  { offset: '0',    size: '1',    field: 'version',  desc: 'PQ_SPHINX_VERSION_V2 = 0x02' },
  { offset: '1',    size: '32',   field: 'alpha',    desc: 'X25519 ephemeral key' },
  { offset: '33',   size: '32',   field: 'gamma',    desc: 'Header MAC' },
  { offset: '65',   size: '512',  field: 'beta',     desc: 'Routing layers (same structure as V1)' },
  { offset: '577',  size: '4352', field: 'pq_cts',   desc: 'ML-KEM-768 ciphertexts: 4 × 1088 B (real + random fill)' },
  { offset: '4929', size: 'var',  field: 'payload',  desc: 'Encrypted payload' },
]

// ── Page ──────────────────────────────────────────────────────────

export default function CryptographyPage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="border-b border-border bg-surface-low/20">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Cryptographic Stack</div>
            <h1 className="mt-3 font-display text-4xl font-semibold text-text-primary md:text-5xl">
              Every primitive, documented.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-text-secondary">
              Zero Protocol uses nine cryptographic primitives, each chosen for a specific purpose.
              This page documents the complete stack, wire formats, KDF labels, and key-at-rest protection schemes.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['sphinx.rs', 'pq_sphinx.rs', 'crypto.rs', 'key_protect.rs', 'pq_kdf.rs'].map((f) => (
                <span key={f} className="label-caps text-[9px] px-2 py-1 rounded font-mono"
                  style={{ color: 'var(--primary)', background: 'rgba(110,255,199,0.08)', border: '1px solid rgba(110,255,199,0.2)' }}>
                  {f}
                </span>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Primitive Cards ── */}
      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
        <SectionReveal>
          <div className="label-caps text-[10px] text-primary">Primitives</div>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Nine primitives, zero choices left to chance.</h2>
        </SectionReveal>

        <motion.div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {PRIMITIVES.map((p) => (
            <motion.div key={p.prim} variants={fadeUp} className="rounded-xl p-5 flex flex-col gap-3" style={CARD}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-base font-bold" style={{ color: p.color }}>{p.prim}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{p.crate}</p>
                </div>
                <span className="label-caps text-[9px] px-2 py-0.5 rounded flex-shrink-0"
                  style={{ color: p.color, border: `1px solid ${p.color}33`, background: `${p.color}0d` }}>
                  {p.badge}
                </span>
              </div>

              <p className="text-xs text-text-secondary">{p.where}</p>

              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(139,148,158,0.12)' }}>
                {p.details.map(([k, v], i) => (
                  <div key={k} className="flex justify-between px-3 py-2 gap-3"
                    style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{k}</span>
                    <span className="text-[10px] font-bold text-right" style={{ color: p.color, fontFamily: 'var(--font-jetbrains-mono)' }}>{v}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>{p.note}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── KDF Labels ── */}
      <section className="border-t border-border bg-surface-low/20">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">KDF Labels — derive_hop_keys()</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">BLAKE2b KDF tree labels.</h2>
            <p className="mt-3 text-sm text-text-secondary max-w-xl">
              Five independent 32-byte keys derived per hop from the shared ECDH secret.
              Unambiguous labels prevent cross-context key confusion (C04-4 fix).
            </p>
          </SectionReveal>

          <div className="mt-10 space-y-3">
            {/* V1 labels */}
            <div className="label-caps text-[9px] text-text-muted mb-3">Sphinx V1 (sphinx.rs)</div>
            {KDF_LABELS.map((l, i) => (
              <motion.div key={l.label} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.3 }}
                className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg"
                style={{ background: 'rgba(110,255,199,0.03)', border: '1px solid rgba(110,255,199,0.1)' }}>
                <code className="text-sm font-mono font-bold" style={{ color: 'var(--primary)' }}>{l.label}</code>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  → {l.key}
                </span>
                <span className="text-xs text-text-secondary">{l.use}</span>
              </motion.div>
            ))}

            {/* PQ V2 labels */}
            <div className="label-caps text-[9px] text-text-muted mt-6 mb-3">PQ Sphinx V2 (pq_sphinx.rs, pq_kdf.rs)</div>
            {PQ_LABELS.map((l, i) => (
              <motion.div key={l.label} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.3 }}
                className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg"
                style={{ background: 'rgba(56,189,248,0.03)', border: '1px solid rgba(56,189,248,0.1)' }}>
                <code className="text-sm font-mono font-bold" style={{ color: '#38bdf8' }}>{l.label}</code>
                <span className="text-xs text-text-secondary">{l.use}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wire Formats ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">Wire Formats</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Sphinx packet layouts.</h2>
          </SectionReveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {/* V1 */}
            <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-xl p-5 flex flex-col gap-4" style={CARD}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-text-primary">V1 Sphinx (sphinx.rs)</h3>
                <span className="label-caps text-[9px] px-2 py-0.5 rounded" style={{ color: 'var(--primary)', background: 'rgba(110,255,199,0.08)', border: '1px solid rgba(110,255,199,0.2)' }}>
                  SPHINX_LEN=1600 B
                </span>
              </div>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(139,148,158,0.12)' }}>
                <div className="grid grid-cols-4 px-3 py-2 text-[9px] font-bold text-text-muted" style={{ background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  <span>Offset</span><span>Size</span><span>Field</span><span>Description</span>
                </div>
                {SPHINX_V1_WIRE.map((r, i) => (
                  <div key={r.field} className="grid grid-cols-4 px-3 py-2.5 gap-2 text-[10px]"
                    style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', fontFamily: 'var(--font-jetbrains-mono)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{r.offset}</span>
                    <span style={{ color: '#38bdf8' }}>{r.size} B</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{r.field}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                ALPHA(32) + GAMMA(32) + BETA(512) + PAYLOAD(1024) = 1600 B — fits single Ethernet frame, avoids fragmentation
              </p>
            </motion.div>

            {/* V2 PQ */}
            <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="rounded-xl p-5 flex flex-col gap-4" style={CARD}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-text-primary">V2 PQ Sphinx (pq_sphinx.rs)</h3>
                <span className="label-caps text-[9px] px-2 py-0.5 rounded" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  HEADER=4929 B
                </span>
              </div>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(139,148,158,0.12)' }}>
                <div className="grid grid-cols-4 px-3 py-2 text-[9px] font-bold text-text-muted" style={{ background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  <span>Offset</span><span>Size</span><span>Field</span><span>Description</span>
                </div>
                {SPHINX_V2_WIRE.map((r, i) => (
                  <div key={r.field} className="grid grid-cols-4 px-3 py-2.5 gap-2 text-[10px]"
                    style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', fontFamily: 'var(--font-jetbrains-mono)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{r.offset}</span>
                    <span style={{ color: '#38bdf8' }}>{r.size}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{r.field}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                PQ_CT_ARRAY_LEN = 4×1088 = 4352 B. Unused slots filled with random CTs for indistinguishability.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Key Protection ── */}
      <section className="border-t border-border bg-surface-low/20">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">key_protect.rs</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Key protection on disk.</h2>
            <p className="mt-3 text-sm text-text-secondary max-w-xl">
              Node private keys are never stored in plaintext. Two methods are available — one per platform.
            </p>
          </SectionReveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {KEY_PROTECT_METHODS.map((m) => (
              <motion.div key={m.method} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-xl p-5 flex flex-col gap-4" style={CARD}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold" style={{ color: m.color }}>method {m.method}</span>
                  <span className="label-caps text-[9px] px-2 py-0.5 rounded" style={{ color: m.color, border: `1px solid ${m.color}33`, background: `${m.color}0d` }}>
                    {m.platform}
                  </span>
                </div>
                <p className="text-base font-semibold text-text-primary">{m.name}</p>
                <code className="text-xs rounded-lg p-3 font-mono text-text-secondary break-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,148,158,0.12)' }}>
                  {m.format}
                </code>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-xl p-4" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              <span style={{ color: '#fbbf24' }}>Auto-migration:</span> Plaintext legacy keys are automatically encrypted on first load
              when <code style={{ color: '#fbbf24' }}>ZERO_KEY_PASSPHRASE</code> (Unix) or DPAPI (Windows) is available.
            </p>
          </div>
        </div>
      </section>

      {/* ── Replay Window ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
          <SectionReveal>
            <div className="label-caps text-[10px] text-primary">replay.rs</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Replay protection.</h2>
          </SectionReveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'WINDOW_SIZE',       value: '65,536',                           color: 'var(--primary)' },
              { label: 'Data structure',    value: 'HashSet<[u8;24]> + VecDeque (FIFO)',color: '#38bdf8' },
              { label: 'Lifetime at L3',    value: '65536 / 25 pkt/s = 43.7 min',      color: '#34d399' },
              { label: 'Memory per window', value: '~4 MB',                             color: '#a855f7' },
              { label: 'Persistence',       value: 'replay_window_<port>.bin',          color: '#fbbf24' },
              { label: 'Coverage',          value: 'Per-circuit + global both enforced',color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 flex flex-col gap-1" style={CARD}>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>{s.label}</span>
                <span className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nav footer ── */}
      <section className="border-t border-border bg-surface-low/20">
        <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 flex flex-wrap gap-4">
          <Link href="/sphinx"       className="btn btn-ghost text-sm" style={{ textDecoration: 'none' }}>← Sphinx Routing</Link>
          <Link href="/architecture" className="btn btn-ghost text-sm" style={{ textDecoration: 'none' }}>Architecture →</Link>
          <Link href="/roadmap"      className="btn btn-ghost text-sm" style={{ textDecoration: 'none' }}>Roadmap →</Link>
        </div>
      </section>
    </div>
  )
}
