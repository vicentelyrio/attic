import { useEffect, useState } from 'react'
import { Box } from '@mantine/core'

import { type Entry, useFilePreview } from '@domain'
import { renderMarkdown } from '@infrastructure'
import { FilePlaceholder } from '@features'

import classes from './markdown.module.css'

export type MarkdownPreviewProps = {
  entry: Entry
  root: string
  path: string
}

export function MarkdownPreview({ entry, root, path }: MarkdownPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const { data, isError } = useFilePreview(root, filePath, true)
  const [html, setHtml] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (data === undefined) return
    let cancelled = false
    renderMarkdown(data)
      .then((result) => {
        if (!cancelled) setHtml(result)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [data])

  if (isError || failed) return <FilePlaceholder entry={entry} />

  return (
    <Box className={classes.markdown}>
      <div
        className={classes.markdownBody}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify
        dangerouslySetInnerHTML={{ __html: html ?? '' }}
      />
    </Box>
  )
}
