import { describe, it, expect } from 'vitest'
import { extractFiberInfo } from './extractor'

// Helper to create a fake fiber node structure
function createFiber(overrides: Record<string, unknown> = {}) {
  return {
    type: 'div',
    memoizedProps: {},
    return: null,
    ...overrides,
  }
}

describe('extractFiberInfo', () => {
  it('returns null for null fiber', () => {
    expect(extractFiberInfo(null)).toBeNull()
  })

  it('extracts component name from function component', () => {
    const fiber = createFiber({
      return: createFiber({
        type: function MyButton() {},
      }),
    })

    const info = extractFiberInfo(fiber)
    expect(info?.componentName).toBe('MyButton')
  })

  it('extracts component name from class component', () => {
    class MyComponent {}
    const fiber = createFiber({
      return: createFiber({
        type: MyComponent,
      }),
    })

    const info = extractFiberInfo(fiber)
    expect(info?.componentName).toBe('MyComponent')
  })

  it('extracts displayName when available', () => {
    const Component = () => {}
    Component.displayName = 'CustomName'

    const fiber = createFiber({
      return: createFiber({ type: Component }),
    })

    const info = extractFiberInfo(fiber)
    expect(info?.componentName).toBe('CustomName')
  })

  it('extracts event handlers from memoizedProps', () => {
    const fiber = createFiber({
      memoizedProps: {
        onClick: () => {},
        onMouseDown: () => {},
        className: 'btn',
        children: 'Click me',
      },
    })

    const info = extractFiberInfo(fiber)
    expect(info?.handlers).toEqual(['onClick', 'onMouseDown'])
  })

  it('builds component stack from fiber tree', () => {
    const appFiber = createFiber({
      type: function App() {},
      return: null,
    })
    const formFiber = createFiber({
      type: function Form() {},
      return: appFiber,
    })
    const buttonFiber = createFiber({
      type: function SubmitButton() {},
      return: formFiber,
    })
    const hostFiber = createFiber({
      type: 'button',
      return: buttonFiber,
    })

    const info = extractFiberInfo(hostFiber)
    expect(info?.componentStack).toEqual(['SubmitButton', 'Form', 'App'])
  })

  it('skips non-component fiber nodes in stack', () => {
    const appFiber = createFiber({
      type: function App() {},
      return: null,
    })
    // host element fiber (string type) should be skipped
    const divFiber = createFiber({
      type: 'div',
      return: appFiber,
    })
    const btnFiber = createFiber({
      type: function Button() {},
      return: divFiber,
    })

    const info = extractFiberInfo(btnFiber)
    expect(info?.componentStack).toEqual(['App'])
  })
})
