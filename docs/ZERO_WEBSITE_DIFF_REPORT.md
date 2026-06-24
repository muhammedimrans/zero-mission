# Zero Protocol Website → Zero Mission: Design Diff Report

Source of truth: `/home/zero/zero_website/zero/zero_website`
Current implementation: `/home/zero/zero-mission/src`

---

## 1. Colors That Differ

### Primary accent color
| Token | Zero Website | Zero Mission |
|-------|-------------|-------------|
| Brand primary | `#6effc7` (neon mint) | `#38bdf8` (cyan blue) |
| Primary dim | `#00e5a8` | — (no equivalent) |
| Secondary | `#afc6ff` (electric blue) | `#818cf8` (indigo) |
| Tertiary | — | `#34d399` (emerald) |
| Quaternary | — | `#a78bfa` (purple) |

The Zero Website uses a single neon-mint primary (`#6effc7`, `#00e5a8`). Zero Mission uses four accent colors (cyan, indigo, emerald, purple).

**File references:**
- Zero Website: `/home/zero/zero_website/zero/zero_website/src/styles.css` lines 15–43
- Zero Mission: `/home/zero/zero-mission/src/app/globals.css` lines 4–44, `/home/zero/zero-mission/src/lib/constants.ts` lines 1–36

### Background system
| Token | Zero Website | Zero Mission |
|-------|-------------|-------------|
| `--background` | `#08090a` (near black, no blue) | `#020b18` (deep navy blue) |
| `--surface` | `#0d0e0f` | `#060f1f` |
| `--surface-low` | `#121315` | `#0a1628` |
| `--surface-high` | `#1b1c1d` | — |

The Zero Website background is a neutral near-black with no blue tint. Zero Mission backgrounds are navy blue.

### Border system
| Token | Zero Website | Zero Mission |
|-------|-------------|-------------|
| `--border` | `rgba(139,148,158,0.18)` (neutral gray) | `rgba(56,189,248,0.12)` (cyan tinted) |
| `--border-h` hover | `rgba(139,148,158,0.32)` | `rgba(56,189,248,0.35)` |

### Text colors
| Token | Zero Website | Zero Mission |
|-------|-------------|-------------|
| Primary text | `#e3e2e3` (warm light gray) | `#e2e8f0` (cool blue-gray) |
| Secondary text | `#c9d1d9` | `#94a3b8` |
| Muted text | `#9aa4af` | `#475569` |

### Glow system
| Effect | Zero Website | Zero Mission |
|--------|-------------|-------------|
| Primary glow | `0 0 24px rgba(0,229,168,0.18)` | `0 0 30px rgba(56,189,248,0.25), 0 0 80px rgba(56,189,248,0.08)` |
| Soft glow | `0 0 60px rgba(0,229,168,0.08)` | `0 0 20px rgba(52,211,153,0.3)` |
| Button glow | `0 0 24px rgba(110,255,199,0.2)` | — |

Zero Website uses single-layer soft glows. Zero Mission uses dual-radius glows (near + far).

---

## 2. Typography That Differs

### Font families
| Role | Zero Website | Zero Mission |
|------|-------------|-------------|
| Display/headings | `"Geist"` | `'SF Pro Display', -apple-system, …` (system fallbacks) |
| Body | `"Inter"` | Same system stack as display |
| Monospace | `"JetBrains Mono"` | `'SF Mono', Consolas, …` |

Zero Website loads actual Geist and Inter fonts. Zero Mission uses system fallback stacks with no web font loaded.

**File references:**
- Zero Website: `/home/zero/zero_website/zero/zero_website/src/styles.css` lines 7, 45–47
- Zero Mission: `/home/zero/zero-mission/src/app/globals.css` lines 4–6

### Hero font size
| | Zero Website | Zero Mission |
|--|-------------|-------------|
| H1 desktop | `72px` (fixed) | `clamp(3rem, 7vw, 6.5rem)` (104px max) |
| H1 mobile | `44px` | `clamp(3rem, 7vw, 6.5rem)` (48px min) |

### Font weight
| Element | Zero Website | Zero Mission |
|---------|-------------|-------------|
| Hero title | `font-semibold` (600) | `900` (black) |
| Section heading | `font-semibold` (600) | `800` (extra-bold) |
| Section subtitle | `font-medium` (500) | regular (400) |

### Letter spacing
| Usage | Zero Website | Zero Mission |
|-------|-------------|-------------|
| All headings | `-0.02em` (tight, `tracking-tight`) | none set on headings |
| Labels (caps) | `0.14em` (via `label-caps`) | `0.06em` (feature card labels) |
| Navigation | unset | `0.02em` |

### Label utility
Zero Website has a dedicated `label-caps` utility class used on all micro-labels, badges, and buttons:
```css
/* /home/zero/zero_website/zero/zero_website/src/styles.css lines 159–165 */
font-family: var(--font-mono);
font-size: 11px;
letter-spacing: 0.14em;
text-transform: uppercase;
font-weight: 600;
```
Zero Mission has no equivalent utility — each component sets these properties independently with inconsistent values.

---

## 3. Layout Patterns That Differ

### Max container width
| | Zero Website | Zero Mission |
|--|-------------|-------------|
| Max width | `max-w-[1440px]` (1440px) | `max-w-[1200px]` / inline `maxWidth: 1200px` |

**File references:**
- Zero Website: `/home/zero/zero_website/zero/zero_website/src/components/site/SiteShell.tsx` lines 310–315
- Zero Mission: `/home/zero/zero-mission/src/app/page.tsx` inline styles

### Section padding
| | Zero Website | Zero Mission |
|--|-------------|-------------|
| Horizontal (desktop) | `px-12` (48px) | `px-10` / `2.5rem` |
| Vertical (desktop) | `py-24` (96px) | `py-20` / `5rem` |
| Horizontal (mobile) | `px-6` (24px) | `px-6` |

### Grid patterns
| Section | Zero Website | Zero Mission |
|---------|-------------|-------------|
| Core features | `grid-cols-3` (3 equal columns) | `auto-fit minmax(300px, 1fr)` |
| Hero facts | `grid-cols-4` with `gap-px` (1px gaps) | 4-column with `2.5rem` gap |
| Comparison | `grid-cols-[1fr_2fr]` (asymmetric) | not present |

### Section background variants
Zero Website uses alternating section backgrounds:
1. Transparent (default)
2. `border-t border-border bg-surface-low/30`
3. `relative overflow-hidden` + `radial-mint` overlay

Zero Mission uses a single consistent dark background with no section differentiation beyond the hero.

---

## 4. Components That Differ

### Status badge / chip
**Zero Website** (`/home/zero/zero_website/zero/zero_website/src/components/site/ui.tsx` lines 6–41):
```tsx
// Rounded pill, border + bg + text all from same tone
className="inline-flex items-center gap-2 rounded-full border px-3 py-1 label-caps text-[10px]"
// Primary tone: border-primary/30 bg-primary/[0.06] text-primary
// Animated pulse-dot on primary badges
```

**Zero Mission** (`/home/zero/zero-mission/src/components/ui/StatusBadge.tsx`, `LiveBadge.tsx`):
- Multiple separate components instead of a single tone-variant system
- Uses `rounded-full` but inline styles instead of utility classes
- No `label-caps` discipline

### Button system
**Zero Website** (`ui.tsx` lines 89–125):
```tsx
// Primary
className="label-caps rounded-md bg-primary px-6 py-3 text-[11px] text-primary-foreground"
style={{ boxShadow: '0 0 24px rgba(110,255,199,0.2)' }}
// Hover: brightness-110 (not scale/translate)

// Ghost
className="label-caps glass-panel rounded-md px-6 py-3 text-[11px] text-text-primary"
// Hover: border-primary/40 text-primary
```

**Zero Mission** (`/home/zero/zero-mission/src/app/page.tsx` inline styles):
- No `label-caps` on buttons
- Font size `0.9rem` vs `11px`
- Uses `transform: translateY(-2px)` on hover vs `brightness-110`
- No glass-panel utility

### Card / Bento
**Zero Website** (`ui.tsx` lines 47–67, `styles.css` lines 141–146):
```css
/* bento-card utility */
background: linear-gradient(180deg, rgba(15,18,22,0.92) 0%, rgba(15,18,22,0.5) 100%);
border: 1px solid var(--border);  /* neutral gray border */
border-radius: 12px;
padding: 24px;
/* hover: border-primary/30 (mint) */
```

**Zero Mission** (`globals.css` lines 127–142):
```css
.card {
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);  /* cyan-tinted border */
  border-radius: 16px;
  padding: 1.75rem;
  backdrop-filter: blur(20px);
  /* hover: translateY(-2px) + cyan glow */
}
```

Key differences:
- Zero Website: 12px radius, gradient background, no blur, neutral border, mint hover
- Zero Mission: 16px radius, flat translucent bg, heavy blur (20px), cyan border, lift + cyan glow hover

### Glass panel
**Zero Website** (`styles.css` lines 134–139):
```css
@utility glass-panel {
  background: rgba(15,18,22,0.55);
  backdrop-filter: blur(14px);
  border: 1px solid var(--border);
}
```

**Zero Mission**: No equivalent utility. Blur values range 12–20px applied per-component.

### Navigation bar
**Zero Website** (`SiteShell.tsx` lines 40–121):
- Height: `h-16` (64px)
- Scrolled: `bg-background/85 backdrop-blur-xl` (85% opacity, 24px blur)
- At top: `bg-background/40 backdrop-blur-md` (40% opacity, 12px blur)
- Nav links: `text-[13px] font-medium`, active = `text-primary`
- CTA: `label-caps bg-primary px-4 py-2 text-[11px]` with mint glow

**Zero Mission** (`NavBar.tsx` lines 21–181):
- Height: `60px` (inline style)
- Always: `rgba(2,11,24,0.85)` with `blur(24px)` (no scroll-aware change)
- Nav links: `0.78rem font-medium`, active = cyan bg pill
- No top-of-page vs scrolled state distinction
- Status indicator inline in nav (not a separate banner)

**File references:**
- Zero Website: `/home/zero/zero_website/zero/zero_website/src/components/site/SiteShell.tsx` lines 5–121
- Zero Mission: `/home/zero/zero-mission/src/components/ui/NavBar.tsx`

### Section labels
Zero Website uses a `SectionLabel` component (`ui.tsx` lines 65–78):
```tsx
// Small label-caps text above every section heading
// color: text-text-muted, font-mono, 0.14em letter-spacing
```

Zero Mission has no equivalent — sections go directly to heading with no label prefix.

---

## 5. Animations That Differ

### Framer Motion variants
| | Zero Website | Zero Mission |
|--|-------------|-------------|
| Fade-in | `{ opacity: 0 } → { opacity: 1 }`, `duration: 0.3` | `{ opacity: 0, y: 24 } → { opacity: 1, y: 0 }`, `duration: 0.55` |
| Card entrance | `y: 8`, `duration: 0.35` | `y: 20`, `duration: 0.45` |
| Stagger delay | `i * 0.08s` | `i * 0.06s` (cards), `0.07s` (dashboard) |
| Easing | `"easeOut"` (named) | `[0.22, 1, 0.36, 1]` (cubic bezier) |

### CSS keyframes
**Zero Website** (`styles.css` lines 171–185):
- `pulse-dot`: box-shadow expands outward (ring effect)
- `dash`: SVG stroke-dashoffset marching ants (`-200` offset, `4s linear`)
- `float-y`: translateY `0 → -8px → 0`, `4s ease-in-out`

**Zero Mission** (`globals.css` lines 191–200):
- `pulse-a`: same concept but dot is green (`#34d399`) vs mint (`#6effc7`)
- No `dash` animation
- No `float-y` animation

### Button hover
| | Zero Website | Zero Mission |
|--|-------------|-------------|
| Primary button | `hover:brightness-110` (no movement) | `transform: translateY(-2px)` |
| Ghost button | `hover:border-primary/40 hover:text-primary` | varies per component |

### Three.js / heavy animations
Zero Website has **no Three.js**. All visuals are SVG + CSS animations.
Zero Mission has full Three.js globe scenes in every page's hero.

This is the most significant structural divergence. The Zero Website achieves its technical aesthetic through precise SVG diagrams and CSS animations, not 3D WebGL scenes.

---

## 6. Sections That Differ

### Home page section structure
| # | Zero Website | Zero Mission |
|---|-------------|-------------|
| 1 | Hero (centered, single-accent gradient bg) | Hero (Three.js globe + centered text) |
| 2 | Trust bar (full-width horizontal stripe) | Metrics bar (4-column cards) |
| 3 | Metadata Problem (text + interactive SVG diagram) | Features grid (6 FeatureCards) |
| 4 | Protocol Comparison (scrollable table) | CTA section |
| 5 | Core Tech (3-column bento grid) | Footer |
| 6 | Security Layers (interactive tabbed dashboard) | — |
| 7 | CTA (mirror of hero) | — |

Zero Mission is missing: trust bar, protocol comparison table, security layers dashboard, and the secondary CTA.

### Section label pattern
Every Zero Website section has a `<SectionLabel>` above the heading:
```
[LABEL IN CAPS]
## Heading text
Subtitle text
```
Zero Mission has no section labels — sections go directly to heading.

### Hero content
| Element | Zero Website | Zero Mission |
|---------|-------------|-------------|
| Background | CSS radial-mint gradient | Three.js WebGL globe |
| Badge | StatusChip ("Project in testing" banner) | `pulse-dot` inline badge |
| Title size | 44px → 72px | `clamp(3rem, 7vw, 6.5rem)` |
| Title font | Geist, 600 weight | system-ui, 900 weight |
| CTA buttons | ButtonPrimary + ButtonGhost (2 buttons) | Same pattern (2 buttons) |
| Below hero | Stats grid (4 facts, `gap-px` separator style) | Metrics bar (4 cards with backdrop blur) |

### Footer
**Zero Website**: Full footer with columns (links, social, legal), border-top, logo repeat
**Zero Mission**: Single-line monospace footer — minimal

---

## Summary

The core design divergence is:

1. **Color language**: mint green (#6effc7) vs cyan blue (#38bdf8)
2. **Background tone**: neutral near-black vs navy blue
3. **Typography**: Geist + Inter (named fonts) vs system fallback stacks
4. **3D vs flat**: Zero Website is entirely flat SVG/CSS; Zero Mission uses Three.js WebGL
5. **Section completeness**: Zero Mission is missing ~4 of the 7 Zero Website sections
6. **Component discipline**: Zero Website has systematic utilities (`label-caps`, `bento-card`, `glass-panel`); Zero Mission has scattered inline styles
