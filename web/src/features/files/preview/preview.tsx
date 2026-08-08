import { useCallback, useState } from 'react'

import { useI18nContext } from '@i18n'
import { fileKind } from '@infrastructure'

import { Box, Portal } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'

import type { Entry } from '@domain'

import { useDetailPanel } from '../detail-panel/hooks'
import classes from './preview.module.css'
import { PreviewHints } from './preview-hints'
import { PreviewInfo } from './preview-info'
import { PreviewStage } from './preview-stage'
import { PreviewToolbar } from './preview-toolbar'

export type FilePreviewProps = {
  entry: Entry
  root: string
  path: string
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}

const ZOOM_MIN = 0.1
const ZOOM_MAX = 5
const ZOOM_STEP = 0.25

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
}

export function FilePreview({
  entry,
  root,
  path,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: FilePreviewProps) {
  const { LL } = useI18nContext()
  const { rows, viewUrl, downloadHref, copied, share } = useDetailPanel(
    entry,
    root,
    path,
  )

  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const [infoOpen, setInfoOpen] = useState(true)

  const category = fileKind(entry.name).category
  const zoomable = category === 'image' || category === 'pdf'
  const canNavigate = total > 1

  const onImageLoad = useCallback((scale: number) => {
    const clamped = clampZoom(scale)
    setFitScale(clamped)
    setZoom(clamped)
  }, [])

  const toggleZoom = () =>
    zoomable && setZoom((z) => (Math.abs(z - fitScale) < 0.01 ? 1 : fitScale))

  useHotkeys([
    ['ArrowLeft', onPrev],
    ['ArrowRight', onNext],
    ['i', () => setInfoOpen((v) => !v)],
    ['Escape', onClose],
    [
      'Space',
      (e: KeyboardEvent) => {
        if (!zoomable) return
        e.preventDefault()
        toggleZoom()
      },
      { preventDefault: false },
    ],
  ])

  const location = [root, ...(path ? path.split('/') : [])].join(' / ')

  return (
    <Portal>
      <Box className={classes.overlay}>
        <PreviewToolbar
          entry={entry}
          position={LL.preview.position({ index: index + 1, total })}
          location={location}
          zoom={zoom}
          zoomable={zoomable}
          downloadHref={downloadHref}
          onZoomIn={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
          onZoomOut={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
          onClose={onClose}
        />

        <Box className={classes.body}>
          <Box className={classes.stageWrap}>
            <PreviewStage
              entry={entry}
              root={root}
              path={path}
              zoom={zoom}
              onPrev={onPrev}
              onNext={onNext}
              onToggleZoom={toggleZoom}
              onImageLoad={onImageLoad}
              canNavigate={canNavigate}
            />
            <PreviewHints />
          </Box>

          {infoOpen && (
            <PreviewInfo
              rows={rows}
              viewUrl={viewUrl}
              copied={copied}
              onShare={share}
              onClose={() => setInfoOpen(false)}
            />
          )}
        </Box>
      </Box>
    </Portal>
  )
}
