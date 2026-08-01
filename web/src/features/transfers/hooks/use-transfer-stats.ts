import { useI18nContext } from '@i18n'
import { size } from '@infrastructure'

import type { Job } from '@domain'

import { ACTIVE, FINISHED, formatEta, TRANSFERRING } from '../helpers'
import { useRate } from './use-rate'

export function useTransferStats(jobs: Job[] | undefined) {
  const { LL } = useI18nContext()
  const list = jobs ?? []
  const visible = list.slice(0, 8)
  const activeJobs = visible.filter((j) => ACTIVE.includes(j.status))
  const transferring = visible.filter((j) => TRANSFERRING.includes(j.status))
  const hasFinished = list.some((j) => FINISHED.includes(j.status))

  const bytesDone = transferring.reduce((n, j) => n + j.bytes_done, 0)
  const bytesTotal = transferring.reduce((n, j) => n + j.bytes_total, 0)
  const aggPercent = bytesTotal > 0 ? (bytesDone / bytesTotal) * 100 : 0
  const speed = useRate(bytesDone, transferring.length > 0)
  const remaining = bytesTotal - bytesDone
  const eta = speed > 0 ? formatEta(LL, remaining / speed) : ''

  const busy = activeJobs.length > 0
  const count = transferring.length
  const title =
    count > 0
      ? LL.transfers.transferring({ count })
      : busy
        ? LL.transfers.resolveConflicts()
        : LL.transfers.title()
  const subtitle =
    count > 0
      ? [`${size(speed)}/s`, eta].filter(Boolean).join(' · ')
      : list.length > 0
        ? LL.transfers.complete({
            count: list.filter((j) => j.status === 'done').length,
          })
        : LL.transfers.empty()
  const sidebarStatus =
    count > 0
      ? [`${size(bytesDone)} of ${size(bytesTotal)}`, eta]
          .filter(Boolean)
          .join(' · ')
      : subtitle

  return {
    list,
    visible,
    activeJobs,
    activeCount: activeJobs.length,
    count,
    busy,
    hasFinished,
    aggPercent,
    bytesTotal,
    title,
    subtitle,
    sidebarStatus,
  }
}
