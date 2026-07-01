import { createModelViewer, type ModelViewer } from '@infrastructure'
import { Box } from '@mantine/core'
import { type PointerEvent, useEffect, useRef, useState } from 'react'
import { downloadUrl, type Entry } from '@domain'
import classes from './grid.module.css'
import { FilePlaceholder } from './placeholder'

export type ModelPreviewProps = {
  entry: Entry
  root: string
  path: string
}

function isInside(e: PointerEvent<HTMLElement>): boolean {
  const r = e.currentTarget.getBoundingClientRect()
  return (
    e.clientX >= r.left &&
    e.clientX <= r.right &&
    e.clientY >= r.top &&
    e.clientY <= r.bottom
  )
}

export function ModelPreview({ entry, root, path }: ModelPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const url = downloadUrl(root, filePath)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<ModelViewer | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    setFailed(false)
    createModelViewer(canvas, url)
      .then((viewer) => {
        if (disposed) viewer.dispose()
        else viewerRef.current = viewer
      })
      .catch(() => {
        if (!disposed) setFailed(true)
      })

    return () => {
      disposed = true
      viewerRef.current?.dispose()
      viewerRef.current = null
    }
  }, [url])

  if (failed) return <FilePlaceholder entry={entry} />

  return (
    <Box
      className={classes.model}
      onPointerEnter={() => viewerRef.current?.startSpin()}
      onPointerLeave={() => viewerRef.current?.stopSpin()}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        viewerRef.current?.beginDrag(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => viewerRef.current?.drag(e.clientX, e.clientY)}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId)
        viewerRef.current?.endDrag()
        // Resume spinning if the pointer is still over the card, otherwise rest.
        if (isInside(e)) viewerRef.current?.startSpin()
        else viewerRef.current?.stopSpin()
      }}
    >
      <canvas ref={canvasRef} className={classes.modelCanvas} />
    </Box>
  )
}
