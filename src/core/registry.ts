import type { TrackEvent, TrackCallback, ListenerOptions } from '../types'
import { debounce } from '../utils/debounce'
import { throttle } from '../utils/throttle'
import { idle } from '../utils/idle'
import { safeMatches } from '../utils/safe-selector'

export interface SchedulingConfig {
  readonly debounce?: number
  readonly throttle?: number
  readonly idle?: number
}

interface RegistryEntry {
  readonly eventType: string
  readonly wrappedCallback: TrackCallback & { cancel?: () => void }
  readonly options: ListenerOptions
  readonly unsubscribe: () => void
}

export interface Registry {
  add(eventType: string, callback: TrackCallback, options: ListenerOptions): () => void
  invoke(event: TrackEvent): void
  getEventTypes(): Set<string>
  clear(): void
}

export function createRegistry(globalScheduling?: SchedulingConfig): Registry {
  let entries: RegistryEntry[] = []

  function createEntry(
    eventType: string,
    callback: TrackCallback,
    options: ListenerOptions,
  ): RegistryEntry {
    const wrappedCallback = wrapCallback(callback, options, globalScheduling)
    const entry: RegistryEntry = {
      eventType,
      wrappedCallback,
      options,
      unsubscribe: () => {
        wrappedCallback.cancel?.()
        entries = entries.filter((e) => e !== entry)
      },
    }
    return entry
  }

  return {
    add(eventType: string, callback: TrackCallback, options: ListenerOptions): () => void {
      const entry = createEntry(eventType, callback, options)
      entries = [...entries, entry]
      return entry.unsubscribe
    },

    invoke(event: TrackEvent): void {
      for (const entry of entries) {
        if (entry.eventType !== event.nativeEvent.type) continue

        if (entry.options.selector != null) {
          if (!safeMatches(event.targetElement, entry.options.selector)) {
            continue
          }
        }

        entry.wrappedCallback(event)

        if (entry.options.once === true) {
          entry.unsubscribe()
        }
      }
    },

    getEventTypes(): Set<string> {
      return new Set(entries.map((e) => e.eventType))
    },

    clear(): void {
      for (const entry of entries) {
        entry.wrappedCallback.cancel?.()
      }
      entries = []
    },
  }
}

function hasListenerScheduling(options: ListenerOptions): boolean {
  return options.debounce != null || options.throttle != null || options.idle != null
}

function wrapCallback(
  callback: TrackCallback,
  options: ListenerOptions,
  globalScheduling?: SchedulingConfig,
): TrackCallback & { cancel?: () => void } {
  // Group override: if listener sets any scheduling option, use listener's; otherwise use global
  const scheduling = hasListenerScheduling(options)
    ? options
    : { ...globalScheduling }

  // Priority: debounce > throttle > idle
  if (scheduling.debounce != null && scheduling.debounce > 0) {
    return debounce(callback, scheduling.debounce)
  }
  if (scheduling.throttle != null && scheduling.throttle > 0) {
    return throttle(callback, scheduling.throttle)
  }
  if (scheduling.idle != null && scheduling.idle > 0) {
    return idle(callback, scheduling.idle)
  }
  return callback
}
