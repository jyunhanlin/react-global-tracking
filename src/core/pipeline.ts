import type { ResolvedConfig, TrackEvent, TrackCallback, ListenerOptions } from '../types'
import { resolveFiber, extractFiberInfo } from '../extract/fiber'
import { findTrackableElement } from '../filter/filter-engine'
import { createRegistry } from './registry'

export interface Pipeline {
  handleEvent(domEvent: Event): void
  getLastEvent(): TrackEvent | null
  addListener(eventType: string, callback: TrackCallback, options: ListenerOptions): () => void
  getEventTypes(): Set<string>
  clear(): void
}

export function createPipeline(config: ResolvedConfig): Pipeline {
  const registry = createRegistry()
  let lastEvent: TrackEvent | null = null

  return {
    handleEvent(domEvent: Event): void {
      const target = domEvent.target
      if (!(target instanceof Element)) return

      // Filter: find trackable element based on event category
      const trackableElement = findTrackableElement({
        target,
        ignoreSelectors: config.ignoreSelectors,
        eventType: domEvent.type,
      })
      if (trackableElement === null) return

      // Extract fiber info
      const rawFiber = resolveFiber(trackableElement)
      const fiberInfo = extractFiberInfo(rawFiber)

      const trackEvent: TrackEvent = {
        nativeEvent: domEvent,
        targetElement: trackableElement,
        fiber: fiberInfo,
      }

      // Invoke callbacks → update lastEvent
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
