import { useDroppable } from '@dnd-kit/core'

import { useDragPayload } from './drag-context'
import { canAcceptDrop } from './helpers'
import type { DropPayload } from './types'

/** Drop target for a folder — a row/card, breadcrumb, or sidebar entry. */
export function useDroppableFolder({
  root,
  dir,
  disabled,
}: {
  root: string
  dir: string
  disabled?: boolean
}) {
  const drag = useDragPayload()
  const { setNodeRef, isOver } = useDroppable({
    id: `folder:${root}:${dir}`,
    disabled,
    data: { root, dir } satisfies DropPayload,
  })

  const dragItems = drag?.items
  const valid = dragItems ? canAcceptDrop(dragItems, { root, dir }) : false

  return {
    setNodeRef,
    dropActive: isOver && valid,
    dropInvalid: isOver && !valid && !!dragItems,
  }
}
