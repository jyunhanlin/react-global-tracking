import { describe, it, expect } from 'vitest'
import { getEventCategory, getHandlersForEvent, EventCategory } from './event-categories'

describe('getEventCategory', () => {
  it('returns Pointer for click', () => {
    expect(getEventCategory('click')).toBe(EventCategory.Pointer)
  })

  it('returns Pointer for touchstart/touchend', () => {
    expect(getEventCategory('touchstart')).toBe(EventCategory.Pointer)
    expect(getEventCategory('touchend')).toBe(EventCategory.Pointer)
  })

  it('returns Form for input/change/focus/blur/submit', () => {
    for (const type of ['input', 'change', 'focus', 'blur', 'submit']) {
      expect(getEventCategory(type)).toBe(EventCategory.Form)
    }
  })

  it('returns Ambient for scroll/keydown/keyup/copy/paste/resize/popstate/hashchange', () => {
    for (const type of ['scroll', 'keydown', 'keyup', 'copy', 'paste', 'resize', 'popstate', 'hashchange']) {
      expect(getEventCategory(type)).toBe(EventCategory.Ambient)
    }
  })

  it('returns Ambient for unrecognized event types', () => {
    expect(getEventCategory('custom-event')).toBe(EventCategory.Ambient)
  })
})

describe('getHandlersForEvent', () => {
  it('returns onClick handlers for click', () => {
    const handlers = getHandlersForEvent('click')
    expect(handlers).toContain('onClick')
    expect(handlers).toContain('onPointerDown')
  })

  it('returns onChange/onInput for input', () => {
    const handlers = getHandlersForEvent('input')
    expect(handlers).toContain('onChange')
    expect(handlers).toContain('onInput')
  })

  it('returns empty array for unrecognized event types', () => {
    expect(getHandlersForEvent('custom-event')).toEqual([])
  })
})
