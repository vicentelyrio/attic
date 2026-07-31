import { type ChangeEvent, useRef, useState } from 'react'

import { spotlight } from '@mantine/spotlight'

import {
  FilePlusIcon,
  FolderPlusIcon,
  FolderSimpleIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react'

import { pickFiles, useFileOps, useUploads } from '@domain'

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
  const folderRef = useRef<HTMLInputElement>(null)

  const fileOps = useFileOps(root, path)
  const uploads = useUploads(root, path)

  const onPicked = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = pickFiles(e.currentTarget.files)
    if (picked.files.length > 0) uploads.add(picked)
    e.currentTarget.value = ''
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
    {
      icon: <FolderSimpleIcon weight="fill" />,
      label: 'Upload folder…',
      onClick: () => folderRef.current?.click(),
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
    folderRef,
    onPicked,
  }
}
