import { useDraggable } from '@dnd-kit/core'

import type { Entry } from '@domain'

import type { DragPayload } from './types'

export function useDraggableEntry({
  root,
  path,
  entry,
  dragEntries,
  disabled,
}: {
  root: string
  path: string
  entry: Entry
  dragEntries: Entry[]
  disabled?: boolean
}) {
  const rel = (name: string) => (path ? `${path}/${name}` : name)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `entry:${root}:${rel(entry.name)}`,
    disabled,
    data: {
      items: dragEntries.map((e) => ({
        root,
        path: rel(e.name),
        name: e.name,
        isDir: e.is_dir,
      })),
    } satisfies DragPayload,
  })

  return { attributes, listeners, setNodeRef, isDragging }
}
