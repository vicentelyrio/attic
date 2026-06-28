import { Text } from '@mantine/core'

import { useRoots } from '@domain'
import { size } from '@infrastructure'

import classes from './sidebar.module.css'

export function Storage() {
  const { data: roots = [] } = useRoots()

  const totalBytes = roots.reduce((acc, r) => acc + r.total, 0)
  const usedBytes = roots.reduce((acc, r) => acc + r.used, 0)
  const storagePercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0

  return (
    <div className={classes.storageSection}>
      <div className={classes.storageHeader}>
        <Text size="sm">Storage</Text>
        <Text size="sm" className={classes.muted}>{storagePercent}%</Text>
      </div>
      <div className={classes.progressTrack}>
        <div className={classes.progressFill} style={{ width: `${storagePercent}%` }} />
      </div>
      <Text size="xs" className={classes.muted} mt={6}>
        {size(usedBytes)} of {size(totalBytes)} used
      </Text>
    </div>
  )
}
