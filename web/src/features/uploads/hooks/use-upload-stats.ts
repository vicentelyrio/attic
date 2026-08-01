import { useI18nContext } from '@i18n'
import { size } from '@infrastructure'

import type { Upload } from '@domain'

import { ACTIVE, formatEta } from '../helpers'
import { useRate } from './use-rate'

export function useUploadStats(items: Upload[]) {
  const { LL } = useI18nContext()
  const activeItems = items.filter((it) => ACTIVE.includes(it.status))
  const doneCount = items.filter((it) => it.status === 'done').length
  const busy = activeItems.length > 0

  const bytesTotal = items.reduce((n, it) => n + it.size, 0)
  const bytesDone = items.reduce(
    (n, it) => n + (it.status === 'done' ? it.size : it.loaded),
    0,
  )
  // A queue of only empty folders carries no bytes, so fall back to item count.
  const aggPercent =
    bytesTotal > 0
      ? (bytesDone / bytesTotal) * 100
      : items.length > 0
        ? (doneCount / items.length) * 100
        : 0
  const speed = useRate(bytesDone, busy)
  const eta = speed > 0 ? formatEta(LL, (bytesTotal - bytesDone) / speed) : ''

  const collapsedSubtitle = [
    `${Math.round(aggPercent)}%`,
    speed > 0 ? `${size(speed)}/s` : '',
    eta,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    activeItems,
    doneCount,
    busy,
    bytesTotal,
    aggPercent,
    speed,
    eta,
    collapsedSubtitle,
  }
}
