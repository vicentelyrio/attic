import { useMemo } from 'react'

import { kindLabel, useI18nContext } from '@i18n'
import { fileKind } from '@infrastructure'

import { useClipboard } from '@mantine/hooks'

import { downloadUrl, type Entry } from '@domain'

import { buildRows } from '../helpers'
import { useImageDimensions } from './use-image-dimensions'

export function useDetailPanel(entry: Entry, root: string, path: string) {
  const { LL } = useI18nContext()
  const clipboard = useClipboard({ timeout: 1500 })
  const dims = useImageDimensions(entry, root, path)

  const filePath = path ? `${path}/${entry.name}` : entry.name
  const viewUrl = downloadUrl(root, filePath)
  const downloadHref = downloadUrl(root, filePath, true)
  const label = kindLabel(LL, fileKind(entry.name))

  const rows = useMemo(
    () => buildRows(LL, entry, root, path, dims, label),
    [LL, entry, root, path, dims, label],
  )

  return {
    rows,
    viewUrl,
    downloadHref,
    copied: clipboard.copied,
    share: () => clipboard.copy(`${location.origin}${viewUrl}`),
  }
}
