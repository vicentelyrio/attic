import type { DragItem, DropPayload } from './types'

export function parentDir(path: string): string {
  const i = path.lastIndexOf('/')
  return i === -1 ? '' : path.slice(0, i)
}

/** Last path segment for display, or the root name when at its top. */
export function folderLabel(root: string, dir: string): string {
  if (!dir) return root
  const i = dir.lastIndexOf('/')
  return i === -1 ? dir : dir.slice(i + 1)
}

export function basename(path: string): string {
  const i = path.lastIndexOf('/')
  return i === -1 ? path : path.slice(i + 1)
}

/** Rejects drops that are no-ops (already in the target folder) or that
 *  would move a folder into itself or one of its own descendants. */
export function canAcceptItem(item: DragItem, target: DropPayload): boolean {
  const parent = parentDir(item.path)

  if (item.root === target.root && target.dir === parent) return false

  if (
    item.isDir &&
    item.root === target.root &&
    (target.dir === item.path || target.dir.startsWith(`${item.path}/`))
  )
    return false

  return true
}

export function canAcceptDrop(items: DragItem[], target: DropPayload): boolean {
  return items.some((item) => canAcceptItem(item, target))
}
