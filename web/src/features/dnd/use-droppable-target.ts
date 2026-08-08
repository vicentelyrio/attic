import { useDroppable } from '@dnd-kit/core'

import { useDragPayload } from './drag-context'
import { canAcceptDrop } from './helpers'
import type { DropPayload } from './types'

export function useDroppableFolder({
  scope,
  root,
  dir,
  disabled,
}: {
  scope: string
  root: string
  dir: string
  disabled?: boolean
}) {
  const drag = useDragPayload()
  const { setNodeRef, isOver } = useDroppable({
    id: `folder:${scope}:${root}:${dir}`,
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
