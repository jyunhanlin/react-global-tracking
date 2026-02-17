export function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector)
  } catch {
    return false
  }
}

export function safeClosest(element: Element, selector: string): boolean {
  try {
    return element.closest(selector) !== null
  } catch {
    return false
  }
}
