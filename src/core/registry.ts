import type { TrackEvent, TrackCallback, ListenerOptions } from '../types'
import { debounce } from '../utils/debounce'
import { throttle } from '../utils/throttle'

interface RegistryEntry {
  readonly eventType: string
  readonly originalCallback: TrackCallback
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

export function createRegistry(): Registry {
  let entries: RegistryEntry[] = []

  function createEntry(
    eventType: string,
    callback: TrackCallback,
    options: ListenerOptions,
  ): RegistryEntry {
    const wrappedCallback = wrapCallback(callback, options)
    const entry: RegistryEntry = {
      eventType,
      originalCallback: callback,
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
        if (entry.eventType !== event.type) continue

        // selector check
        if (entry.options.selector != null) {
          const target = event.raw.target
          if (!(target instanceof Element) || !target.matches(entry.options.selector)) {
            continue
          }
        }

        entry.wrappedCallback(event)

        // once: auto-unsubscribe after first fire
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

function wrapCallback(
  callback: TrackCallback,
  options: ListenerOptions,
): TrackCallback & { cancel?: () => void } {
  if (options.debounce != null) {
    return debounce(callback, options.debounce)
  }
  if (options.throttle != null) {
    return throttle(callback, options.throttle)
  }
  return callback
}
