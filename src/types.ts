// === Public Types ===

export interface TrackerConfig {
  readonly enabled?: boolean
  readonly ignoreSelectors?: readonly string[]
  readonly debug?: boolean
}

export interface Tracker {
  on(eventType: string, callback: TrackCallback, options?: ListenerOptions): () => void
  getLastEvent(): TrackEvent | null
  destroy(): void
}

export interface ListenerOptions {
  readonly debounce?: number
  readonly throttle?: number
  readonly once?: boolean
  readonly selector?: string
}

export interface TrackEvent {
  readonly eventType: string
  readonly timestamp: number
  readonly targetElement: Element
  readonly target: ElementInfo
  readonly fiber: FiberInfo | null
  readonly nativeEvent: Event
  readonly rawFiber: object | null
}

export interface ElementInfo {
  readonly tagName: string
  readonly id: string
  readonly className: string
  readonly textContent: string
  readonly href: string | null
  readonly role: string | null
  readonly inputType: string | null
  readonly dataset: Readonly<Record<string, string>>
}

export interface FiberInfo {
  readonly componentName: string | null
  readonly componentStack: readonly string[]
  readonly eventHandlers: readonly string[]
}

export type TrackCallback = (event: TrackEvent) => void

// === Internal Types ===

export interface ResolvedConfig {
  readonly enabled: boolean
  readonly ignoreSelectors: readonly string[]
  readonly debug: boolean
}
