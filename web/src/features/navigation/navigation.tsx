import type { ReactNode } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { NavLink } from '@mantine/core'
import {
  FolderSimpleIcon,
  ClockIcon,
  HeartIcon,
  ShareNetworkIcon,
  TrashIcon
} from '@phosphor-icons/react'

import classes from './navigation.module.css'

export type NavigationItem = {
  label: string
  to: LinkProps['to']
  icon: ReactNode
}

export type NavigationProps = {
  navigation: NavigationItem[]
}

export const navigation: NavigationItem[] = [
  { label: 'Files', icon: <FolderSimpleIcon />, to: '/' },
  { label: 'Recents', icon: <ClockIcon />, to: '/recents' },
  { label: 'Favorites', icon: <HeartIcon />, to: '/favorites' },
  { label: 'Shared', icon: <ShareNetworkIcon />, to: '/shared' },
  { label: 'Trash', icon: <TrashIcon />, to: '/trash' },
]

export function Navigation({ navigation }: NavigationProps) {
  return (
    <nav className={classes.nav}>
      {navigation.map(({ label, icon, to }) => (
        <NavLink
          component={Link}
          key={label}
          leftSection={icon}
          label={label}
          to={to}
          activeProps={{ className: classes.navItemActive }}
        />
      ))}
    </nav>
  )
}

