import { useJobs } from '@domain'

import type { TransfersState } from '../helpers'
import { useConflictResolution } from './use-conflict-resolution'
import { useDockView } from './use-dock-view'
import { useExpandOnNewJobs } from './use-expand-on-new-jobs'
import { useJobActions } from './use-job-actions'
import { useRefreshOnComplete } from './use-refresh-on-complete'
import { useTransferStats } from './use-transfer-stats'

export function useTransfers(): TransfersState {
  const { data: jobs } = useJobs()
  const stats = useTransferStats(jobs)
  const { view, setView, toggle } = useDockView()
  const { cancel, cancelAll, clear, clearPending } = useJobActions(
    stats.activeJobs,
  )
  const conflict = useConflictResolution()

  useExpandOnNewJobs(jobs, () => setView('expanded'))
  useRefreshOnComplete(jobs)

  return {
    view,
    setView,
    toggle,
    list: stats.list,
    visible: stats.visible,
    activeCount: stats.activeCount,
    count: stats.count,
    busy: stats.busy,
    hasFinished: stats.hasFinished,
    aggPercent: stats.aggPercent,
    bytesTotal: stats.bytesTotal,
    title: stats.title,
    subtitle: stats.subtitle,
    sidebarStatus: stats.sidebarStatus,
    cancel,
    cancelAll,
    clear,
    clearPending,
    ...conflict,
  }
}
