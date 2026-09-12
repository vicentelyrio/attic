import type { ReactNode } from 'react'

import {
  fileExt,
  fileKind,
  isTextFile,
  tabularDelimiter,
} from '@infrastructure'

import { downloadUrl, type Entry, thumbnailUrl } from '@domain'

import { AudioPreview } from './audio'
import { CodePreview } from './code'
import { CsvPreview } from './csv'
import { FontPreview } from './font'
import { ImagePreview } from './image'
import { MarkdownPreview } from './markdown'
import { ModelPreview } from './model'
import { PdfPreview } from './pdf'
import { VideoPreview } from './video'

export type PreviewContext = {
  entry: Entry
  root: string
  path: string
}

export type PreviewStrategy = {
  match: (entry: Entry) => boolean
  render: (ctx: PreviewContext) => ReactNode
  heavy?: boolean
}

const isCategory = (name: string, category: string) =>
  fileKind(name).category === category

/**
 * Ordered registry mapping a file to its preview variant. To add a format, drop
 * a new strategy in here — order matters only where matchers overlap (tabular
 * and text both accept `.csv`, so tabular is listed first).
 */
export const previewStrategies: PreviewStrategy[] = [
  {
    match: (entry) => isCategory(entry.name, 'image'),
    heavy: false,
    render: ({ entry, root, path }) => {
      const filePath = path ? `${path}/${entry.name}` : entry.name
      const src =
        fileExt(entry.name) === 'svg'
          ? downloadUrl(root, filePath)
          : thumbnailUrl(root, filePath)
      return <ImagePreview entry={entry} src={src} />
    },
  },
  {
    match: (entry) => isCategory(entry.name, 'video'),
    heavy: false,
    render: ({ entry, root, path }) => {
      const filePath = path ? `${path}/${entry.name}` : entry.name
      return (
        <VideoPreview
          entry={entry}
          root={root}
          path={path}
          poster={thumbnailUrl(root, filePath)}
        />
      )
    },
  },
  {
    match: (entry) => isCategory(entry.name, 'audio'),
    render: (ctx) => <AudioPreview {...ctx} />,
  },
  {
    match: (entry) => isCategory(entry.name, 'pdf'),
    render: (ctx) => <PdfPreview {...ctx} />,
  },
  {
    match: (entry) => isCategory(entry.name, 'model'),
    render: (ctx) => <ModelPreview {...ctx} />,
  },
  {
    match: (entry) => isCategory(entry.name, 'font'),
    render: (ctx) => <FontPreview {...ctx} />,
  },
  {
    match: (entry) => isCategory(entry.name, 'markdown'),
    render: (ctx) => <MarkdownPreview {...ctx} />,
  },
  {
    match: (entry) => tabularDelimiter(entry.name) !== null,
    render: (ctx) => <CsvPreview {...ctx} />,
  },
  {
    match: (entry) => isTextFile(entry.name),
    render: (ctx) => <CodePreview {...ctx} />,
  },
]
