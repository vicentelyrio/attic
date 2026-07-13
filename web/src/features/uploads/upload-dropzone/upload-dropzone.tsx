import type { DragEvent } from 'react'

import { Text } from '@mantine/core'

import { ArrowUpIcon } from '@phosphor-icons/react'

import classes from './upload-dropzone.module.css'

type UploadDropzoneProps = {
  dragging: boolean
  onOpen: () => void
  onDrop: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
}

export function UploadDropzone({
  dragging,
  onOpen,
  onDrop,
  onDragOver,
  onDragLeave,
}: UploadDropzoneProps) {
  return (
    <button
      type="button"
      className={`${classes.dropzone} ${dragging ? classes.dropzoneActive : ''}`}
      onClick={onOpen}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className={classes.dropCircle}>
        <ArrowUpIcon size={20} weight="bold" />
      </span>
      <Text size="lg" fw={500}>
        Drop files here, or <span className={classes.browse}>browse</span>
      </Text>
      <Text size="xs" c="dimmed" ff="monospace">
        Up to 5 GB per file · resumable · chunked
      </Text>
    </button>
  )
}
