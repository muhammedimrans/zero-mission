# Hydration Audit — Zero Mission

All issues found in the current implementation that cause React SSR/client mismatches.

---

## Issue 1 — SVG `begin` attribute using `Math.random()`

**File:** `src/app/dashboard/page.tsx`  
**Lines:** 362–363  
**Severity:** Critical

### Root cause
`Math.random()` is called directly inside JSX during rendering, not inside a `useEffect` or `useRef`. The server produces one random value; the client produces a different one during hydration. React cannot reconcile the mismatch.

```tsx
// BEFORE (broken)
<animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite"
  begin={`${Math.random() * 2}s`} />
<animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"
  begin={`${Math.random() * 2}s`} />
```

### Fix
Replace `Math.random()` with deterministic per-node delays based on node index. The `WorldMap` component already has a stable `nodes` array — use the index as the seed.

```tsx
// AFTER (fixed)
{nodes.map((n, i) => {
  const delay = `${(i * 0.2) % 2}s`   // deterministic, index-based
  return (
    <g key={n.label}>
      <circle ...>
        <animate ... begin={delay} />
        <animate ... begin={delay} />
      </circle>
      ...
    </g>
  )
})}
```

---

## Issue 2 — `nowTs()` called in initial state factory

**File:** `src/app/dashboard/page.tsx`  
**Lines:** 466–473  
**Severity:** High

### Root cause
`nowTs()` calls `new Date().toLocaleTimeString()` which returns the current time. This runs during SSR (on the server) and again during client hydration — at two different times, producing two different strings. The initial security events array is built with these timestamps.

```tsx
// BEFORE (broken)
const [events, setEvents] = useState<SecurityEvent[]>(() => {
  const initial: SecurityEvent[] = []
  for (let i = 0; i < 8; i++) {
    const pool = EVENT_POOL[i % EVENT_POOL.length]
    initial.push({ id: i, type: pool.type, message: pool.message, ts: nowTs() })
    //                                                                   ^^^^^^
    //                                                         new Date() during SSR
  }
  return initial
})
```

### Fix
Initialize events with an empty timestamp placeholder. Populate real timestamps in a `useEffect` that runs only on the client.

```tsx
// AFTER (fixed)
const [events, setEvents] = useState<SecurityEvent[]>(() =>
  EVENT_POOL.slice(0, 8).map((pool, i) => ({
    id: i,
    type: pool.type,
    message: pool.message,
    ts: '',   // empty on SSR; filled client-side by useEffect below
  }))
)

useEffect(() => {
  setEvents((prev) =>
    prev.map((e) => (e.ts === '' ? { ...e, ts: nowTs() } : e))
  )
}, [])
```

---

## Issue 3 — `generateTrafficPoint` (uses `Math.random()`) in initial state factory

**File:** `src/app/dashboard/page.tsx`  
**Lines:** 441–445  
**Severity:** High

### Root cause
`generateTrafficPoint` applies `(Math.random() - 0.5) * 15` noise to each data point. The initial state is set via a `useState` lazy initializer which runs on both server and client, producing different arrays.

```tsx
// BEFORE (broken)
const [inboundData, setInboundData] = useState<number[]>(() =>
  Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, 0))
  //                                    ^^^^^^^^^^^^^^^^^^^^^^^^
  //                         calls Math.random() — different each run
)
const [outboundData, setOutboundData] = useState<number[]>(() =>
  Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, Math.PI))
)
```

### Fix
Use a pure deterministic function for SSR initial state (sine only, no noise). After mount, `useEffect` immediately replaces it with the real noisy data so the display is still live.

```tsx
// Pure sine — no Math.random(), safe for SSR
function generateTrafficPointSSR(i: number, phase: number): number {
  const base = 50 + 30 * Math.sin((i / 20) * Math.PI + phase)
  return Math.max(5, Math.min(95, base))
}

// AFTER (fixed)
const [inboundData, setInboundData] = useState<number[]>(() =>
  Array.from({ length: 60 }, (_, i) => generateTrafficPointSSR(i, 0))
)
const [outboundData, setOutboundData] = useState<number[]>(() =>
  Array.from({ length: 60 }, (_, i) => generateTrafficPointSSR(i, Math.PI))
)

// Immediately seed with real random data on client after hydration
useEffect(() => {
  setInboundData(Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, 0)))
  setOutboundData(Array.from({ length: 60 }, (_, i) => generateTrafficPoint(i, Math.PI)))
}, [])
```

---

## No-action items (not actually issues)

The following patterns were investigated and confirmed safe:

- **`Math.random()` in `useEffect` callbacks** (`setActiveCircuits`, `setPackets`, `setHiddenSvcs`): run only after mount, never during SSR.
- **`setClock` via `useEffect`** (lines 398–411): `useState('')` is the correct initial value (empty string matches SSR output). The `tick()` call inside `useEffect` runs only on client.
- **`Math.random()` in Three.js `useMemo`** (`HeroScene.tsx`): Three.js components are rendered only client-side via `dynamic({ ssr: false })` — no SSR execution.

---

## Implementation status

| Issue | Status |
|-------|--------|
| SVG begin Math.random() | Fixed |
| nowTs() in initial state | Fixed |
| generateTrafficPoint in initial state | Fixed |
