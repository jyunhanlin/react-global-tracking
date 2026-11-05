export const EventCategory = {
  Pointer: 'pointer',
  Form: 'form',
  Ambient: 'ambient',
} as const

export type EventCategory = (typeof EventCategory)[keyof typeof EventCategory]

interface EventSpec {
  readonly category: EventCategory
  // React handler prop names used to detect interactivity (pointer events only
  // need them; other categories keep them for completeness).
  readonly handlers: readonly string[]
}

// Single source of truth: one row per known DOM event type.
// Unknown event types fall back to Ambient with no handlers.
const EVENT_SPECS: Readonly<Record<string, EventSpec>> = {
  // Pointer — click includes related mouse/pointer handlers because an element
  // with only onMouseDown (no onClick) is still interactive from a tracking perspective.
  click: {
    category: EventCategory.Pointer,
    handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onPointerDown', 'onPointerUp'],
  },
  touchstart: { category: EventCategory.Pointer, handlers: ['onTouchStart'] },
  touchend: { category: EventCategory.Pointer, handlers: ['onTouchEnd'] },

  // Form
  input: { category: EventCategory.Form, handlers: ['onChange', 'onInput'] },
  change: { category: EventCategory.Form, handlers: ['onChange'] },
  focus: { category: EventCategory.Form, handlers: ['onFocus'] },
  blur: { category: EventCategory.Form, handlers: ['onBlur'] },
  submit: { category: EventCategory.Form, handlers: ['onSubmit'] },

  // Ambient
  scroll: { category: EventCategory.Ambient, handlers: ['onScroll'] },
  keydown: { category: EventCategory.Ambient, handlers: ['onKeyDown'] },
  keyup: { category: EventCategory.Ambient, handlers: ['onKeyUp'] },
  copy: { category: EventCategory.Ambient, handlers: ['onCopy'] },
  paste: { category: EventCategory.Ambient, handlers: ['onPaste'] },
  resize: { category: EventCategory.Ambient, handlers: [] },
  popstate: { category: EventCategory.Ambient, handlers: [] },
  hashchange: { category: EventCategory.Ambient, handlers: [] },
}

export function getEventCategory(eventType: string): EventCategory {
  return EVENT_SPECS[eventType]?.category ?? EventCategory.Ambient
}

export function getHandlersForEvent(eventType: string): readonly string[] {
  return EVENT_SPECS[eventType]?.handlers ?? []
}
