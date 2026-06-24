# Zero Protocol Design Audit

Extracted from `~/zero_protocol/visualization/index.html` — the canonical visual reference for Zero Protocol.

---

## What Makes Zero Protocol Feel Like Zero Protocol

**The personality:** Scientific instrument meets mission control. Not "cyberpunk." Not "hacker aesthetic." Zero Protocol feels like the software of a real, serious, post-quantum privacy infrastructure. Every design decision signals precision, depth, and credibility. The palette is restrained — deep navy backgrounds, a measured cyan as primary accent, subtle purples for cryptographic layers, clean green for success states. Nothing screams. Everything whispers authority.

**The core sensation:** You are reading telemetry from a live system you trust with your identity.

---

## Color Palette

All values extracted directly from `:root` CSS custom properties.

### Backgrounds

```css
--bg:   #020b18    /* Deep navy — primary background. Nearly black but deeply blue. */
--bg2:  #060f1f    /* Elevated surfaces (panels, cards before hover) */
--bg3:  #0a1628    /* Section backgrounds, lighter elevation */
--panel: rgba(6,15,31,0.88)   /* Glass panel backgrounds with 88% opacity */
```

**Critical note for zero-mission:** The current zero-mission uses `#050508` (almost pure black). Zero Protocol uses `#020b18` (deep navy). This single difference is what makes zero-mission feel generic — it loses the distinctive blue-black space that gives zero_protocol its character.

### Accent Colors

```css
--accent:  #38bdf8   /* Cyan/Sky — PRIMARY. Guard nodes, route lines, UI highlights. */
--accent2: #818cf8   /* Indigo/Purple — Mix nodes, secondary highlights */
--accent3: #34d399   /* Emerald green — Exit nodes, success, active/online states */
--accent4: #a78bfa   /* Violet — Post-quantum Sphinx V2, advanced features */
```

**Critical note:** zero-mission uses `#00d4ff` (electric neon cyan) vs zero_protocol's `#38bdf8` (sky blue cyan). The zero_protocol cyan is softer, more professional. The neon cyan in zero-mission makes it feel generic.

### Status / Warning Colors

```css
--warn:   #fbbf24   /* Amber — cover traffic, warnings, medium risk */
--danger: #f87171   /* Red — critical threats, errors, attack states */
```

### Text Colors

```css
--text:  #e2e8f0   /* Off-white — primary body text */
--text2: #94a3b8   /* Slate gray — secondary text, descriptions */
--muted: #475569   /* Dark slate — labels, timestamps, metadata */
```

### Glass & Surface Colors

```css
--glass:  rgba(56,189,248,0.04)   /* Ultra-subtle cyan tint for hover fills */
--glass2: rgba(255,255,255,0.02)  /* Ultra-subtle white for panel fills */
```

---

## Typography Scale

### Font Families

```css
/* Display / UI */
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

/* Monospace / Terminal */
font-family: 'SF Mono', Consolas, monospace;
```

**Critical note:** Zero Protocol uses system-native fonts — SF Pro on Apple, Segoe UI elsewhere. This gives it a native, trusted feel. zero-mission uses Google Fonts (Space Grotesk, JetBrains Mono) which renders slightly differently and feels imported rather than native.

### Type Scale

| Usage | Size | Weight | Notes |
|-------|------|--------|-------|
| Hero title | `clamp(3rem, 7vw, 6.5rem)` | 900 | Letter-spacing: -0.02em |
| Section title | `2.4rem` | 800 | Letter-spacing: default |
| Card title | `0.82rem` | 600 | ALL CAPS, letter-spacing: 0.06em |
| Body | `0.95rem` | 400 | Line-height: 1.6 |
| Small label | `0.72rem–0.78rem` | 500 | ALL CAPS, letter-spacing: 0.08–0.1em |
| Monospace | `0.8rem–0.82rem` | 400 | |
| Badge/pill | `0.7rem–0.75rem` | 600 | Letter-spacing: 0.06em |
| Nav link | `0.78rem` | 500 | Letter-spacing: 0.02em |

### Title Gradient

```css
/* Hero title */
background: linear-gradient(135deg, #ffffff 0%, #a5d8ff 50%, var(--accent2) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Section titles */
background: linear-gradient(135deg, #fff 30%, var(--accent));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## Glow System

Zero Protocol uses a precise, multi-layer glow system. This is the single most distinctive visual element.

```css
--glow-b: 0 0 30px rgba(56,189,248,0.25), 0 0 80px rgba(56,189,248,0.08);
--glow-p: 0 0 30px rgba(129,140,248,0.25), 0 0 80px rgba(129,140,248,0.08);
--glow-g: 0 0 20px rgba(52,211,153,0.3);
```

**Pattern:** Inner glow (30px, 25% opacity) + outer atmospheric halo (80px, 8% opacity). The dual-radius creates depth — a tight core glow with a soft atmospheric bloom around it.

**Applied on:** Card hover, button hover, metric card hover, threat card hover. Always triggered by interaction, never static.

**zero-mission gap:** zero-mission only uses `text-shadow` glow on text. It has no `box-shadow` glow on interactive elements. This is why interactions feel flat.

---

## Card Styles

```css
.card {
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);          /* rgba(56,189,248,0.12) — barely visible */
  border-radius: 16px;
  padding: 1.75rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);    /* Top edge highlight */
}

.card:hover {
  border-color: rgba(56,189,248,0.35);     /* Border brightens on hover */
  box-shadow: var(--glow-b),               /* Outer glow activates */
              inset 0 1px 0 rgba(255,255,255,0.05);
}
```

**Key details:**
- The `inset 0 1px 0 rgba(255,255,255,0.05)` creates a subtle top-edge highlight that gives cards a physical "raised" quality
- The border is nearly invisible at rest (`0.12` opacity) and brightens on hover (`0.35`)
- The glow only appears on hover — never static

---

## Navigation Style

```css
nav {
  height: 60px;
  background: rgba(2,11,24,0.85);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(56,189,248,0.08);    /* Very subtle bottom border */
}

.nav-btn {
  padding: 0.38rem 0.82rem;
  border-radius: 100px;                /* Pill shape */
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all 0.2s;
}

.nav-btn.active {
  background: rgba(56,189,248,0.1);
  color: var(--accent);
  border: 1px solid rgba(56,189,248,0.2);
}
```

**Zero Protocol logo treatment:**
```css
.nav-logo {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  letter-spacing: 0.12em;
}
```

---

## Spacing System

| Context | Value |
|---------|-------|
| Section padding (top) | `80px` |
| Section padding (sides) | `2.5rem` |
| Card padding | `1.75rem` |
| Card gap in grid | `1.25rem–1.5rem` |
| Nav height | `60px` |
| Nav padding | `0 2rem` |
| Nav gap between items | `2rem` |
| Button padding | `0.8rem 2rem` |
| Pill padding | `0.38rem 0.82rem` |
| Badge padding | `0.2rem 0.65rem` |

---

## Animation Principles

### Timing

```css
/* Standard UI transitions */
transition: all 0.2s;       /* Hover states, button feedback */
transition: all 0.25s;      /* Slightly longer for color/shadow changes */
transition: all 0.3s;       /* Card hover, border transitions */
transition: all 0.35s;      /* Sequence diagram messages */
transition: all 0.28s;      /* Terminal line reveals */
```

**Pattern:** Short, snappy transitions (0.2–0.35s). Nothing lingers.

### Pulse Animation

```css
@keyframes pulse-a {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(52,211,153,0.5);    /* No ring at rest */
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 6px rgba(52,211,153,0);    /* Ring expands and fades */
  }
}
/* Applied to: status dots, node indicators */
/* Duration: 2s infinite */
```

### Scroll Reveal (Terminal / Sequence Diagrams)

```css
/* Elements start hidden */
opacity: 0;
transform: translateX(-6px);    /* Slight left offset */
transition: all 0.28s;

/* GSAP or JS adds class */
.show {
  opacity: 1;
  transform: none;
}
```

### Button Hover

```css
.btn-primary:hover {
  transform: translateY(-2px);      /* Slight lift */
  box-shadow: var(--glow-b);        /* Glow activates */
}
```

### GSAP Usage (Terminal)

```javascript
gsap.from(el, {
  opacity: 0,
  x: -8,
  duration: 0.4,
  delay: index * 0.06,    /* Stagger: 60ms between lines */
})
```

---

## Badge / Pill System

```css
.badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 100px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Role-specific */
.badge-guard { background: rgba(56,189,248,0.12);  color: #38bdf8; }
.badge-mix   { background: rgba(129,140,248,0.12); color: #818cf8; }
.badge-exit  { background: rgba(52,211,153,0.12);  color: #34d399; }
.badge-online{ background: rgba(52,211,153,0.10);  color: #34d399; }
```

**Pattern:** Always `rgba(color, 0.10–0.15)` background with the accent color at full opacity for text.

---

## Threat Card System

```css
.threat-card {
  border-left: 3px solid var(--border);    /* LEFT accent border — distinguishing feature */
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  transition: all 0.25s;
}

.threat-card:hover {
  border-left-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--glow-b);
}

.threat-card.selected {
  border-left-color: var(--danger);        /* Red when selected (threat active) */
  background: rgba(248,113,113,0.04);      /* Very subtle red tint */
}
```

### Risk Level Badges

```css
.risk-critical { background: rgba(248,113,113,0.15); color: #f87171; }
.risk-high     { background: rgba(251,191,36,0.15);  color: #fbbf24; }
.risk-medium   { background: rgba(56,189,248,0.15);  color: #38bdf8; }
.risk-low      { background: rgba(52,211,153,0.15);  color: #34d399; }
```

---

## Terminal Component

```css
.terminal {
  background: #010b17;                              /* Slightly darker than bg */
  border: 1px solid rgba(52,211,153,0.2);           /* Green border (success/running) */
  border-radius: 12px;
  padding: 1.5rem;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 0.8rem;
}

/* Three-dot header decoration */
.terminal::before {
  content: '● ● ●';
  color: var(--muted);
  font-size: 0.6rem;
  letter-spacing: 0.3em;
}
```

### Terminal Line Colors

```css
.term-ok   { color: #34d399; }   /* Success: green */
.term-warn { color: #fbbf24; }   /* Warning: amber */
.term-info { color: #38bdf8; }   /* Info: cyan */
.term-dim  { color: #475569; }   /* Metadata: muted slate */
```

---

## Progress Bars

```css
.progress-bar {
  background: rgba(56,189,248,0.08);
  border-radius: 100px;
  height: 4px;
}

.progress-fill {
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  border-radius: 100px;
  transition: width 1.2s ease;
}
```

**Pattern:** Gradient fills from cyan to indigo. Height is always 4px. Transition is 1.2s (slow enough to feel deliberate).

---

## Table Styles

```css
th {
  color: var(--muted);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07–0.1em;
  border-bottom: 1px solid var(--border);
  font-weight: 500;
}

td {
  border-bottom: 1px solid rgba(56,189,248,0.05);   /* Very subtle row separator */
}

tr:hover td {
  background: var(--glass);   /* rgba(56,189,248,0.04) — barely there hover */
}
```

---

## `code` Inline Style

```css
code {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 0.8em;
  background: rgba(56,189,248,0.09);
  padding: 0.1em 0.38em;
  border-radius: 4px;
  color: var(--accent);
}
```

---

## Hero Stats / Metric Cards

```css
/* Hero stat blocks */
.hstat {
  backdrop-filter: blur(10px);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(56,189,248,0.1);
}
.hstat-val { font-size: 1.6rem; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.hstat-lbl { font-size: 0.68rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }

/* Dashboard metric cards */
.metric-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.5rem;
}
.metric-card:hover { border-color: var(--border-h); box-shadow: var(--glow-b); }
.metric-val { font-size: 2rem; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.metric-lbl { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.metric-delta { font-size: 0.72rem; color: var(--accent3); }    /* Delta always green */
```

---

## Three.js Visual Language (Hero Globe)

From the `#hero` canvas implementation:

### Globe

```javascript
// Wireframe sphere — not solid, not textured
const sphere = new THREE.SphereGeometry(2.5, 32, 32);
const wireMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,      // Accent cyan
  wireframe: true,
  opacity: 0.12,         // Very subtle
  transparent: true,
});
```

### Atmosphere

```javascript
// Inner atmospheric glow
const atmoInner = new THREE.SphereGeometry(2.55, 32, 32);
// gradient: cyan → transparent, opacity ~0.08–0.12

// Outer atmospheric ring
const atmoOuter = new THREE.SphereGeometry(2.7, 32, 32);
// opacity ~0.03
```

### Node Colors (Three.js)

```javascript
// Guard: 0x38bdf8 (accent cyan)
// Mix:   0x818cf8 (accent2 indigo)
// Exit:  0x34d399 (accent3 green)
```

### Node Rendering

```javascript
// Each node: SphereGeometry(0.06, 12, 12)
// With outer glow ring: SphereGeometry(0.12, 12, 12), opacity: 0.25, additive blending
// Animated: scale pulses between 1.0 and 1.2 on a sine wave
```

### Packet Arcs

```javascript
// Bezier curve between two node positions
// Height of arc: Math.max(dist * 0.4, 0.8)
// Packet: SphereGeometry(0.025, 8, 8), color matches source node
// Additive blending on packet for glow effect
// Glow trail: 8 spheres along path with decreasing opacity
```

### Star Field

```javascript
// 3000 stars
// Random unit sphere positions, multiplied by 80–200 radius
// Size: 0.3 to 1.2 random variation
// Color: slightly blue-white (0xd0e8ff)
// AdditiveBlending
```

### Camera

```javascript
camera.position.z = 7;   // Default distance
// Smooth mouse parallax:
targetRotX += (mouseY * 0.015 - targetRotX) * 0.05;
targetRotY += (mouseX * 0.015 - targetRotY) * 0.05;
// Scene rotates slowly: rotY += 0.001 per frame
```

---

## Visual Identity Summary

| Property | Value |
|----------|-------|
| Primary brand color | `#38bdf8` Sky Cyan |
| Secondary | `#818cf8` Indigo |
| Tertiary | `#34d399` Emerald |
| Background | `#020b18` Deep Navy |
| Personality | Precision instrument, mission-critical, post-quantum |
| Font feel | System-native, trusted, technical |
| Motion feel | Snappy UI (0.2–0.3s), deliberate data (1.2s progress), living nodes (2s pulse) |
| Card feel | Glass-morphism with near-invisible borders that glow on interaction |
| Glow philosophy | Dual-radius (tight core + atmospheric halo), only on hover |
| Information density | High — but never overwhelming. Every pixel earns its place |
| Overall atmosphere | Deep space telemetry from a system you trust with your privacy |
