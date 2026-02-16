import { getEventCategory, getHandlersForEvent, EventCategory } from './event-categories'
import { resolveFiber } from '../extract/fiber'
import { safeMatches } from '../utils/safe-matches'

const INTERACTIVE_TAGS = new Set([
  'BUTTON',
  'A',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'SUMMARY',
  'DETAILS',
])

const INTERACTIVE_ROLES = new Set([
  // Original widget roles
  'button',
  'link',
  'menuitem',
  'tab',
  'checkbox',
  'radio',
  'combobox',
  'listbox',
  'option',
  'switch',
  'slider',
  'spinbutton',
  // Composite widget variants
  'menuitemcheckbox',
  'menuitemradio',
  'treeitem',
  'gridcell',
  // Input widget roles
  'textbox',
  'searchbox',
])

const MAX_ANCESTOR_DEPTH = 10

export interface FilterResult {
  readonly element: Element
  readonly fiber: object | null
}

interface FindTrackableParams {
  readonly target: Element
  readonly ignoreSelectors: readonly string[]
  readonly eventType: string
}

export function findTrackableElement(params: FindTrackableParams): FilterResult | null {
  const { target, ignoreSelectors, eventType } = params
  const category = getEventCategory(eventType)

  switch (category) {
    case EventCategory.Pointer:
      return findPointerTarget(target, ignoreSelectors, eventType)
    case EventCategory.Form:
      return findFormTarget(target, ignoreSelectors)
    case EventCategory.Ambient:
      return findAmbientTarget(target, ignoreSelectors)
  }
}

function findPointerTarget(
  target: Element,
  ignoreSelectors: readonly string[],
  eventType: string,
): FilterResult | null {
  let current: Element | null = target
  let depth = 0

  while (current !== null && depth <= MAX_ANCESTOR_DEPTH) {
    if (isIgnored(current, ignoreSelectors)) return null
    if (isDisabled(current)) return null

    const fiber = findInteractiveFiber(current, eventType)
    if (fiber !== undefined) {
      return { element: current, fiber }
    }

    current = current.parentElement
    depth++
  }

  return null
}

function findFormTarget(
  target: Element,
  ignoreSelectors: readonly string[],
): FilterResult | null {
  if (isIgnored(target, ignoreSelectors)) return null
  if (isDisabled(target)) return null
  return { element: target, fiber: resolveFiber(target) }
}

function findAmbientTarget(
  target: Element,
  ignoreSelectors: readonly string[],
): FilterResult | null {
  if (isIgnored(target, ignoreSelectors)) return null
  return { element: target, fiber: resolveFiber(target) }
}

/**
 * Returns the raw fiber if the element is interactive, or undefined if not.
 * null means "interactive but no fiber found" (semantic tag / ARIA role).
 */
function findInteractiveFiber(el: Element, eventType: string): object | null | undefined {
  // 1. Semantic tag
  if (INTERACTIVE_TAGS.has(el.tagName)) return resolveFiber(el)

  // 2. ARIA role
  const role = el.getAttribute('role')
  if (role !== null && INTERACTIVE_ROLES.has(role)) return resolveFiber(el)

  // 3. React event handler via fiber
  const handlers = getHandlersForEvent(eventType)
  if (handlers.length > 0) {
    const fiber = resolveFiber(el)
    if (fiber !== null) {
      const props = (fiber as any).memoizedProps
      if (props !== null && props !== undefined) {
        for (const handler of handlers) {
          if (typeof props[handler] === 'function') return fiber
        }
      }
    }
  }

  return undefined
}

export function isIgnored(element: Element, ignoreSelectors: readonly string[]): boolean {
  return ignoreSelectors.some((selector) => safeMatches(element, selector))
}

export function isDisabled(el: Element): boolean {
  return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
}
