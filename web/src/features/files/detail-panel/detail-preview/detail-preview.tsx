import { fileBadge, size } from '@infrastructure'

import { AspectRatio, Badge, Box } from '@mantine/core'

import type { Entry } from '@domain'

import { FilePlaceholder, previewStrategies } from '../../card'
import classes from '../detail-panel.module.css'

export function DetailPreview({
  entry,
  root,
  path,
}: {
  entry: Entry
  root: string
  path: string
}) {
  const strategy = previewStrategies.find((s) => s.match(entry))
  const content = strategy ? (
    strategy.render({ entry, root, path })
  ) : (
    <FilePlaceholder entry={entry} />
  )

  return (
    <Box className={classes.preview}>
      <AspectRatio ratio={16 / 10}>{content}</AspectRatio>
      <Badge className={classes.previewBadge} variant="default" radius="sm">
        {fileBadge(entry.name)} · {size(entry.size)}
      </Badge>
    </Box>
  )
}
