import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { idle } from './idle'

describe('idle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('defers callback execution via setTimeout fallback', () => {
    const fn = vi.fn()
    const idled = idle(fn, 1000)

    idled('a', 'b')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledWith('a', 'b')
  })

  it('schedules each call independently', () => {
    const fn = vi.fn()
    const idled = idle(fn, 1000)

    idled('first')
    idled('second')

    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
    expect(fn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('cancel clears all pending callbacks', () => {
    const fn = vi.fn()
    const idled = idle(fn, 1000)

    idled()
    idled()
    idled.cancel()

    vi.advanceTimersByTime(2000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('cancel only affects pending callbacks, not future ones', () => {
    const fn = vi.fn()
    const idled = idle(fn, 1000)

    idled()
    idled.cancel()

    idled()
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledOnce()
  })
})
