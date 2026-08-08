import {
  type CollisionDetection,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'

/** Pointer-accurate hit testing (so small, dense targets like breadcrumbs
 *  and favorites resolve correctly), with two refinements:
 *  - falls back to rect-intersection when the pointer isn't exactly over
 *    any target, so a near-miss still resolves to something instead of
 *    dropping nothing
 *  - when the pointer is over several nested targets at once (e.g. a
 *    folder row inside the current-directory background), prefers the
 *    smallest one, so the specific row wins over the whole view */
export const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  if (hits.length === 0) return rectIntersection(args)
  if (hits.length === 1) return hits

  const area = (id: string | number) => {
    const rect = args.droppableRects.get(id)
    return rect ? rect.width * rect.height : Number.POSITIVE_INFINITY
  }

  return [...hits].sort((a, b) => area(a.id) - area(b.id))
}
