# Phase 2 Experience Plan

**Goal:** Transform Zero Mission from "Good React Site" into "Premium Zero Protocol Mission Control"

---

## Current State Assessment

| Page | Current Feeling | Target Feeling |
|------|----------------|----------------|
| Network | Floating nodes in space | Cloudflare Radar globe |
| Architecture | Static diagram + linear demo | Cinematic circuit construction |
| Sphinx | Information panel | Museum-quality layer explorer |
| Hidden Services | Educational steps | Immersive walkthrough |
| Threat Simulator | Dashboard | Live security simulation |

---

## Phase 2 Execution Plan

### P1 — Network Overview (Globe Centerpiece)

**Status:** Highest priority. Largest visual delta.

**What changes:**
- Replace seed-based 3D scatter positions with `latLngToVector3()` globe positions (nodes already have lat/lng)
- Add `GlobeBase` component: dark sphere + latitude/longitude wireframe grid
- Add three-layer atmosphere: inner blue glow + mid indigo + outer halo
- Arc connections between nodes using `QuadraticBezierCurve3` on sphere surface
- Node pulse rings: dual concentric spheres expanding + fading on each node
- Packet trails: TRAIL_LENGTH=10 history buffer per packet, fading sphere trail
- Auto-rotation via `OrbitControls.autoRotate = true, autoRotateSpeed = 0.3`
- Tighter camera: `position=[0,2,11], fov=55`
- Bloom upgraded: `intensity=1.6, luminanceThreshold=0.15`

**Files:** `NetworkScene.tsx` (full rewrite), `network/page.tsx` (camera update)

---

### P2 — Circuit Builder (Architecture Page)

**What changes:**
- **Packet trails in RouteChain:** Ring buffer of 8 past positions → fading mint trail particles behind moving packet
- **Active edge highlight:** Connection lines between hops glow bright when packet is on that segment
- **Burst enhancement:** Stronger ring burst (scale 4×) + secondary ring with delay when packet arrives at each node
- **HeroChain flow lines:** CSS `background: linear-gradient(90deg, ...)` animated with keyframes — connection bars pulse with flowing light
- **HeroPacket trail:** Secondary ghost packet following 0.5s behind with 40% opacity

**Files:** `RouteChain.tsx` (trail + active edge), `architecture/page.tsx` (HeroChain + HeroPacket)

---

### P3 — Sphinx Explorer

**What changes:**
- **Layer appearance animation:** On mount, layers fade in sequentially (0, 200ms, 400ms, 600ms, 800ms stagger)
- **Peel enhancement:** Peeling layer spirals outward with rotation + scale, not just linear scale
- **Route blinding scan:** A sweeping horizontal plane that passes through the packet at regular intervals, visualizing the "blinding" applied at each hop
- **Glow intensity increase on peel:** Remaining layers briefly intensify after outer layer removed

**Files:** `SphinxScene.tsx` (mount animation, enhanced peel, scan effect)

---

### P4 — Hidden Services

**What changes:**
- **Step 5 bidirectional trails:** Both forward and reverse packet streams rendered simultaneously with distinct color tints (mint forward, purple reverse)
- **Step 1 descriptor pulse:** DHT ring nodes pulse outward in sequence to show descriptor propagation
- **Step 4 rendezvous flash:** Rendezvous node flashes bright white on connection establishment
- **Overall orbit intensity:** Scene rotation amplitude increased per step complexity

**Files:** `HiddenServiceScene.tsx` (trail enhancement, step-specific improvements)

---

### P5 — Threat Simulator

**What changes:**
- **Attacker visibility field:** Semi-transparent cone geometry from each attacker node showing their "line of sight" toward the circuit
- **Hidden segments:** Circuit edges NOT visible to attacker rendered with lower opacity + dashed appearance
- **Timeline scan:** Each mitigation step sweeps a green line across the circuit when activated
- **Attack transition:** Scene fades to black (opacity 0) then fades in for new attack type

**Files:** `ThreatScene.tsx` (visibility cone, segment states), `threat-simulator/page.tsx` (fade transition)

---

## Motion Standards

| Effect | Library | Parameters |
|--------|---------|-----------|
| Globe auto-rotation | Three.js OrbitControls | `autoRotateSpeed: 0.3` |
| Packet trails | Three.js useFrame | 10-frame ring buffer |
| Node pulses | Three.js useFrame | `sin(t * 0.5 + offset) % 1` |
| Section reveals | Framer Motion | `y: 0→8, opacity: 0→1, duration: 0.35` |
| Card stagger | Framer Motion | `delay: index * 0.08` |
| Attack transitions | Framer Motion AnimatePresence | `mode: "wait"` |
| Atmosphere glow | Three.js material opacity | `sin(t * 0.7) * 0.03` |

---

## Performance Targets

| Platform | Target | Strategy |
|----------|--------|----------|
| Desktop | 60 FPS | `dpr={[1, 2]}`, instanced where possible |
| Mobile | 30 FPS | `dpr={[1, 1.5]}`, TRAIL_LENGTH=5 on mobile |
| Bloom | Calibrated per scene | `mipmapBlur`, tuned threshold |

---

## Implementation Order

1. `NetworkScene.tsx` — Globe rewrite (highest impact)
2. `network/page.tsx` — Camera + UI polish
3. `RouteChain.tsx` — Packet trails
4. `architecture/page.tsx` — HeroChain flow animation
5. `SphinxScene.tsx` — Layer appearance + peel enhancement
6. `HiddenServiceScene.tsx` — Bidirectional trails
7. `ThreatScene.tsx` — Visibility overlays

---

## Locked Elements (Do Not Touch)

- Color tokens (`--primary`, `--text-muted`, node semantic colors)
- Typography classes (`font-display`, `label-caps`, font sizes)
- Spacing system (`py-24`, `px-6`, `max-w-[1440px]`)
- Navigation component
- Card system (`bento-card`, `GlassPanel`)
