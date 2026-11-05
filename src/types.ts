// === Public Types ===

/**
 * Scheduling for listener callbacks. Set at most one; if several are set,
 * priority is debounce > throttle > idle. Values are milliseconds.
 */
export interface SchedulingOptions {
  readonly debounce?: number
  readonly throttle?: number
  readonly idle?: number
}

export interface TrackerConfig extends SchedulingOptions {
  readonly enabled?: boolean
  readonly ignoreSelectors?: readonly string[]
  readonly debug?: boolean
}

export interface Tracker {
  on(eventType: string, callback: TrackCallback, options?: ListenerOptions): () => void
  getLastEvent(): TrackEvent | null
  destroy(): void
}

export interface ListenerOptions extends SchedulingOptions {
  readonly once?: boolean
  readonly selector?: string
}

export interface TrackEvent {
  readonly nativeEvent: Event
  readonly targetElement: Element
  readonly fiber: FiberInfo | null
}

export interface FiberInfo {
  readonly componentName: string | null
  readonly props: Readonly<Record<string, unknown>>
}

export type TrackCallback = (event: TrackEvent) => void
