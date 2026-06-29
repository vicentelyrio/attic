import { useMemo } from 'react'
import { AnchorLink } from '@features'
import { Breadcrumbs as Bread, Text } from '@mantine/core'
import { CaretRightIcon } from '@phosphor-icons/react'

import classes from './breadcrumbs.module.css'

type BreadcrumbsProps = {
  path: string
  root: string
}

export function Breadcrumbs({ path, root }: BreadcrumbsProps) {
  const crumbs = useMemo(() => {
    const parts = path ? path.split('/') : []

    return [
      { label: root, target: '' },
      ...parts.map((seg, i) => ({
        label: seg,
        target: parts.slice(0, i + 1).join('/'),
      })),
    ]
  }, [path, root])

  const separator = (
    <CaretRightIcon className={classes.separator} size={12} weight="bold" />
  )

  return (
    <Bread separator={separator} separatorMargin="xs">
      {crumbs.map((crumb, i) =>
        i === crumbs.length - 1 ? (
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
        ),
      )}
    </Bread>
  )
}
