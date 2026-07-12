import { dayjs, relativeTime } from '@infrastructure'

import type { Entry } from '@domain'

export type MetaRow = { label: string; value: string }

export function buildRows(
  entry: Entry,
  root: string,
  path: string,
  dims: string | null,
  kindLabel: string,
): MetaRow[] {
  const where = [root, ...(path ? path.split('/') : [])].join(' / ')

  return [
    { label: 'Kind', value: kindLabel },
    { label: 'Size', value: `${entry.size.toLocaleString()} bytes` },
    dims && { label: 'Dimensions', value: dims },
    { label: 'Created', value: dayjs.unix(entry.created).format('ll') },
    { label: 'Modified', value: relativeTime(entry.modified) },
    { label: 'Where', value: where },
  ].filter(Boolean) as MetaRow[]
}
