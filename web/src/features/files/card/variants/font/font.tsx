import { Box } from '@mantine/core'
import { useEffect, useId, useState } from 'react'
import { downloadUrl, type Entry } from '@domain'
import { FilePlaceholder } from '../../placeholder'
import classes from './font.module.css'

export type FontPreviewProps = {
  entry: Entry
  root: string
  path: string
}

export function FontPreview({ entry, root, path }: FontPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const url = downloadUrl(root, filePath)
  const family = `font-preview-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setFailed(false)

    const face = new FontFace(family, `url("${url}")`)
    face
      .load()
      .then((loaded) => {
        if (cancelled) return
        document.fonts.add(loaded)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      document.fonts.delete(face)
    }
  }, [url, family])

  if (failed) return <FilePlaceholder entry={entry} />

  return (
    <Box
      className={classes.font}
      style={ready ? { fontFamily: `"${family}"` } : undefined}
    >
      <div className={classes.fontHero}>Ag</div>
      <div className={classes.fontPangram}>
        The quick brown fox jumps over the lazy dog
      </div>
      <div className={classes.fontGlyphs}>
        ABCDEFGHIJKLM abcdefghijklm 0123456789
      </div>
    </Box>
  )
}
