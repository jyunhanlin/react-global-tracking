function scheduleIdle(cb: IdleRequestCallback, opts?: IdleRequestOptions): number {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(cb, opts)
  }
  return setTimeout(cb, opts?.timeout ?? 0) as unknown as number
}

function cancelIdle(id: number): void {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IdleFn<T extends (...args: any[]) => void> {
  (...args: Parameters<T>): void
  cancel(): void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function idle<T extends (...args: any[]) => void>(fn: T, timeout: number): IdleFn<T> {
  let pendingIds: ReturnType<typeof scheduleIdle>[] = []

  const idled = (...args: Parameters<T>): void => {
    const id = scheduleIdle(() => {
      pendingIds = pendingIds.filter((pid) => pid !== id)
      fn(...args)
    }, { timeout })
    pendingIds = [...pendingIds, id]
  }

  idled.cancel = (): void => {
    for (const id of pendingIds) {
      cancelIdle(id)
    }
    pendingIds = []
  }

  return idled
}
