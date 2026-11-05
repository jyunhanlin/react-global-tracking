# react-global-tracking

## 0.3.0

### Minor Changes

- 8042637: Export the `SchedulingOptions` type (`debounce` / `throttle` / `idle`). `TrackerConfig` and `ListenerOptions` now extend it; their shape is unchanged.

  Fix pointer events reporting the wrong `targetElement` when the clicked element has no React fiber of its own (for example markup from `dangerouslySetInnerHTML`). The tracker now reports the ancestor that owns the React handler. Handler detection now walks at most 10 ancestors; before, it could reach about 20 levels through non-React markup.

  Update dev toolchain to latest (vitest 5.1, @vitest/coverage-v8 5.1, jsdom 30, @changesets/cli 3, tsdown 0.23, oxlint 1.91, oxfmt 0.76, simple-git-hooks 2.14). No runtime changes.

## 0.2.1

### Patch Changes

- Update dev toolchain to latest (typescript 7, tsdown 0.22, vitest 4.1, oxlint 1.73, oxfmt 0.58, jsdom 29) and CI action versions. No runtime changes.

## 0.2.0

### Minor Changes

- Add `idle` scheduling option via `requestIdleCallback` (with `setTimeout` fallback) and promote `debounce`/`throttle`/`idle` to global `TrackerConfig` with group-override semantics. Fix `once` option not working correctly with scheduled callbacks.

## 0.1.3

### Patch Changes

- Add react and react-dom as peer dependencies to explicitly declare runtime dependency on React

## 0.1.2

### Patch Changes

- fix: isIgnored now checks ancestors via closest(), fix fiber cache fall-through

## 0.1.0

### Minor Changes

- Initial release — automatic user interaction tracking for React apps with fiber-based component detection, support for pointer/form/ambient event categories, and debounce/throttle options.
