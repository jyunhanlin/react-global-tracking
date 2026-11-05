# react-global-tracking

Global user interaction tracking for React apps (16–19). Captures clicks, form events, and ambient events via DOM event delegation with automatic React fiber introspection.

## Features

- **Zero-config** — works with any React 16–19 app, no provider or HOC needed
- **Fiber introspection** — reports the nearest React component name and the tracked element's React props (original types, not stringified)
- **Smart filtering** — only tracks interactive elements (buttons, links, ARIA roles, elements with React handlers)
- **Three event categories** — Pointer, Form, and Ambient (see [Event categories](#event-categories))
- **Listener options** — debounce, throttle, idle (requestIdleCallback), once, CSS selector filtering
- **Global scheduling** — set default debounce, throttle, or idle at tracker level; per-listener overrides
- **Tree-shakeable** — ESM + CJS, zero runtime dependencies

## Install

```bash
npm install react-global-tracking
```

## Quick Start

```ts
import { init } from 'react-global-tracking'

const tracker = init()

// Track all clicks on interactive elements
const unsubscribe = tracker.on('click', (event) => {
  console.log(event.targetElement.tagName)   // 'BUTTON'
  console.log(event.fiber?.componentName)    // 'SubmitButton' — nearest component that rendered the <button>
  console.log(event.fiber?.props)            // { type: 'submit', onClick: [Function], ... } — the <button>'s own props
})

// Clean up
unsubscribe()     // remove this listener
tracker.destroy() // remove all listeners and DOM bindings
```

## API

### `init(config?): Tracker`

Creates a tracker instance.

```ts
const tracker = init({
  enabled: true,
  ignoreSelectors: ['.no-track', '[data-private]'],
  debug: false,
  debounce: 300,               // global default: debounce all callbacks by 300ms
  // throttle: 200,            // or throttle (mutually exclusive with debounce/idle)
  // idle: 2000,               // or idle via requestIdleCallback (mutually exclusive)
})
```

| Option | Type | Description |
|--------|------|-------------|
| `enabled` | `boolean` | Toggle tracking on/off (default: `true`) |
| `ignoreSelectors` | `string[]` | CSS selectors to exclude from tracking |
| `debug` | `boolean` | Log events to `console.debug` (default: `false`) |
| `debounce` | `number` | Global default: debounce all callbacks (ms) |
| `throttle` | `number` | Global default: throttle all callbacks (ms) |
| `idle` | `number` | Global default: defer all callbacks via `requestIdleCallback` with timeout (ms) |

`debounce`, `throttle`, and `idle` are mutually exclusive — priority: `debounce` > `throttle` > `idle`.

### `tracker.on(eventType, callback, options?): unsubscribe`

Register a listener for a DOM event type. Returns an unsubscribe function.

```ts
// Basic
tracker.on('click', (event) => { ... })

// With options
tracker.on('scroll', handler, { throttle: 200 })
tracker.on('input', handler, { debounce: 300 })
tracker.on('click', handler, { once: true })
tracker.on('click', handler, { selector: 'nav a' })
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `debounce` | `number` | Debounce the callback by the given milliseconds |
| `throttle` | `number` | Throttle the callback by the given milliseconds |
| `idle` | `number` | Defer callback via `requestIdleCallback` with the given timeout in milliseconds. Falls back to `setTimeout` in unsupported environments |
| `once` | `boolean` | Automatically unsubscribe after the first invocation |
| `selector` | `string` | Only fire the callback when the target matches the CSS selector (global `ignoreSelectors` is still applied first) |

`debounce`, `throttle`, and `idle` are mutually exclusive (priority: `debounce` > `throttle` > `idle`). When a listener sets any of these, it overrides the global scheduling config entirely. Use `{ debounce: 0 }`, `{ throttle: 0 }`, or `{ idle: 0 }` to explicitly opt out of a global default.

Multiple listeners can be registered for the same event type — each fires independently, similar to `addEventListener`.

### Global Scheduling

Set a default scheduling strategy at the tracker level. Per-listener options override the global config as a group — setting any scheduling option on a listener ignores all global scheduling.

```ts
const tracker = init({ idle: 2000 })

// All listeners inherit idle: 2000
tracker.on('click', cb)                          // idle 2000ms
tracker.on('scroll', cb)                         // idle 2000ms

// Per-listener override (group override — global idle ignored)
tracker.on('input', cb, { debounce: 300 })       // debounce 300ms

// Explicit opt-out
tracker.on('click', importantCb, { idle: 0 })    // sync execution
```

### `tracker.getLastEvent(): TrackEvent | null`

Returns the most recent tracked event, or `null` if none. Useful with `visibilitychange` or `beforeunload` to capture the last interaction before the user leaves:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    const last = tracker.getLastEvent()
    if (last) {
      navigator.sendBeacon('/analytics', JSON.stringify({
        component: last.fiber?.componentName,
        element: last.targetElement.tagName,
      }))
    }
  }
})
```

### `tracker.destroy()`

Removes all listeners and DOM event bindings. The tracker instance is inert after this call.

## TrackEvent

Each callback receives a `TrackEvent`:

```ts
interface TrackEvent {
  nativeEvent: Event     // original DOM event
  targetElement: Element // resolved trackable element (may differ from nativeEvent.target)
  fiber: FiberInfo | null
}

interface FiberInfo {
  componentName: string | null              // nearest React component above targetElement
  props: Readonly<Record<string, unknown>>  // React props of targetElement itself (original types)
}
```

`fiber.props` holds the props React passed to the tracked DOM element, not the props of the component named in `componentName`. To attach rich data, put it on the element: `<div onClick={...} data-tracking-payload={{ feature: 'card', index: 0 }}>` gives you the object as-is in `fiber.props`, which avoids the `[object Object]` problem of HTML `data-*` attributes.

The library intentionally keeps `TrackEvent` minimal — use `nativeEvent` and `targetElement` to extract any DOM information you need.

## Event categories

Each event type belongs to a category. The category decides how `targetElement` is resolved and which elements are skipped.

| Category | Event types | `targetElement` | Skips disabled elements |
|----------|-------------|-----------------|-------------------------|
| Pointer | `click`, `touchstart`, `touchend` | Nearest interactive element, walking up at most 10 ancestors from the event target. No interactive element found → event not tracked | Yes |
| Form | `input`, `change`, `focus`, `blur`, `submit` | The event target | Yes |
| Ambient | `scroll`, `keydown`, `keyup`, `copy`, `paste`, `resize`, `popstate`, `hashchange`, and any other event type | The event target | No |

An element is **interactive** when it is a `button`, `a`, `input`, `select`, `textarea`, `summary`, or `details` element, has an interactive ARIA `role` (for example `button`, `link`, `menuitem`, `tab`, `checkbox`), or has a matching React handler on its own props (for `click`: `onClick`, `onMouseDown`, `onMouseUp`, `onPointerDown`, `onPointerUp`).

An element is **disabled** when it has the `disabled` attribute or `aria-disabled="true"`. `ignoreSelectors` applies to every category and also matches ancestors.

## TypeScript

All public types are exported:

```ts
import type {
  Tracker,
  TrackerConfig,
  ListenerOptions,
  SchedulingOptions, // { debounce?, throttle?, idle? } — shared by TrackerConfig and ListenerOptions
  TrackEvent,
  FiberInfo,
  TrackCallback,
} from 'react-global-tracking'
```

## Development

```bash
pnpm install
pnpm test            # run tests
pnpm test:watch      # watch mode
pnpm test:coverage   # coverage report (80% threshold)
pnpm lint            # oxlint
pnpm format          # oxfmt (write)
pnpm format:check    # oxfmt (check only)
pnpm typecheck       # tsc --noEmit
pnpm build           # ESM + CJS + .d.ts via tsdown
```

## License

MIT
