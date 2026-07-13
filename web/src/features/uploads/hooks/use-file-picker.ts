import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'

export function useFilePicker(onFiles: (files: File[]) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handle = (files: FileList | null) => {
    if (!files || files.length === 0) return
    onFiles(Array.from(files))
  }

  return {
    inputRef,
    dragging,
    openPicker: () => inputRef.current?.click(),
    onInputChange: (e: ChangeEvent<HTMLInputElement>) => {
      handle(e.currentTarget.files)
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
      handle(e.dataTransfer.files)
    },
  }
}
