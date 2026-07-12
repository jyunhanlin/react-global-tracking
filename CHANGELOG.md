# react-global-tracking

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
