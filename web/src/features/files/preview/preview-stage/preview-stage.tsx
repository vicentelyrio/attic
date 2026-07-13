import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react'

import { fileKind } from '@infrastructure'

import { ActionIcon, Box } from '@mantine/core'

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'

import { downloadUrl, type Entry } from '@domain'

import { FilePlaceholder, PdfPreview, previewStrategies } from '../../card'
import classes from './preview-stage.module.css'

const PDF_FULLSCREEN_WIDTH = 1600

export type PreviewStageProps = {
  entry: Entry
  root: string
  path: string
  zoom: number
  onPrev: () => void
  onNext: () => void
  onToggleZoom: () => void
  canNavigate: boolean
}

function PdfStage({ zoom, children }: { zoom: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: zoom drives the re-center; the body reads the DOM, not zoom
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2
  }, [zoom])

  return (
    <Box
      ref={ref}
      className={classes.document}
      style={{ '--pdf-zoom': zoom } as CSSProperties}
    >
      {children}
    </Box>
  )
}

function StageContent({
  entry,
  root,
  path,
  zoom,
  onToggleZoom,
}: Pick<
  PreviewStageProps,
  'entry' | 'root' | 'path' | 'zoom' | 'onToggleZoom'
>) {
  const { category } = fileKind(entry.name)
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const src = downloadUrl(root, filePath)

  if (category === 'image') {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard zoom is handled globally via Space
      <img
        className={classes.image}
        src={src}
        alt={entry.name}
        data-zoomed={zoom !== 1 || undefined}
        style={{ transform: `scale(${zoom})` }}
        onClick={onToggleZoom}
      />
    )
  }

  if (category === 'video') {
    return (
      <video className={classes.media} src={src} controls autoPlay>
        <track kind="captions" />
      </video>
    )
  }

  if (category === 'audio') {
    // biome-ignore lint/a11y/useMediaCaption: audio file preview, no captions
    return <audio className={classes.audio} src={src} controls autoPlay />
  }

  const strategy = previewStrategies.find((s) => s.match(entry))

  if (strategy && category === 'model') {
    return (
      <Box className={classes.boxed}>
        {strategy.render({ entry, root, path })}
      </Box>
    )
  }

  if (category === 'pdf') {
    return (
      <PdfStage zoom={zoom}>
        <PdfPreview
          entry={entry}
          root={root}
          path={path}
          width={PDF_FULLSCREEN_WIDTH}
        />
      </PdfStage>
    )
  }

  if (strategy) {
    return (
      <Box className={classes.fill}>
        {strategy.render({ entry, root, path })}
      </Box>
    )
  }

  return (
    <Box className={classes.boxed}>
      <FilePlaceholder entry={entry} />
    </Box>
  )
}

export function PreviewStage({
  entry,
  root,
  path,
  zoom,
  onPrev,
  onNext,
  onToggleZoom,
  canNavigate,
}: PreviewStageProps) {
  return (
    <Box className={classes.stage}>
      {canNavigate && (
        <ActionIcon
          className={`${classes.arrow} ${classes.arrowPrev}`}
          variant="default"
          radius="xl"
          size="xl"
          onClick={onPrev}
          aria-label="Previous"
        >
          <CaretLeftIcon size={20} />
        </ActionIcon>
      )}

      <StageContent
        entry={entry}
        root={root}
        path={path}
        zoom={zoom}
        onToggleZoom={onToggleZoom}
      />

      {canNavigate && (
        <ActionIcon
          className={`${classes.arrow} ${classes.arrowNext}`}
          variant="default"
          radius="xl"
          size="xl"
          onClick={onNext}
          aria-label="Next"
        >
          <CaretRightIcon size={20} />
        </ActionIcon>
      )}
    </Box>
  )
}
