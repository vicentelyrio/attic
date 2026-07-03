import { fileBadge, fileKind } from '@infrastructure'

import { FolderSimpleIcon } from '@phosphor-icons/react'

import classes from './entry-icon.module.css'

export type EntryIconProps = {
  name: string
  isDir: boolean
  /** Box size in px. Badge text and folder glyph scale with it. @default 22 */
  size?: number
}

export function EntryIcon({ name, isDir, size = 22 }: EntryIconProps) {
  const box = { width: size, height: size }

  if (isDir) {
    return (
      <span className={`${classes.icon} ${classes.folder}`} style={box}>
        <FolderSimpleIcon weight="fill" size={Math.round(size * 0.82)} />
      </span>
    )
  }

  const { color } = fileKind(name)

  return (
    <span
      className={`${classes.icon} ${classes.badge}`}
      style={{
        ...box,
        fontSize: Math.round(size * 0.4),
        color,
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
      }}
    >
      {fileBadge(name).slice(0, 3)}
    </span>
  )
}
