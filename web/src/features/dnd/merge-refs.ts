import type { Ref, RefCallback } from 'react'

/** Combines multiple refs onto a single DOM node — used where an entry is
 *  both a drag source and a drop target (e.g. a folder row/card). */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else (ref as { current: T | null }).current = node
    }
  }
}
