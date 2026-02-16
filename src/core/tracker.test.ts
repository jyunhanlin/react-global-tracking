import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTracker } from './tracker'
import { resetFiberKeyCache } from '../fiber/resolver'

describe('createTracker', () => {
  beforeEach(() => {
    resetFiberKeyCache()
  })

  afterEach(() => {
    // Clean up any lingering listeners
  })

  it('creates a tracker with default config', () => {
    const tracker = createTracker()
    expect(tracker).toBeDefined()
    expect(tracker.on).toBeTypeOf('function')
    expect(tracker.getLastEvent).toBeTypeOf('function')
    expect(tracker.destroy).toBeTypeOf('function')
    tracker.destroy()
  })

  it('on() returns unsubscribe function', () => {
    const tracker = createTracker()
    const unsub = tracker.on('click', vi.fn())
    expect(unsub).toBeTypeOf('function')
    unsub()
    tracker.destroy()
  })

  it('getLastEvent returns null initially', () => {
    const tracker = createTracker()
    expect(tracker.getLastEvent()).toBeNull()
    tracker.destroy()
  })

  it('attaches capture listener on document for registered event types', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const tracker = createTracker()

    tracker.on('click', vi.fn())
    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function), true)

    tracker.destroy()
    addSpy.mockRestore()
  })

  it('removes capture listener on destroy', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const tracker = createTracker()

    tracker.on('click', vi.fn())
    tracker.destroy()

    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function), true)
    removeSpy.mockRestore()
  })

  it('tracks click on interactive element with fiber', () => {
    const tracker = createTracker()
    const cb = vi.fn()

    tracker.on('click', cb)

    const button = document.createElement('button')
    button.textContent = 'Click'
    document.body.appendChild(button)
    ;(button as any)['__reactFiber$test'] = {
      type: 'button',
      memoizedProps: { onClick: () => {} },
      return: { type: function App() {}, memoizedProps: {}, return: null },
    }

    button.click()

    expect(cb).toHaveBeenCalledOnce()
    expect(tracker.getLastEvent()?.type).toBe('click')

    button.remove()
    tracker.destroy()
  })

  it('respects enabled: false config', () => {
    const tracker = createTracker({ enabled: false })
    const cb = vi.fn()

    tracker.on('click', cb)

    const button = document.createElement('button')
    document.body.appendChild(button)
    button.click()

    expect(cb).not.toHaveBeenCalled()

    button.remove()
    tracker.destroy()
  })

  it('destroy prevents further tracking', () => {
    const tracker = createTracker()
    const cb = vi.fn()

    tracker.on('click', cb)
    tracker.destroy()

    const button = document.createElement('button')
    document.body.appendChild(button)
    button.click()

    expect(cb).not.toHaveBeenCalled()
    button.remove()
  })

  it('logs events when debug is true', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const tracker = createTracker({ debug: true })

    tracker.on('click', vi.fn())

    const button = document.createElement('button')
    document.body.appendChild(button)
    ;(button as any)['__reactFiber$test'] = {
      type: 'button',
      memoizedProps: { onClick: () => {} },
      return: null,
    }

    button.click()

    expect(consoleSpy).toHaveBeenCalled()

    button.remove()
    tracker.destroy()
    consoleSpy.mockRestore()
  })
})
