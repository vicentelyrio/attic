import { useState } from 'react'

import { Box, Center, Image, ThemeIcon } from '@mantine/core'

import { PlayIcon } from '@phosphor-icons/react'

import { downloadUrl, type Entry } from '@domain'

import { FilePlaceholder } from '@features'

import classes from './video.module.css'

export type VideoPreviewProps = {
  entry: Entry
  root: string
  path: string
  poster: string
}

export function VideoPreview({ entry, root, path, poster }: VideoPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const [failed, setFailed] = useState(false)
  const [hovering, setHovering] = useState(false)

  if (failed) return <FilePlaceholder entry={entry} />

  return (
    <Box
      className={classes.video}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Image
        src={poster}
        alt={entry.name}
        h="100%"
        w="100%"
        fit="cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      {hovering && (
        <video
          className={classes.videoEl}
          src={downloadUrl(root, filePath)}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => setHovering(false)}
        >
          <track kind="captions" />
        </video>
      )}
      <Center
        className={classes.videoBadge}
        data-hidden={hovering || undefined}
      >
        <ThemeIcon variant="default" radius="sm" size={44} mb="lg">
          <PlayIcon weight="fill" size={18} />
        </ThemeIcon>
      </Center>
    </Box>
  )
}
