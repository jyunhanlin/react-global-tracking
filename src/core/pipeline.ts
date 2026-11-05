import type { TrackEvent, TrackCallback, ListenerOptions, SchedulingOptions } from '../types'
import { findTrackableElement } from '../filter/filter-engine'
import { createRegistry } from './registry'

export interface Pipeline {
  /** Filters, extracts and dispatches a DOM event. Returns the TrackEvent, or null if filtered out. */
  handleEvent(domEvent: Event): TrackEvent | null
  getLastEvent(): TrackEvent | null
  addListener(eventType: string, callback: TrackCallback, options: ListenerOptions): () => void
  getEventTypes(): Set<string>
  clear(): void
}

export interface PipelineConfig extends SchedulingOptions {
  readonly ignoreSelectors: readonly string[]
}

export function createPipeline(config: PipelineConfig): Pipeline {
  // The registry reads only the SchedulingOptions fields of config.
  const registry = createRegistry(config)
  let lastEvent: TrackEvent | null = null

  return {
    handleEvent(domEvent: Event): TrackEvent | null {
      const target = domEvent.target
      if (!(target instanceof Element)) return null

      const result = findTrackableElement({
        target,
        ignoreSelectors: config.ignoreSelectors,
        eventType: domEvent.type,
      })
      if (result === null) return null

      const trackEvent: TrackEvent = {
        nativeEvent: domEvent,
        targetElement: result.element,
        fiber: result.fiber,
      }

      registry.invoke(trackEvent)
      lastEvent = trackEvent
      return trackEvent
    },

    getLastEvent(): TrackEvent | null {
      return lastEvent
    },

    addListener(eventType: string, callback: TrackCallback, options: ListenerOptions): () => void {
      return registry.add(eventType, callback, options)
    },

    getEventTypes(): Set<string> {
      return registry.getEventTypes()
    },

    clear(): void {
      registry.clear()
    },
  }
}
