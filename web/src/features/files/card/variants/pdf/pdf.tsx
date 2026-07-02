import { useEffect, useRef, useState } from 'react'

import { renderPdfThumbnail } from '@infrastructure'

import { Box } from '@mantine/core'

import { downloadUrl, type Entry } from '@domain'

import { FilePlaceholder } from '@features'

import classes from './pdf.module.css'

export type PdfPreviewProps = {
  entry: Entry
  root: string
  path: string
}

export function PdfPreview({ entry, root, path }: PdfPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const url = downloadUrl(root, filePath)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setFailed(false)
    const handle = renderPdfThumbnail(canvas, url, {
      onError: () => setFailed(true),
    })
    return () => handle.cancel()
  }, [url])

  if (failed) return <FilePlaceholder entry={entry} />

  return (
    <Box className={classes.pdf}>
      <canvas ref={canvasRef} className={classes.pdfCanvas} />
    </Box>
  )
}
