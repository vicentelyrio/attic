import type { MouseEvent } from 'react'

import { useI18nContext } from '@i18n'

import { CloseButton, Stack, Text } from '@mantine/core'

import { type Favorite, useFavorites } from '@domain'

import { NavLink } from '@features'

import classes from './favorites.module.css'

function FavoriteItem({
  favorite,
  onRemove,
}: {
  favorite: Favorite
  onRemove: (id: string) => void
}) {
  const { LL } = useI18nContext()

  const remove = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onRemove(favorite.id)
  }

  return (
    <NavLink
      className={classes.navItem}
      activeProps={{ className: classes.navItemActive }}
      to="/$root/$"
      params={{ root: favorite.root, _splat: favorite.path }}
      label={favorite.name}
      color="gray"
      rightSection={
        <CloseButton
          className={classes.remove}
          size="xs"
          onClick={remove}
          aria-label={LL.sidebar.removeFavorite({ name: favorite.name })}
        />
      }
    />
  )
}

export function Favorites() {
  const { LL } = useI18nContext()
  const { items, remove } = useFavorites()

  if (!items.length) return null

  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} c="dimmed">
        {LL.sidebar.favorites()}
      </Text>
      {items.map((favorite) => (
        <FavoriteItem
          key={favorite.id}
          favorite={favorite}
          onRemove={(id) => remove.mutate(id)}
        />
      ))}
    </Stack>
  )
}
