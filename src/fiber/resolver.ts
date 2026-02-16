const FIBER_PREFIXES = ['__reactFiber$', '__reactInternalInstance$'] as const
const MAX_PARENT_DEPTH = 10

let cachedKey: string | null = null

export function resolveFiber(element: Element): object | null {
  let current: Element | null = element
  let depth = 0

  while (current !== null && depth <= MAX_PARENT_DEPTH) {
    const fiber = getFiberFromElement(current)
    if (fiber !== null) {
      return fiber
    }
    current = current.parentElement
    depth++
  }

  return null
}

function getFiberFromElement(element: Element): object | null {
  if (cachedKey !== null) {
    const fiber = (element as any)[cachedKey]
    if (fiber != null) return fiber as object
    return null
  }

  for (const key of Object.keys(element)) {
    for (const prefix of FIBER_PREFIXES) {
      if (key.startsWith(prefix)) {
        cachedKey = key
        return (element as any)[key] as object
      }
    }
  }

  return null
}

export function resetFiberKeyCache(): void {
  cachedKey = null
}
