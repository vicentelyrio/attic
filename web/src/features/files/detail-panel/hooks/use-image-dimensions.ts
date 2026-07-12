import { useEffect, useState } from 'react'

import { fileKind } from '@infrastructure'

import { downloadUrl, type Entry } from '@domain'

export function useImageDimensions(entry: Entry, root: string, path: string) {
  const [dims, setDims] = useState<string | null>(null)

  useEffect(() => {
    setDims(null)
    if (fileKind(entry.name).category !== 'image') return

    const filePath = path ? `${path}/${entry.name}` : entry.name
    const img = new Image()
    img.onload = () => setDims(`${img.naturalWidth} × ${img.naturalHeight}`)
    img.src = downloadUrl(root, filePath)
    return () => {
      img.onload = null
    }
  }, [entry.name, root, path])

  return dims
}
