import { tabularDelimiter } from '@infrastructure'
import { Box, Table } from '@mantine/core'
import { useMemo } from 'react'
import { type Entry, useFilePreview } from '@domain'
import classes from './grid.module.css'
import { FilePlaceholder } from './placeholder'

export type CsvPreviewProps = {
  entry: Entry
  root: string
  path: string
}

/** Rows shown in the card — the rest is clipped. */
const MAX_ROWS = 10

/** Minimal CSV line parser: handles quoted fields and escaped quotes. */
function parseLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += char
    } else if (char === '"') {
      quoted = true
    } else if (char === delimiter) {
      cells.push(cell)
      cell = ''
    } else cell += char
  }

  cells.push(cell)
  return cells
}

export function CsvPreview({ entry, root, path }: CsvPreviewProps) {
  const filePath = path ? `${path}/${entry.name}` : entry.name
  const { data, isError } = useFilePreview(root, filePath, true)
  const delimiter = tabularDelimiter(entry.name) ?? ','

  const rows = useMemo(() => {
    if (!data) return []
    return data
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, MAX_ROWS)
      .map((line) => parseLine(line, delimiter))
  }, [data, delimiter])

  if (isError) return <FilePlaceholder entry={entry} />
  if (rows.length === 0) return <Box className={classes.csv} />

  const [header, ...body] = rows

  return (
    <Box className={classes.csv}>
      <Table className={classes.csvTable} withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            {header.map((cell, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: column order is stable
              <Table.Th key={i}>{cell}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {body.map((row, r) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: row order is stable
            <Table.Tr key={r}>
              {row.map((cell, c) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: cell order is stable
                <Table.Td key={c}>{cell}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  )
}
