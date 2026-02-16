import type {
  Tracker,
  TrackerConfig,
  TrackCallback,
  ListenerOptions,
} from '../types'
import { createPipeline } from './pipeline'

export function createTracker(config?: TrackerConfig): Tracker {
  const enabled = config?.enabled ?? true
  const ignoreSelectors = config?.ignoreSelectors ?? []
  const debug = config?.debug ?? false

  if (!enabled) {
    return {
      on: () => () => {},
      getLastEvent: () => null,
      destroy: () => {},
    }
  }

  const pipeline = createPipeline({ ignoreSelectors })
  const domListeners = new Map<string, (event: Event) => void>()
  let destroyed = false

  // Lazily attaches one capture-phase listener per event type on document.
  // Multiple on() calls for the same type share a single DOM listener;
  // the pipeline fans out to all registered callbacks internally.
  function ensureDomListener(eventType: string): void {
    if (domListeners.has(eventType)) return

    const handler = (event: Event): void => {
      pipeline.handleEvent(event)

      if (debug) {
        const lastEvent = pipeline.getLastEvent()
        if (lastEvent?.nativeEvent === event) {
          console.debug('[react-auto-tracking]', lastEvent)
        }
      }
    }

    document.addEventListener(eventType, handler, true)
    domListeners.set(eventType, handler)
  }

  function removeDomListener(eventType: string): void {
    const handler = domListeners.get(eventType)
    if (handler === undefined) return

    // Only remove if no more listeners for this type
    if (!pipeline.getEventTypes().has(eventType)) {
      document.removeEventListener(eventType, handler, true)
      domListeners.delete(eventType)
    }
  }

  return {
    on(eventType: string, callback: TrackCallback, options?: ListenerOptions): () => void {
      if (destroyed) return () => {}

      ensureDomListener(eventType)
      const unsub = pipeline.addListener(eventType, callback, options ?? {})

      return () => {
        unsub()
        removeDomListener(eventType)
      }
    },

    getLastEvent() {
      return pipeline.getLastEvent()
    },

    destroy(): void {
      if (destroyed) return
      destroyed = true

      pipeline.clear()

      for (const [eventType, handler] of domListeners) {
        document.removeEventListener(eventType, handler, true)
      }
      domListeners.clear()
    },
  }
}
