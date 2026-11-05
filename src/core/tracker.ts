import type { Tracker, TrackerConfig, TrackCallback, ListenerOptions } from '../types'
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

  // config also carries the global SchedulingOptions (debounce/throttle/idle)
  const pipeline = createPipeline({ ...config, ignoreSelectors })
  const attachedTypes = new Set<string>()
  let destroyed = false

  // One handler serves every event type: the pipeline reads event.type itself.
  const handler = (event: Event): void => {
    const trackEvent = pipeline.handleEvent(event)
    if (debug && trackEvent !== null) {
      console.debug('[react-global-tracking]', trackEvent)
    }
  }

  // Lazily attaches one capture-phase listener per event type on document.
  // Multiple on() calls for the same type share a single DOM listener;
  // the pipeline fans out to all registered callbacks internally.
  function ensureDomListener(eventType: string): void {
    if (attachedTypes.has(eventType)) return

    document.addEventListener(eventType, handler, true)
    attachedTypes.add(eventType)
  }

  function removeDomListener(eventType: string): void {
    if (!attachedTypes.has(eventType)) return

    // Only remove if no more listeners for this type
    if (!pipeline.getEventTypes().has(eventType)) {
      document.removeEventListener(eventType, handler, true)
      attachedTypes.delete(eventType)
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

      for (const eventType of attachedTypes) {
        document.removeEventListener(eventType, handler, true)
      }
      attachedTypes.clear()
    },
  }
}
