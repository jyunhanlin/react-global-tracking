---
"react-global-tracking": minor
---

Export the `SchedulingOptions` type (`debounce` / `throttle` / `idle`). `TrackerConfig` and `ListenerOptions` now extend it; their shape is unchanged.

Fix pointer events reporting the wrong `targetElement` when the clicked element has no React fiber of its own (for example markup from `dangerouslySetInnerHTML`). The tracker now reports the ancestor that owns the React handler. Handler detection now walks at most 10 ancestors; before, it could reach about 20 levels through non-React markup.
