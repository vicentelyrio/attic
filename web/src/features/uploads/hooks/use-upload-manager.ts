import { useUploads } from '@domain'

import type { UploadsState } from '../helpers'
import { useFilePicker } from './use-file-picker'
import { useUploadStats } from './use-upload-stats'
import { useUploadView } from './use-upload-view'

export function useUploadManager(root: string, path: string): UploadsState {
  const { items, add, cancel, cancelAll, clear } = useUploads(root, path)
  const view = useUploadView()
  const stats = useUploadStats(items)

  const picker = useFilePicker((files) => {
    add(files)
    view.setView('modal')
  })

  const location = path ? path.split('/').join(' / ') : root

  const close = () => {
    if (stats.busy) {
      view.setView('collapsed')
    } else {
      clear()
      view.setView('hidden')
    }
  }

  const done = () => {
    clear()
    view.setView('hidden')
  }

  return {
    view: view.view,
    open: view.open,
    close,
    minimize: view.minimize,
    expand: view.expand,
    done,
    location,
    items,
    add,
    cancel,
    cancelAll,
    inputRef: picker.inputRef,
    dragging: picker.dragging,
    openPicker: picker.openPicker,
    onInputChange: picker.onInputChange,
    onDrop: picker.onDrop,
    onDragOver: picker.onDragOver,
    onDragLeave: picker.onDragLeave,
    activeItems: stats.activeItems,
    doneCount: stats.doneCount,
    busy: stats.busy,
    bytesTotal: stats.bytesTotal,
    aggPercent: stats.aggPercent,
    speed: stats.speed,
    eta: stats.eta,
    collapsedSubtitle: stats.collapsedSubtitle,
  }
}
