import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'

import { type Picked, pickDropped, pickFiles } from '@domain'

export function useFilePicker(onFiles: (picked: Picked) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const emit = (picked: Picked) => {
    if (picked.files.length > 0 || picked.dirs.length > 0) onFiles(picked)
  }

  return {
    inputRef,
    folderRef,
    dragging,
    openPicker: () => inputRef.current?.click(),
    openFolderPicker: () => folderRef.current?.click(),
    onInputChange: (e: ChangeEvent<HTMLInputElement>) => {
      emit(pickFiles(e.currentTarget.files))
      e.currentTarget.value = ''
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault()
      setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      void pickDropped(e.dataTransfer).then(emit)
    },
  }
}
