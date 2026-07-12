import { useRef, useState } from 'react'

import { spotlight } from '@mantine/spotlight'

import {
  FilePlusIcon,
  FolderPlusIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react'

import { useFileOps, useUploads } from '@domain'

import type { NewEntryKind } from '../../files/context-menu/new-entry-dialog'
import type { ActionDef } from '../helpers'

export function useQuickActions(
  root: string,
  path: string,
  isCommand: boolean,
  term: string,
) {
  const [newEntry, setNewEntry] = useState<NewEntryKind | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fileOps = useFileOps(root, path)
  const uploads = useUploads(root, path)

  const pickFiles = (list: FileList | null) => {
    const files = list ? Array.from(list) : []
    if (files.length) uploads.add(files)
    if (inputRef.current) inputRef.current.value = ''
    spotlight.close()
  }

  const createEntry = (name: string) => {
    const op = newEntry === 'folder' ? fileOps.mkdir : fileOps.touch
    op.mutate(name, {
      onSuccess: () => {
        setNewEntry(null)
        spotlight.close()
      },
    })
  }

  const actions: ActionDef[] = [
    {
      icon: <FilePlusIcon />,
      label: 'New file',
      onClick: () => setNewEntry('file'),
    },
    {
      icon: <FolderPlusIcon weight="fill" />,
      label: 'New folder',
      onClick: () => setNewEntry('folder'),
    },
    {
      icon: <UploadSimpleIcon />,
      label: 'Upload…',
      onClick: () => inputRef.current?.click(),
    },
  ]

  const shownActions = isCommand
    ? actions.filter((a) => a.label.toLowerCase().includes(term))
    : actions

  const creating =
    newEntry === 'folder' ? fileOps.mkdir.isPending : fileOps.touch.isPending

  return {
    actions: shownActions,
    newEntry,
    openNew: setNewEntry,
    closeNew: () => setNewEntry(null),
    createEntry,
    creating,
    inputRef,
    pickFiles,
  }
}
