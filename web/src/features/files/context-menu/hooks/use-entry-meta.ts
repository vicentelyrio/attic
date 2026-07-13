import { useClipboard as useCopyToClipboard } from '@mantine/hooks'

import { downloadUrl, type Entry, useFavorites } from '@domain'

import { entryRelPath } from '../helpers'

export function useEntryMeta(root: string, path: string) {
  const favorites = useFavorites()
  const link = useCopyToClipboard({ timeout: 1200 })

  const rel = (e: Entry) => entryRelPath(path, e)

  return {
    isFavorite: (e: Entry) => !!favorites.find(root, rel(e)),
    toggleFavorite: (e: Entry) => {
      const existing = favorites.find(root, rel(e))
      if (existing) favorites.remove.mutate(existing.id)
      else favorites.add.mutate({ root, path: rel(e) })
    },
    share: (e: Entry) =>
      link.copy(`${location.origin}${downloadUrl(root, rel(e))}`),
    linkCopied: link.copied,
    openHref: (e: Entry) => downloadUrl(root, rel(e)),
    downloadHref: (e: Entry, download = false) =>
      downloadUrl(root, rel(e), download),
  }
}
