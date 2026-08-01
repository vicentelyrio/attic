import type { DragEvent } from 'react'

import { useI18nContext } from '@i18n'

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
  const { LL } = useI18nContext()

  return (
    <section
      aria-label={LL.uploads.dropzoneLabel()}
      className={`${classes.dropzone} ${dragging ? classes.dropzoneActive : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className={classes.dropCircle}>
        <ArrowUpIcon size={20} weight="bold" />
      </span>
      <Text size="lg" fw={500}>
        {LL.uploads.dropHere()}
      </Text>
      <Group gap="xs">
        <Button
          variant="light"
          size="xs"
          leftSection={<FileIcon />}
          onClick={onOpen}
        >
          {LL.uploads.browseFiles()}
        </Button>
        <Button
          variant="light"
          size="xs"
          leftSection={<FolderIcon weight="fill" />}
          onClick={onOpenFolder}
        >
          {LL.uploads.browseFolder()}
        </Button>
      </Group>
      <Text size="xs" c="dimmed" ff="monospace">
        {LL.uploads.limits()}
      </Text>
    </section>
  )
}
