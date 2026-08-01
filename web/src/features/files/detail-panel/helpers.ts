import type { TranslationFunctions } from '@i18n'
import { dayjs, relativeTime } from '@infrastructure'

import type { Entry } from '@domain'

export type MetaRow = { label: string; value: string }

export function buildRows(
  LL: TranslationFunctions,
  entry: Entry,
  root: string,
  path: string,
  dims: string | null,
  kindLabel: string,
): MetaRow[] {
  const where = [root, ...(path ? path.split('/') : [])].join(' / ')

  return [
    { label: LL.common.kind(), value: kindLabel },
    {
      label: LL.common.size(),
      value: LL.detail.bytes({ value: entry.size.toLocaleString() }),
    },
    dims && { label: LL.detail.dimensions(), value: dims },
    {
      label: LL.detail.created(),
      value: dayjs.unix(entry.created).format('ll'),
    },
    { label: LL.common.modified(), value: relativeTime(entry.modified) },
    { label: LL.detail.where(), value: where },
  ].filter(Boolean) as MetaRow[]
}
