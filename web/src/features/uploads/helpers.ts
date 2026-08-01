import type { ChangeEvent, DragEvent, RefObject } from 'react'

import type { TranslationFunctions } from '@i18n'

import type { Picked, Upload } from '@domain'

export type UploadView = 'hidden' | 'modal' | 'collapsed'

export const ACTIVE: Upload['status'][] = ['waiting', 'uploading']

export function percent(item: Upload): number {
  if (item.status === 'done') return 100
  if (item.size <= 0) return 0
  return Math.min(100, (item.loaded / item.size) * 100)
}

export function formatEta(LL: TranslationFunctions, seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 60) return LL.uploads.etaSeconds({ count: Math.round(seconds) })
  return LL.uploads.etaMinutes({ count: Math.round(seconds / 60) })
}

export type UploadsState = {
  view: UploadView
  open: () => void
  close: () => void
  minimize: () => void
  expand: () => void
  done: () => void
  location: string
  items: Upload[]
  add: (picked: Picked) => void
  cancel: (id: string) => void
  cancelAll: () => void
  inputRef: RefObject<HTMLInputElement | null>
  folderRef: RefObject<HTMLInputElement | null>
  dragging: boolean
  openPicker: () => void
  openFolderPicker: () => void
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  activeItems: Upload[]
  doneCount: number
  busy: boolean
  bytesTotal: number
  aggPercent: number
  speed: number
  eta: string
  collapsedSubtitle: string
}
