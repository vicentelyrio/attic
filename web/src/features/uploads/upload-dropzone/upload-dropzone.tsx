import type { DragEvent } from 'react'

import { Button, Group, Text } from '@mantine/core'

import { ArrowUpIcon, FileIcon, FolderIcon } from '@phosphor-icons/react'

import classes from './upload-dropzone.module.css'

type UploadDropzoneProps = {
  dragging: boolean
  onOpen: () => void
  onOpenFolder: () => void
  onDrop: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
}

export function UploadDropzone({
  dragging,
  onOpen,
  onOpenFolder,
  onDrop,
  onDragOver,
  onDragLeave,
}: UploadDropzoneProps) {
  return (
    <section
      aria-label="Upload drop zone"
      className={`${classes.dropzone} ${dragging ? classes.dropzoneActive : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className={classes.dropCircle}>
        <ArrowUpIcon size={20} weight="bold" />
      </span>
      <Text size="lg" fw={500}>
        Drop files or folders here
      </Text>
      <Group gap="xs">
        <Button
          variant="light"
          size="xs"
          leftSection={<FileIcon />}
          onClick={onOpen}
        >
          Browse files
        </Button>
        <Button
          variant="light"
          size="xs"
          leftSection={<FolderIcon weight="fill" />}
          onClick={onOpenFolder}
        >
          Browse folder
        </Button>
      </Group>
      <Text size="xs" c="dimmed" ff="monospace">
        Up to 5 GB per file · resumable · chunked
      </Text>
    </section>
  )
}
