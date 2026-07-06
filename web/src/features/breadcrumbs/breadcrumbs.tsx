import { type ReactNode, useMemo } from 'react'

import { Breadcrumbs as Bread, Menu, Text, UnstyledButton } from '@mantine/core'

import { CaretRightIcon, DotsThreeIcon } from '@phosphor-icons/react'

import { AnchorLink } from '@features'

import classes from './breadcrumbs.module.css'

type BreadcrumbsProps = {
  path: string
  root: string
}

type Crumb = { label: string; target: string }

const HEAD = 1
const TAIL = 5
const MAX_VISIBLE = HEAD + TAIL + 1

export function Breadcrumbs({ path, root }: BreadcrumbsProps) {
  const crumbs = useMemo<Crumb[]>(() => {
    const parts = path ? path.split('/') : []

    return [
      { label: root, target: '' },
      ...parts.map((seg, i) => ({
        label: seg,
        target: parts.slice(0, i + 1).join('/'),
      })),
    ]
  }, [path, root])

  const items = useMemo<ReactNode[]>(() => {
    const link = (crumb: Crumb, isLast: boolean) =>
      isLast ? (
        <Text key={crumb.target} className={classes.current}>
          {crumb.label}
        </Text>
      ) : (
        <AnchorLink
          key={crumb.target}
          className={classes.link}
          to="/$root/$"
          params={{ root, _splat: crumb.target }}
        >
          {crumb.label}
        </AnchorLink>
      )

    if (crumbs.length <= MAX_VISIBLE) {
      return crumbs.map((crumb, i) => link(crumb, i === crumbs.length - 1))
    }

    const head = crumbs.slice(0, HEAD)
    const hidden = crumbs.slice(HEAD, crumbs.length - TAIL)
    const tail = crumbs.slice(crumbs.length - TAIL)

    return [
      ...head.map((crumb) => link(crumb, false)),
      <Menu key="__collapsed" position="bottom-start" withinPortal radius="md">
        <Menu.Target>
          <UnstyledButton
            className={classes.ellipsis}
            aria-label="Show hidden folders"
          >
            <DotsThreeIcon size={16} weight="bold" />
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {hidden.map((crumb) => (
            <Menu.Item
              key={crumb.target}
              renderRoot={(props) => (
                <AnchorLink
                  {...props}
                  to="/$root/$"
                  params={{ root, _splat: crumb.target }}
                />
              )}
            >
              {crumb.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>,
      ...tail.map((crumb, i) => link(crumb, i === tail.length - 1)),
    ]
  }, [crumbs, root])

  const separator = (
    <CaretRightIcon className={classes.separator} size={12} weight="bold" />
  )

  return (
    <Bread separator={separator} separatorMargin="xs" className={classes.root}>
      {items}
    </Bread>
  )
}
