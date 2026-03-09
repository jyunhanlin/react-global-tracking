import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRegistry } from './registry'
import type { TrackEvent } from '../types'

function fakeEvent(eventType: string = 'click', targetElement?: Element): TrackEvent {
  const el = targetElement ?? document.createElement('button')
  return {
    nativeEvent: new Event(eventType),
    targetElement: el,
    fiber: null,
  }
}

describe('createRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers and invokes callback for matching event type', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, {})
    registry.invoke(fakeEvent('click'))

    expect(cb).toHaveBeenCalledOnce()
  })

  it('does not invoke callback for non-matching event type', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, {})
    registry.invoke(fakeEvent('input'))

    expect(cb).not.toHaveBeenCalled()
  })

  it('unsubscribe function removes listener', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    const unsub = registry.add('click', cb, {})
    unsub()
    registry.invoke(fakeEvent('click'))

    expect(cb).not.toHaveBeenCalled()
  })

  it('applies debounce option', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { debounce: 100 })
    registry.invoke(fakeEvent())
    registry.invoke(fakeEvent())
    registry.invoke(fakeEvent())

    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('applies throttle option', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { throttle: 100 })
    registry.invoke(fakeEvent())
    registry.invoke(fakeEvent())
    registry.invoke(fakeEvent())

    expect(cb).toHaveBeenCalledOnce()
  })

  it('supports multiple listeners for same event type', () => {
    const registry = createRegistry()
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    registry.add('click', cb1, {})
    registry.add('click', cb2, {})
    registry.invoke(fakeEvent('click'))

    expect(cb1).toHaveBeenCalledOnce()
    expect(cb2).toHaveBeenCalledOnce()
  })

  it('getEventTypes returns registered types', () => {
    const registry = createRegistry()
    registry.add('click', vi.fn(), {})
    registry.add('input', vi.fn(), {})

    expect(registry.getEventTypes()).toEqual(new Set(['click', 'input']))
  })

  it('applies once option — auto-unsubscribes after first fire', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { once: true })
    registry.invoke(fakeEvent('click'))
    registry.invoke(fakeEvent('click'))

    expect(cb).toHaveBeenCalledOnce()
  })

  it('once + idle — callback fires once after idle, then unsubscribes', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { once: true, idle: 1000 })
    registry.invoke(fakeEvent('click'))
    registry.invoke(fakeEvent('click'))

    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('once + debounce — callback fires once after debounce, then unsubscribes', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { once: true, debounce: 200 })
    registry.invoke(fakeEvent('click'))
    registry.invoke(fakeEvent('click'))

    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledOnce()

    // Further invocations after unsubscribe should not fire
    registry.invoke(fakeEvent('click'))
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('applies selector option — only fires when targetElement matches', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { selector: 'nav a' })

    const navLink = document.createElement('a')
    const nav = document.createElement('nav')
    nav.appendChild(navLink)
    document.body.appendChild(nav)

    registry.invoke(fakeEvent('click', navLink))
    expect(cb).toHaveBeenCalledOnce()

    const div = document.createElement('div')
    document.body.appendChild(div)
    registry.invoke(fakeEvent('click', div))
    expect(cb).toHaveBeenCalledOnce() // still 1 — not called again

    nav.remove()
    div.remove()
  })

  it('clear removes all listeners', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, {})
    registry.clear()
    registry.invoke(fakeEvent('click'))

    expect(cb).not.toHaveBeenCalled()
  })

  it('does not throw on invalid CSS selector', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { selector: '[invalid' })
    registry.invoke(fakeEvent('click'))

    expect(cb).not.toHaveBeenCalled()
  })

  it('applies idle option — defers callback', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    registry.add('click', cb, { idle: 1000 })
    registry.invoke(fakeEvent())

    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('idle cancel works on unsubscribe', () => {
    const registry = createRegistry()
    const cb = vi.fn()

    const unsub = registry.add('click', cb, { idle: 1000 })
    registry.invoke(fakeEvent())
    unsub()

    vi.advanceTimersByTime(2000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('applies global scheduling when listener has no scheduling options', () => {
    const registry = createRegistry({ debounce: 200 })
    const cb = vi.fn()

    registry.add('click', cb, {})
    registry.invoke(fakeEvent())
    registry.invoke(fakeEvent())

    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('listener scheduling overrides global (group override)', () => {
    const registry = createRegistry({ debounce: 200 })
    const cb = vi.fn()

    registry.add('click', cb, { idle: 1000 })
    registry.invoke(fakeEvent())

    // Should NOT use global debounce — listener set idle, so group override applies
    vi.advanceTimersByTime(200)
    expect(cb).not.toHaveBeenCalled()

    vi.advanceTimersByTime(800)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('listener scheduling with 0 opts out of global', () => {
    const registry = createRegistry({ debounce: 200 })
    const cb = vi.fn()

    registry.add('click', cb, { debounce: 0 })
    registry.invoke(fakeEvent())

    // debounce: 0 = sync execution, even though global has debounce: 200
    expect(cb).toHaveBeenCalledOnce()
  })

  it('global priority: debounce > throttle > idle', () => {
    const registry = createRegistry({ debounce: 200, throttle: 100, idle: 1000 })
    const cb = vi.fn()

    registry.add('click', cb, {})
    registry.invoke(fakeEvent())

    // debounce wins
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledOnce()
  })
})
