import { looksBinary, shikiLang } from '@infrastructure'
import { CodeHighlight } from '@mantine/code-highlight'
import { Box } from '@mantine/core'
import { type Entry, useFilePreview } from '@domain'
import { FilePlaceholder } from '../../placeholder'
import classes from './code.module.css'

export type CodePreviewProps = {
  entry: Entry
  root: string
  path: string
}

export function CodePreview({ entry, root, path }: CodePreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const { data, isError } = useFilePreview(root, filePath, true)

  // Unrecognized files are previewed as text, but bail to the placeholder if
  // the sampled bytes turn out to be binary (e.g. an unmapped binary format).
  if (isError || (data && looksBinary(data))) {
    return <FilePlaceholder entry={entry} />
  }

  return (
    <Box className={classes.code}>
      <CodeHighlight
        code={data ?? ''}
        language={shikiLang(entry.name)}
        withCopyButton={false}
        classNames={{
          codeHighlight: classes.codeRoot,
          pre: classes.codePre,
        }}
      />
    </Box>
  )
}
