// Integration tests with real react-dom (no fake fibers).
// They guard behavior that depends on React internals, e.g. the
// __reactFiber$ key naming and which DOM nodes React attaches fibers to.
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { init } from '../index'
import { resetFiberKeyCache } from '../extract/fiber'
import type { Tracker } from '../types'

const hasOwnFiber = (el: Element): boolean =>
  Object.keys(el).some((k) => k.startsWith('__reactFiber$'))

function Card() {
  return createElement('div', {
    'data-testid': 'card',
    onClick: () => {},
    dangerouslySetInnerHTML: { __html: '<p><span id="inner">Read more</span></p>' },
  })
}

function PlainButton() {
  return createElement('button', { 'data-testid': 'plain', onClick: () => {} }, 'Go')
}

describe('tracker with real react-dom', () => {
  let container: HTMLElement
  let root: Root
  let tracker: Tracker

  beforeAll(() => {
    // Tell React this is a test environment so act() works without warnings.
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  function render(component: () => ReturnType<typeof createElement>): void {
    resetFiberKeyCache()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root.render(createElement(component)))
    tracker = init()
  }

  afterEach(() => {
    tracker.destroy()
    act(() => root.unmount())
    container.remove()
  })

  it('reports the onClick owner when clicking dangerouslySetInnerHTML content', () => {
    render(Card)
    const card = container.querySelector('[data-testid="card"]')!
    const inner = container.querySelector('#inner')!

    // Premise: React attaches a fiber to the host div, not to the injected markup.
    expect(hasOwnFiber(card)).toBe(true)
    expect(hasOwnFiber(inner)).toBe(false)

    const onClick = vi.fn()
    tracker.on('click', onClick)
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledOnce()
    const event = onClick.mock.calls[0][0]
    expect(event.nativeEvent.target).toBe(inner)
    expect(event.targetElement).toBe(card)
    expect(event.fiber?.componentName).toBe('Card')
    expect(event.fiber?.props['data-testid']).toBe('card')
  })

  it('tracks a regular React onClick element with its own props', () => {
    render(PlainButton)
    const button = container.querySelector('[data-testid="plain"]')!

    const onClick = vi.fn()
    tracker.on('click', onClick)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledOnce()
    const event = onClick.mock.calls[0][0]
    expect(event.targetElement).toBe(button)
    expect(event.fiber?.componentName).toBe('PlainButton')
    expect(event.fiber?.props).toMatchObject({ 'data-testid': 'plain', children: 'Go' })
  })
})
