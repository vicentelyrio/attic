import { Box, Center, ThemeIcon } from '@mantine/core'
import { PlayIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { downloadUrl, type Entry } from '@domain'
import { FilePlaceholder } from '@features'
import classes from './video.module.css'

export type VideoPreviewProps = {
  entry: Entry
  root: string
  path: string
}

/** Frame (seconds) used as the poster — past a likely-black first frame. */
const POSTER_TIME = 0.5

export function VideoPreview({ entry, root, path }: VideoPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)

  const play = () => {
    const video = videoRef.current
    if (!video) return
    video.loop = true
    video.currentTime = 0
    // Muted playback is allowed without a user gesture; ignore aborts from a
    // quick pointer leave that cancels the pending play() promise.
    video
      .play()
      .then(() => setPlaying(true))
      .catch(() => {})
  }

  const stop = () => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = POSTER_TIME
    setPlaying(false)
  }

  if (failed) return <FilePlaceholder entry={entry} />

  return (
    <Box className={classes.video} onMouseEnter={play} onMouseLeave={stop}>
      <video
        ref={videoRef}
        className={classes.videoEl}
        src={`${downloadUrl(root, filePath)}#t=${POSTER_TIME}`}
        preload="metadata"
        muted
        playsInline
        onError={() => setFailed(true)}
      >
        <track kind="captions" />
      </video>
      <Center className={classes.videoBadge} data-hidden={playing || undefined}>
        <ThemeIcon variant="default" radius="sm" size={44} mb="lg">
          <PlayIcon weight="fill" size={18} />
        </ThemeIcon>
      </Center>
    </Box>
  )
}
