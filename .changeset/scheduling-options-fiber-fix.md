---
"react-global-tracking": minor
---

Export the `SchedulingOptions` type (`debounce` / `throttle` / `idle`). `TrackerConfig` and `ListenerOptions` now extend it; their shape is unchanged.

Fix pointer events reporting the wrong `targetElement` when the clicked element has no React fiber of its own (for example markup from `dangerouslySetInnerHTML`). The tracker now reports the ancestor that owns the React handler. Handler detection now walks at most 10 ancestors; before, it could reach about 20 levels through non-React markup.

Update dev toolchain to latest (vitest 5.1, @vitest/coverage-v8 5.1, jsdom 30, @changesets/cli 3, tsdown 0.23, oxlint 1.91, oxfmt 0.76, simple-git-hooks 2.14). No runtime changes.
