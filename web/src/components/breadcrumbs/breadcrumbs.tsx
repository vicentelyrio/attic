import { useMemo } from 'react'
import { Breadcrumbs as Bread, Text } from '@mantine/core'
import { AnchorLink } from '@components'

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

  return (
    <Bread separator="→" separatorMargin="md" mt="xs">
      {crumbs.map((crumb, i) =>
        i === crumbs.length - 1 ? (
          <Text key={crumb.target} c="dimmed">
            {crumb.label}
          </Text>
        ) : (
          <AnchorLink
            key={crumb.target}
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
