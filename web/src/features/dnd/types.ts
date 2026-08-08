export interface DragItem {
  root: string
  path: string
  name: string
  isDir: boolean
}

export interface DragPayload {
  items: DragItem[]
}

export interface DropPayload {
  root: string
  dir: string
}
