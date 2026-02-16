import { describe, it, expect, beforeEach } from 'vitest'
import { resolveFiber, resetFiberKeyCache } from './resolver'

describe('resolveFiber', () => {
  beforeEach(() => {
    resetFiberKeyCache()
  })

  it('returns null for element without fiber', () => {
    const el = document.createElement('div')
    expect(resolveFiber(el)).toBeNull()
  })

  it('finds fiber with __reactFiber$ prefix (React 18+)', () => {
    const el = document.createElement('div')
    const fakeFiber = { type: 'div', memoizedProps: {} }
    ;(el as any)['__reactFiber$abc123'] = fakeFiber

    expect(resolveFiber(el)).toBe(fakeFiber)
  })

  it('finds fiber with __reactInternalInstance$ prefix (React 16-17)', () => {
    const el = document.createElement('div')
    const fakeFiber = { type: 'div', memoizedProps: {} }
    ;(el as any)['__reactInternalInstance$xyz789'] = fakeFiber

    expect(resolveFiber(el)).toBe(fakeFiber)
  })

  it('caches the discovered key prefix', () => {
    const el1 = document.createElement('div')
    const fiber1 = { type: 'div', memoizedProps: {} }
    ;(el1 as any)['__reactFiber$abc'] = fiber1

    const el2 = document.createElement('span')
    const fiber2 = { type: 'span', memoizedProps: {} }
    ;(el2 as any)['__reactFiber$abc'] = fiber2

    resolveFiber(el1)
    expect(resolveFiber(el2)).toBe(fiber2)
  })

  it('walks up parent elements when target has no fiber', () => {
    const parent = document.createElement('div')
    const child = document.createElement('span')
    parent.appendChild(child)

    const fakeFiber = { type: 'div', memoizedProps: {} }
    ;(parent as any)['__reactFiber$abc'] = fakeFiber

    expect(resolveFiber(child)).toBe(fakeFiber)
  })

  it('stops walking after max depth (10 levels)', () => {
    let current = document.createElement('div')
    const root = current
    for (let i = 0; i < 15; i++) {
      const child = document.createElement('div')
      current.appendChild(child)
      current = child
    }

    const fakeFiber = { type: 'div', memoizedProps: {} }
    ;(root as any)['__reactFiber$abc'] = fakeFiber

    // child is 15 levels deep, should not find fiber (max 10)
    expect(resolveFiber(current)).toBeNull()
  })
})
