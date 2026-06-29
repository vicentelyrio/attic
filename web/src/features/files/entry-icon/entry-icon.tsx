import { fileBadge, fileKind } from '@infrastructure'
import { FolderSimpleIcon } from '@phosphor-icons/react'

import classes from './entry-icon.module.css'

export type EntryIconProps = {
  name: string
  isDir: boolean
}

export function EntryIcon({ name, isDir }: EntryIconProps) {
  if (isDir) {
    return (
      <span className={`${classes.icon} ${classes.folder}`}>
        <FolderSimpleIcon weight="fill" size={18} />
      </span>
    )
  }

  const { color } = fileKind(name)

  return (
    <span
      className={`${classes.icon} ${classes.badge}`}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
      }}
    >
      {fileBadge(name).slice(0, 3)}
    </span>
  )
}
