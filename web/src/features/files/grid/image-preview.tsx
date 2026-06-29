import { Image } from '@mantine/core'
import { useState } from 'react'
import type { Entry } from '@domain'
import { FilePlaceholder } from './placeholder'

export type ImagePreviewProps = {
  entry: Entry
  src: string
}

export function ImagePreview({ entry, src }: ImagePreviewProps) {
  const [failed, setFailed] = useState(false)

  if (failed) return <FilePlaceholder entry={entry} />

  return (
    <Image
      src={src}
      alt={entry.name}
      h="100%"
      w="100%"
      fit="cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
