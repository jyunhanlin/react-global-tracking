import type { TrackEvent, TrackCallback, ListenerOptions } from '../types'
import { findTrackableElement } from '../filter/filter-engine'
import { createRegistry, type SchedulingConfig } from './registry'

export interface Pipeline {
  handleEvent(domEvent: Event): void
  getLastEvent(): TrackEvent | null
  addListener(eventType: string, callback: TrackCallback, options: ListenerOptions): () => void
  getEventTypes(): Set<string>
  clear(): void
}

export interface PipelineConfig {
  readonly ignoreSelectors: readonly string[]
  readonly debounce?: number
  readonly throttle?: number
  readonly idle?: number
}

export function createPipeline(config: PipelineConfig): Pipeline {
  const globalScheduling: SchedulingConfig = {
    debounce: config.debounce,
    throttle: config.throttle,
    idle: config.idle,
  }
  const registry = createRegistry(globalScheduling)
  let lastEvent: TrackEvent | null = null

  return {
    handleEvent(domEvent: Event): void {
      const target = domEvent.target
      if (!(target instanceof Element)) return

      const result = findTrackableElement({
        target,
        ignoreSelectors: config.ignoreSelectors,
        eventType: domEvent.type,
      })
      if (result === null) return

      const trackEvent: TrackEvent = {
        nativeEvent: domEvent,
        targetElement: result.element,
        fiber: result.fiber,
      }

      registry.invoke(trackEvent)
      lastEvent = trackEvent
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
