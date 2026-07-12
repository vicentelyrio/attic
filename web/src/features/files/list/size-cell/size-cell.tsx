import { sizeParts } from '@infrastructure'

import type { Entry } from '@domain'

import classes from '../list.module.css'

export function SizeCell({ entry }: { entry: Entry }) {
  if (entry.is_dir) return <span className={classes.dash}>—</span>

  const { value, unit } = sizeParts(entry.size)
  return (
    <>
      {value} <span className={classes.unit}>{unit}</span>
    </>
  )
}
