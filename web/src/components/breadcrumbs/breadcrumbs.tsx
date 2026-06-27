import { useMemo } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Breadcrumbs as Bread, Anchor } from '@mantine/core'

export function Breadcrumbs() {
  const location = useLocation()

  const segments = useMemo(() => {
    const parts = location.pathname ? location.pathname.split('/') : []

    return parts.map((seg, i) => {
      const target = parts.slice(0, i + 1).join('/')
      return (
        <Anchor href={target} key={target} component={Link}>
          {seg}
        </Anchor>
      )
    })
  }, [location.pathname])

  return (
    <Bread separator="→" separatorMargin="md" mt="xs">
      {segments}
    </Bread>
  )
}
