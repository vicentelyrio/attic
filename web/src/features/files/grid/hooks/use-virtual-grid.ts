import { type RefObject, useMemo } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'

import type { Entry } from '@domain'

import { useElementWidth } from './use-element-width'

const MIN_CARD_WIDTH = 280
const GAP = 16

const HEADER_ESTIMATE = 32
const FOLDER_ROW_ESTIMATE = 72
const FILE_ROW_ESTIMATE = 260

export type GridRow =
  | { type: 'header'; key: string; label: string }
  | { type: 'row'; key: string; section: 'folders' | 'files'; entries: Entry[] }

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items]
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}

export function useVirtualGrid({
  scrollRef,
  folders,
  files,
  folderLabel,
  fileLabel,
}: {
  scrollRef: RefObject<HTMLElement | null>
  folders: Entry[]
  files: Entry[]
  folderLabel: string
  fileLabel: string
}) {
  const width = useElementWidth(scrollRef)
  const cols = Math.max(1, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP)))

  const rows = useMemo(() => {
    const result: GridRow[] = []
    if (folders.length > 0) {
      result.push({ type: 'header', key: 'header:folders', label: folderLabel })
      chunk(folders, cols).forEach((entries, i) => {
        result.push({
          type: 'row',
          key: `row:folders:${i}`,
          section: 'folders',
          entries,
        })
      })
    }
    if (files.length > 0) {
      result.push({ type: 'header', key: 'header:files', label: fileLabel })
      chunk(files, cols).forEach((entries, i) => {
        result.push({
          type: 'row',
          key: `row:files:${i}`,
          section: 'files',
          entries,
        })
      })
    }
    return result
  }, [folders, files, cols, folderLabel, fileLabel])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      const row = rows[i]
      if (!row) return HEADER_ESTIMATE
      if (row.type === 'header') return HEADER_ESTIMATE
      return row.section === 'folders' ? FOLDER_ROW_ESTIMATE : FILE_ROW_ESTIMATE
    },
    overscan: 3,
  })

  return { rows, virtualizer }
}
