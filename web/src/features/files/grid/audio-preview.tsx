import { computeWaveform } from '@infrastructure'
import { Box, Center, ThemeIcon } from '@mantine/core'
import { PlayIcon } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadUrl, type Entry } from '@domain'
import classes from './grid.module.css'
import { FilePlaceholder } from './placeholder'

export type AudioPreviewProps = {
  entry: Entry
  root: string
  path: string
}

/** Skip decoding files larger than this — the whole file must be downloaded. */
const MAX_BYTES = 30 * 1024 * 1024
const PLAYED_COLOR = '#5e6ad2'
const UNPLAYED_COLOR = '#6b6d75'

function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  progress: number,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round((canvas.clientWidth || 480) * dpr)
  const h = Math.round((canvas.clientHeight || 300) * dpr)
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  const n = peaks.length
  const step = w / n
  const barWidth = Math.max(step * 0.55, 1)

  for (let i = 0; i < n; i++) {
    const barHeight = Math.max(peaks[i] * h * 0.82, dpr)
    const x = i * step + (step - barWidth) / 2
    ctx.fillStyle = i / n < progress ? PLAYED_COLOR : UNPLAYED_COLOR
    ctx.fillRect(x, (h - barHeight) / 2, barWidth, barHeight)
  }
}

export function AudioPreview({ entry, root, path }: AudioPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const url = downloadUrl(root, filePath)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const peaksRef = useRef<number[] | null>(null)
  const progressRef = useRef(0)
  const rafRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas && peaksRef.current) {
      drawWaveform(canvas, peaksRef.current, progressRef.current)
    }
  }, [])

  useEffect(() => {
    if (entry.size > MAX_BYTES) {
      setFailed(true)
      return
    }

    let cancelled = false
    setFailed(false)
    computeWaveform(url)
      .then((peaks) => {
        if (cancelled) return
        peaksRef.current = peaks
        draw()
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [url, entry.size, draw])

  if (failed) return <FilePlaceholder entry={entry} />

  const play = () => {
    const audio = audioRef.current
    if (!audio) return
    audio
      .play()
      .then(() => {
        setPlaying(true)
        const loop = () => {
          progressRef.current = audio.duration
            ? audio.currentTime / audio.duration
            : 0
          draw()
          rafRef.current = requestAnimationFrame(loop)
        }
        loop()
      })
      .catch(() => {})
  }

  const stop = () => {
    const audio = audioRef.current
    cancelAnimationFrame(rafRef.current)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    progressRef.current = 0
    setPlaying(false)
    draw()
  }

  return (
    <Box className={classes.audio} onPointerEnter={play} onPointerLeave={stop}>
      <canvas ref={canvasRef} className={classes.audioCanvas} />
      {/* biome-ignore lint/a11y/useMediaCaption: audio file preview, no captions */}
      <audio ref={audioRef} src={url} preload="none" />
      <Center className={classes.audioBadge} data-hidden={playing || undefined}>
        <ThemeIcon variant="default" radius="sm" size={44} mb="lg">
          <PlayIcon weight="fill" size={18} />
        </ThemeIcon>
      </Center>
    </Box>
  )
}
