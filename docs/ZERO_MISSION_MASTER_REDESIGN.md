# Zero Mission — Master Redesign Plan

**Status:** Pre-implementation analysis  
**Source of truth:** `~/zero_protocol/visualization/index.html`  
**Target:** `mission.0protocol.com` — the living visualization layer of Zero Protocol

---

## 1. Problems With the Current Implementation

### 1.1 Color Identity Crisis

The most fundamental problem: zero-mission doesn't look like Zero Protocol.

| Token | Zero Protocol | zero-mission (current) | Problem |
|-------|--------------|------------------------|---------|
| Primary accent | `#38bdf8` (sky cyan) | `#00d4ff` (electric neon) | Neon feels generic, sky cyan feels precise |
| Mix nodes | `#818cf8` (indigo) | `#7c3aed` (violet) | Slightly different, inconsistent |
| Exit nodes | `#34d399` (emerald) | `#00ff88` (lime neon) | Lime is neon gaming, emerald is technical |
| Background | `#020b18` (deep navy) | `#050508` (near-black) | Loses the distinctive blue-black character |
| Card fill | `rgba(255,255,255,0.025)` | `rgba(10,10,20,0.6)` | Current is too opaque, loses depth |

A visitor who knows `0protocol.net` will not recognize `mission.0protocol.com` as part of the same ecosystem.

### 1.2 Missing Glow System

Zero Protocol's glow system is its most distinctive visual signature:

```css
--glow-b: 0 0 30px rgba(56,189,248,0.25), 0 0 80px rgba(56,189,248,0.08);
```

This dual-radius box-shadow (tight core + atmospheric halo) appears on **every interactive element**: cards, buttons, metric cards, threat cards, nav items.

Current zero-mission only applies `text-shadow` glow to text. Cards, buttons, and containers have **no glow on hover**. This is why interactions feel flat and disconnected from the visual identity.

### 1.3 Wrong Font Family

- **Zero Protocol:** `'SF Pro Display', -apple-system` — system-native, trusted, renders at native resolution
- **zero-mission:** `Space_Grotesk` (Google Font) — imported, slightly different rendering, slightly "designerly"

This is subtle but real. System fonts feel like native software. Google fonts feel like a website. For a protocol that promises to protect your identity, "feels like native software" is the right register.

### 1.4 Wrong Card Opacity

- **Zero Protocol card fill:** `rgba(255,255,255,0.025)` — nearly invisible, glass is mostly the backdrop blur
- **zero-mission glass:** `rgba(10,10,20,0.6)` — 60% opaque, feels like a dark panel, not glass

The current implementation feels like dark cards on a dark background. Zero Protocol feels like floating glass panels in deep space.

### 1.5 Navigation Doesn't Match

- **Zero Protocol nav:** 60px height, pill-shaped active state with `rgba(56,189,248,0.1)` fill + `rgba(56,189,248,0.2)` border, `font-size: 0.78rem`
- **zero-mission nav:** Different sizing, different active state styling, uses Google Font weights

### 1.6 No Inset Edge Highlight

Zero Protocol cards have:
```css
box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
```
This creates a subtle top-edge light that makes cards feel physically lifted. zero-mission has no equivalent.

### 1.7 Animation Pacing Difference

- **Zero Protocol:** Snappy 0.2s–0.3s transitions. Terminal reveals at 60ms stagger.
- **zero-mission:** Framer Motion at 0.7s–0.8s. Feels sluggish in comparison.

### 1.8 Generic Three.js Implementation

The current HeroScene.tsx builds a globe using standard Three.js patterns that appear in thousands of portfolio projects. It doesn't match the specific visual approach Zero Protocol uses:
- Missing the dual-layer atmosphere (inner glow + outer ring)
- Missing the 3000-star background with additive blending
- Missing the packet trail system (8 opacity-fading spheres behind each packet)
- Missing the mouse-parallax camera control

### 1.9 Multi-page Architecture Kills Immersion

The current implementation breaks into separate pages (Architecture, Network, Sphinx, Hidden Services, Threat Simulator, Dashboard). Each page is a disconnected experience.

Zero Protocol's visualization is a **single continuous page** with section switching. The immersion is never broken. The visitor never leaves the space.

### 1.10 No Protocol Specificity

The current implementation uses Zero Protocol terminology but doesn't demonstrate Zero Protocol mechanics. The visualizations could belong to any VPN or mixnet. There is nothing specific to:
- Sphinx packet format (alpha, beta, gamma, payload, MAC fields)
- Poisson mix delays and cover traffic loops
- Hidden service descriptor publication flow
- Post-quantum header size (4673 bytes vs 785 bytes in V1)
- Vanguard circuit architecture (4-hop HS circuits)
- KDF tree (BLAKE2b → ChaCha20-Poly1305 key derivation)

---

## 2. Differences From 0protocol.net

| Dimension | 0protocol.net | zero-mission (current) |
|-----------|--------------|------------------------|
| Background | Deep navy `#020b18` | Near-black `#050508` |
| Primary accent | Sky cyan `#38bdf8` | Neon cyan `#00d4ff` |
| Font | System SF Pro | Google Space Grotesk |
| Card glass | 2.5% white opacity | 60% dark opacity |
| Glow | Dual-radius box-shadow | Text-shadow only |
| Inset highlight | `inset 0 1px 0 rgba(255,255,255,0.05)` | None |
| Nav active state | Cyan pill with border | Different styling |
| Transition speed | 0.2–0.3s | 0.7–0.8s |
| Architecture | Single-page sections | Multi-page routes |
| Protocol specificity | Sphinx fields, KDF tree, vanguard circuits | Generic network graphs |
| Terminal component | `●●●` header, green border, monospace | Not implemented |
| Threat model | 10 specific threats with T-0x IDs | 5 generic attack types |
| Packet visualization | Interactive byte-field explorer | Not implemented |
| Sequence diagrams | Animated handshake arrows | Not implemented |

---

## 3. What Must Be Removed

| Item | Reason |
|------|--------|
| `Space_Grotesk` Google Font import | Replace with system font stack matching zero_protocol |
| `JetBrains_Mono` Google Font import | Replace with `'SF Mono', Consolas, monospace` |
| `#050508` background token | Replace with `#020b18` |
| `#00d4ff` neon blue token | Replace with `#38bdf8` |
| `#00ff88` lime green token | Replace with `#34d399` |
| `rgba(10,10,20,0.6)` glass style | Replace with `rgba(255,255,255,0.025)` + blur |
| Multi-page routing (`/network`, `/sphinx`, `/hidden-services`, etc.) | Collapse to single-page section experience |
| Generic Three.js globe (current HeroScene.tsx) | Rewrite to match zero_protocol's specific implementation |
| Generic particle field (ParticleField.tsx) | Replace with zero_protocol's 3000-star additive system |
| Any emoji usage in feature cards | Replace with protocol-accurate SVG icons or none |

---

## 4. What Must Be Reused / Built Upon

| Item | Location | Action |
|------|----------|--------|
| Zustand store architecture | `src/lib/store.ts` | Keep, extend with section state |
| TypeScript types | `src/lib/types.ts` | Keep, extend |
| `useScrollAnimation` hook | `src/hooks/useScrollAnimation.ts` | Keep, adapt |
| Three.js scene setup | `src/hooks/useThreeScene.ts` | Keep, refactor |
| AnimatedCounter | `src/components/ui/AnimatedCounter.tsx` | Keep, restyle |
| Globe geometry logic | `src/components/three/Globe.tsx` | Rewrite internals, keep structure |
| AtmosphericGlow | `src/components/three/AtmosphericGlow.tsx` | Rewrite to match two-layer system |
| PacketRenderer animation logic | `src/components/three/PacketRenderer.tsx` | Keep, fix colors + add trail system |
| NodeRenderer mesh logic | `src/components/three/NodeRenderer.tsx` | Keep, fix colors + add pulse ring |
| `lat/lng → Vector3` utility | `src/lib/utils.ts` | Keep |

### Concepts from zero_protocol to port directly:

1. **Packet field explorer** (`#packet` section) — interactive byte field visualization with hover tooltips
2. **Circuit SVG builder** (`#circuit` section) — 6 circuit types with animated dashed lines
3. **Network flow canvas** (`#flow` section) — 4 traffic modes with cover traffic loops
4. **Threat grid + detail panel** (`#threat` section) — 10 threats with T-0x IDs and detail panel
5. **Terminal component** (`#daemon` section) — animated startup sequence
6. **Sequence diagram** (`#auth` section) — handshake animation
7. **KDF tree visualization** — BLAKE2b key derivation tree
8. **Progress bar with gradient fill** — used throughout dashboard

---

## 5. Visual Language Extraction

### The Zero Protocol Visual Equation

```
Deep Navy Space
+ Sky Cyan Precision
+ Indigo Cryptography
+ Emerald Success
+ Dual-Radius Glow (only on interaction)
+ Nearly-Invisible Glass Cards (2.5% white)
+ System-Native Typography
+ Snappy Transitions (0.2–0.3s)
+ Pulse Rings on Live Elements
+ Gradient Title Text
= Zero Protocol
```

### The "One Sentence" Description

> Instruments of a live privacy network rendered in the aesthetic of mission-critical telemetry.

### Applied to zero-mission

> The same instruments, elevated to cinematic 3D — but the design language is identical. A visitor who knows 0protocol.net instantly recognizes mission.0protocol.com as the same system.

---

## 6. New Scene Architecture

### Single-Page Continuous Experience

No routing. One page. Sections revealed as user scrolls or navigates.

```
[Loading Screen]
    ↓ 3D Globe slowly comes into focus
    ↓ Logo materializes
    ↓ Status badges appear

[Section 1: Network Overview]
    Canvas: 3D globe with node markers, route arcs, packet pulses
    Data: Active nodes, circuits, packets/sec, hidden services
    Story: "2,847 nodes. 14,293 active circuits. Privacy infrastructure for the internet."

[Section 2: Circuit Builder]
    Visual: SVG circuit diagram (Client → Guard → Mix1 → Mix2 → Exit)
    Tabs: Raw | Obfs4-Lite | TLS Morph | Loop | Hidden Service | PQ Sphinx V2
    Story: "Every connection is a different topology. Select your threat model."

[Section 3: Sphinx Explorer]
    Visual: Interactive packet field explorer (alpha, beta, gamma, payload, MAC)
    Animation: Layered encryption visualization — each hop peels a layer
    Story: "The packet your guard sees vs what the exit sees. Nothing overlaps."

[Section 4: Hidden Services]
    Visual: Canvas animation — descriptor publication → intro point → rendezvous
    Story: "A server you cannot find. A service you can trust."

[Section 5: Threat Simulator]
    Visual: 10-card threat grid with T-0x IDs
    Interactive: Select threat → see the attack animation → see the mitigation
    Story: "Every adversary. Every defense. Proven."

[Section 6: Global Network]
    Canvas: Full-screen 3D globe with geographic nodes and real-time packet arcs
    Story: "The network is live. You are anonymous inside it."

[Section 7: Mission Dashboard]
    Visual: Live metric cards + terminal + system status
    Story: "The protocol is running."
```

---

## 7. New Animation Architecture

### Hierarchy of Motion

| Layer | Speed | Library | Purpose |
|-------|-------|---------|---------|
| Three.js render loop | 60fps | Three.js RAF | Globe rotation, packet movement, node pulsing |
| Section transitions | 0.6s | GSAP | Section appear/disappear |
| UI element reveals | 0.28–0.4s | GSAP stagger | Card + content fade-in |
| Hover states | 0.2–0.25s | CSS transitions | Glow, color, border |
| Counter animations | 2–3s | CSS `@keyframes` | Metric value counting |
| Progress bars | 1.2s | CSS transition | Bar fill |
| Pulse rings | 2s infinite | CSS `@keyframes` | Live status indicators |
| Packet arcs | 2–4s per journey | Three.js | Globe packet travel |

### Key Animations to Implement

**1. Section Entrance**
```javascript
gsap.from(sectionEl, { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' })
gsap.from(children, { opacity: 0, y: 16, duration: 0.4, stagger: 0.08, delay: 0.2 })
```

**2. Card Hover Glow** (CSS only, no JS)
```css
.card:hover {
  border-color: rgba(56,189,248,0.35);
  box-shadow: 0 0 30px rgba(56,189,248,0.25), 0 0 80px rgba(56,189,248,0.08),
              inset 0 1px 0 rgba(255,255,255,0.05);
  transform: translateY(-2px);
  transition: all 0.25s;
}
```

**3. Node Pulse** (Three.js)
```javascript
// Per frame:
node.scale.setScalar(1.0 + Math.sin(time * 2.5 + node.phaseOffset) * 0.15)
glowRing.material.opacity = 0.2 + Math.sin(time * 2.0 + node.phaseOffset) * 0.1
```

**4. Packet Trail** (Three.js)
```javascript
// Per packet, maintain array of 8 trail positions
// Each trail sphere: opacity = trailIndex / 8 * baseOpacity
// New position pushed each frame, oldest removed
```

**5. Globe Rotation + Mouse Parallax**
```javascript
// Continuous slow rotation: scene.rotation.y += 0.001
// Mouse parallax: smooth lerp toward mouse position * 0.015
```

**6. Terminal Line Reveal** (GSAP)
```javascript
lines.forEach((line, i) => {
  gsap.from(line, { opacity: 0, x: -8, duration: 0.4, delay: 0.5 + i * 0.06 })
})
```

**7. Sphinx Layer Peeling** (Three.js)
- Start: 5 nested spheres (layers), all visible
- Animation: Each sphere scales out and fades as packet reaches each hop
- Per hop: `gsap.to(layer, { scale: 1.5, opacity: 0, duration: 0.8 })`

**8. Hidden Service Flow** (Canvas 2D)
- Port the bidirectional arrow animation from zero_protocol's `#flow` section
- Add: descriptor → DHT → intro point → rendezvous → service path with color-coded phases

---

## 8. New Information Architecture

### Navigation (single-page section switcher)

```
ZERO PROTOCOL [logo] | Network | Circuit | Sphinx | Services | Threats | Globe | Dashboard | [● LIVE]
```

All items scroll to sections or switch active section. URL hash updates for shareability (`#circuit`, `#sphinx`, etc.).

### Content Hierarchy Per Section

Every section follows this pattern (matching zero_protocol):

```
[Section Header]
  ├── sec-title (gradient text, 2.4rem, weight 800)
  ├── sec-sub (secondary text, 0.95rem, max-width 680px)
  └── [Primary Visualization]
        ├── [Canvas / SVG / HTML visualization]
        └── [Supporting cards / controls / data tables]
```

### Content Priority (descending)

1. **The living visualization** (must be visible without scrolling in each section)
2. **Protocol metrics / state** (what's happening right now)
3. **Protocol explanation** (what this means, using exact protocol terminology)
4. **Technical detail** (for developers who want to go deeper)

### Storytelling Arc

The visitor's journey through the site should answer these questions in order:

1. *What is this?* → Network Overview (globe + stats)
2. *How does it route?* → Circuit Builder
3. *How does it protect packets?* → Sphinx Explorer
4. *How does it hide services?* → Hidden Services
5. *What are the threats?* → Threat Simulator
6. *Is this real?* → Global Network (real-looking geographic distribution)
7. *Is it running?* → Mission Dashboard (live metrics + terminal)

---

## 9. Build Plan

### Phase 0: Design System Migration (do first, everything depends on this)

**Files to update:**
- `src/app/globals.css` — replace all color tokens with zero_protocol values
- `src/lib/constants.ts` — replace all color values
- `src/app/layout.tsx` — remove Google Font imports, use system font stack

**Token replacements:**
```css
/* REMOVE */                    /* ADD */
#050508                    →    #020b18
#0a0a14                    →    #060f1f
#00d4ff                    →    #38bdf8
#7c3aed                    →    #818cf8
#00ff88                    →    #34d399

/* ADD NEW */
--bg3:    #0a1628
--accent4: #a78bfa
--warn:    #fbbf24
--glass:   rgba(56,189,248,0.04)
--glass2:  rgba(255,255,255,0.02)
--glow-b:  0 0 30px rgba(56,189,248,0.25), 0 0 80px rgba(56,189,248,0.08)
--glow-p:  0 0 30px rgba(129,140,248,0.25), 0 0 80px rgba(129,140,248,0.08)
--glow-g:  0 0 20px rgba(52,211,153,0.3)
```

**Font stack:**
```css
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
/* Mono */
font-family: 'SF Mono', Consolas, 'Courier New', monospace;
```

**Card system update:**
```css
.card {
  background: rgba(255,255,255,0.025);       /* was: rgba(10,10,20,0.6) */
  border: 1px solid rgba(56,189,248,0.12);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
}
.card:hover {
  border-color: rgba(56,189,248,0.35);
  box-shadow: var(--glow-b), inset 0 1px 0 rgba(255,255,255,0.05);
  transform: translateY(-2px);
}
```

### Phase 1: Page Architecture (collapse to single-page)

**Target structure:**
```
src/app/
  page.tsx         ← Single-page experience (all sections)
  layout.tsx       ← NavBar with section scroll links
```

Remove: `/architecture`, `/network`, `/sphinx`, `/hidden-services`, `/threat-simulator`, `/dashboard` route pages. All content moves into sections in `page.tsx`.

**Section scroll system:**
- Each section: `<section id="network">`, `<section id="circuit">`, etc.
- NavBar links: `href="#circuit"` with smooth scroll
- Scroll observer updates nav active state

### Phase 2: Three.js Hero (rewrite to match zero_protocol exactly)

**HeroScene.tsx rewrite targets:**
- Wireframe sphere: `color: 0x38bdf8, opacity: 0.12` (not solid)
- Dual atmosphere: inner sphere (2.55r, opacity 0.08) + outer ring (2.7r, opacity 0.03)
- 3000-star field with `AdditiveBlending`
- Node pulse rings (scale 1.0→1.2 on sine wave, 2.5 rad/s frequency)
- Packet trail: 8 fading spheres behind each packet
- Mouse parallax: `lerp(current, target * 0.015, 0.05)` each frame
- Node colors: guard `0x38bdf8`, mix `0x818cf8`, exit `0x34d399`

### Phase 3: Port Packet Explorer

New component: `PacketFieldExplorer.tsx`

Based directly on zero_protocol's `#packet` section:
- Two rows: V1 (5 fields) and V2 (6 fields with PQ CTs)
- Field widths match protocol byte proportions
- Hover reveals tooltip with field name + description
- Click reveals expanded detail panel below
- Tab to switch V1 / V2

### Phase 4: Port Circuit Builder

New component: `CircuitBuilder.tsx`

Based on zero_protocol's `#circuit` section:
- 6 tab types: Raw | Obfs4-Lite | TLS Morph | Loop | Hidden Service | PQ Sphinx V2
- SVG path visualization with animated dashed stroke-dashoffset
- Moving packet dot along path
- Per-type node labels, colors, hop counts
- Description text per circuit type

### Phase 5: Port Network Flow Canvas

New component: `NetworkFlowCanvas.tsx`

Based on zero_protocol's `#flow` section:
- 4 mode buttons: Normal | Cover | Hidden Service | PQ
- Canvas 2D — not Three.js
- Packet trails with opacity falloff
- Cover traffic loops back through mix nodes
- Color-coded by packet type

### Phase 6: Port Threat Grid

New component: `ThreatGrid.tsx`

Based on zero_protocol's `#threat` section:
- 10 threats (T-01 through T-10) with exact threat names from zero_protocol
- Left accent border: muted at rest, cyan on hover, red when selected
- Risk badges: critical/high/medium/low
- Click → detail panel slides in (Impact, Mitigation, Residual Risk)
- Attack simulation button → animated log output

### Phase 7: Terminal Component

New component: `TerminalVisualization.tsx`

- `●●●` header decoration
- Green border (`rgba(52,211,153,0.2)`)
- Animated line reveals (GSAP stagger: 60ms per line)
- Color classes: term-ok, term-warn, term-info, term-dim
- Content: Zero Protocol daemon startup sequence

### Phase 8: Global Network Globe (full section)

New section: `GlobalNetwork`

- Full-width canvas (520px height)
- 2D geographic globe with lat/lng node projection
- Animated packet arcs between cities
- Legend: guard/mix/exit color dots
- cursor: grab / grabbing on drag

### Phase 9: Dashboard Section

Migrate and fix:
- AnimatedCounter with zero_protocol timing (2–3s)
- MetricCard with zero_protocol glow system
- Progress bars with `linear-gradient(90deg, var(--accent), var(--accent2))`
- Live log with terminal font
- System status checklist

### Phase 10: Sequence Diagram (Auth Section)

New component: `SequenceDiagram.tsx`

- 8-message handshake animation
- Left/right participant labels (Client, Guard)
- Animated arrows: `linear-gradient(90deg, var(--accent), var(--accent2))`
- GSAP stagger reveal (0.35s per message)

---

## Implementation Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10
```

Each phase is self-contained and testable. After Phase 0+1, the site will look like Zero Protocol. Everything after is adding protocol richness.

---

## Success Criteria

The redesign is complete when:

1. A visitor who knows `0protocol.net` immediately recognizes `mission.0protocol.com` as the same ecosystem
2. The background is `#020b18` (deep navy), not black
3. The primary accent is `#38bdf8` (sky cyan), not neon
4. Cards glow (box-shadow) on hover, not just text
5. The navigation matches zero_protocol exactly (60px height, pill active states)
6. The packet field explorer shows the actual Sphinx V1/V2 byte layout
7. The circuit builder shows all 6 circuit types with correct hop counts
8. The threat grid shows all 10 T-0x threats with correct risk levels
9. Mouse parallax works on the globe
10. The terminal animation reveals Zero Protocol daemon startup output
11. No Google Font loading flash — system fonts only
12. The entire experience is one page with section switching
