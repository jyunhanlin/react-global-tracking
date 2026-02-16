import { getEventCategory, getHandlersForEvent, EventCategory } from './event-categories'
import { resolveFiber } from '../extract/fiber'

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

interface GetTrackableElementParams {
  readonly target: Element
  readonly ignoreSelectors: readonly string[]
  readonly eventType: string
}

export function findTrackableElement(params: GetTrackableElementParams): Element | null {
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
): Element | null {
  let current: Element | null = target
  let depth = 0

  while (current !== null && depth <= MAX_ANCESTOR_DEPTH) {
    if (isIgnored({ element: current, ignoreSelectors })) return null
    if (isDisabled(current)) return null
    if (isInteractiveElement(current, eventType)) return current
    current = current.parentElement
    depth++
  }

  return null
}

function findFormTarget(
  target: Element,
  ignoreSelectors: readonly string[],
): Element | null {
  if (isIgnored({ element: target, ignoreSelectors })) return null
  if (isDisabled(target)) return null
  return target
}

function findAmbientTarget(
  target: Element,
  ignoreSelectors: readonly string[],
): Element | null {
  if (isIgnored({ element: target, ignoreSelectors })) return null
  return target
}

function isInteractiveElement(el: Element, eventType: string): boolean {
  // 1. Semantic tag
  if (INTERACTIVE_TAGS.has(el.tagName)) return true

  // 2. ARIA role
  const role = el.getAttribute('role')
  if (role !== null && INTERACTIVE_ROLES.has(role)) return true

  // 3. React event handler via fiber
  const handlers = getHandlersForEvent(eventType)
  if (handlers.length > 0) {
    const fiber = resolveFiber(el)
    if (fiber !== null) {
      const props = (fiber as any).memoizedProps
      if (props !== null && props !== undefined) {
        for (const handler of handlers) {
          if (typeof props[handler] === 'function') return true
        }
      }
    }
  }

  return false
}

export function isIgnored(params: {
  readonly element: Element
  readonly ignoreSelectors: readonly string[]
}): boolean {
  return params.ignoreSelectors.some((selector) => params.element.matches(selector))
}

export function isDisabled(el: Element): boolean {
  return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
}
