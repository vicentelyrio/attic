import {
  type CollisionDetection,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'

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
