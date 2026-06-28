import { Link, useLocation } from '@tanstack/react-router'

import { useRoots, type Root } from '@domain'
import { size } from '@infrastructure'

import classes from './sidebar.module.css'

function dotClass(usedPercent: number) {
  if (usedPercent > 90) return classes.dotRed
  if (usedPercent > 70) return classes.dotOrange
  return classes.dotGreen
}

function DriveItem({ root, active }: { root: Root; active: boolean }) {
  const usedPercent = root.total > 0 ? (root.used / root.total) * 100 : 0
  return (
    <Link
      to="/$root/$"
      params={{ root: root.name, _splat: '' }}
      className={`${classes.driveItem} ${active ? classes.driveItemActive : ''}`}
    >
      <span className={`${classes.dot} ${dotClass(usedPercent)}`} />
      <span className={classes.driveName}>{root.name}</span>
      <span className={classes.driveCaption}>{size(root.total)}</span>
    </Link>
  )
}

export function Drivers() {
  const { data: roots = [] } = useRoots()
  const location = useLocation()

  const firstSegment = decodeURIComponent(location.pathname.split('/').filter(Boolean)[0] ?? '')

  return (
    <div className={classes.drivesSection}>
      <div className={classes.sectionLabel}>DRIVES</div>
      {roots.map((root) => (
        <DriveItem
          key={root.name}
          root={root}
          active={firstSegment === root.name}
        />
      ))}
    </div>
  )
}
