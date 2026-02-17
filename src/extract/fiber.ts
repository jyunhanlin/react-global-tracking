import type { FiberInfo } from '../types'

// === Resolver: DOM element → raw fiber node ===

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

// === Extractor: raw fiber node → FiberInfo ===

const MAX_STACK_DEPTH = 50

interface FiberNode {
  type: unknown
  memoizedProps: Record<string, unknown> | null
  return: FiberNode | null
}

export function extractFiberInfo(rawFiber: object | null): FiberInfo | null {
  if (rawFiber === null) return null

  const fiber = rawFiber as FiberNode
  return {
    componentName: findNearestComponentName(fiber),
    props: fiber.memoizedProps ?? {},
  }
}

function findNearestComponentName(fiber: FiberNode): string | null {
  let current: FiberNode | null = fiber.return
  let depth = 0

  while (current !== null && depth < MAX_STACK_DEPTH) {
    const name = getComponentName(current)
    if (name !== null) return name
    current = current.return
    depth++
  }

  return null
}

function getComponentName(fiber: FiberNode): string | null {
  const type = fiber.type
  if (typeof type === 'string') return null
  if (typeof type === 'function') {
    return (type as any).displayName ?? type.name ?? null
  }
  return null
}
